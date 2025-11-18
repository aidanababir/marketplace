const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Генерация уникального номера заказа
const generateOrderNumber = () => {
  return 'ORD-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
};

// Создание заказа
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { cartItems, shippingInfo } = req.body;

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ error: 'Cart items required' });
    }

    if (!shippingInfo || !shippingInfo.fullName || !shippingInfo.phone || !shippingInfo.city || !shippingInfo.address) {
      return res.status(400).json({ error: 'Shipping information required' });
    }

    // Проверка наличия товара на складе и расчет общей суммы
    const totalAmount = cartItems.reduce((total, item) => {
      return total + (item.products?.price || 0) * item.quantity;
    }, 0);

    // Проверка наличия товара для всех позиций перед созданием заказа
    for (const item of cartItems) {
      const productId = item.product_id;
      const requestedQuantity = item.quantity;

      // Получение текущего количества товара на складе
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('stock')
        .eq('id', productId)
        .single();

      if (productError) {
        return res.status(400).json({ error: `Товар с ID ${productId} не найден` });
      }

      if (product.stock < requestedQuantity) {
        return res.status(400).json({ 
          error: `Недостаточно товара на складе. Доступно: ${product.stock}, запрошено: ${requestedQuantity}` 
        });
      }
    }

    // Создание заказа
    const orderNumber = generateOrderNumber();
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([
        {
          user_id: req.user.id,
          order_number: orderNumber,
          status: 'pending',
          total_amount: totalAmount,
          full_name: shippingInfo.fullName,
          phone: shippingInfo.phone,
          city: shippingInfo.city,
          address: shippingInfo.address,
          postal_code: shippingInfo.postalCode || null
        }
      ])
      .select()
      .single();

    if (orderError) throw orderError;

    // Создание позиций заказа и уменьшение количества на складе
    const orderItems = cartItems.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.products?.price || 0
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    // Уменьшение количества товара на складе для всех товаров в заказе
    for (const item of cartItems) {
      const productId = item.product_id;
      const quantity = item.quantity;

      // Получение текущего количества на складе
      const { data: product } = await supabase
        .from('products')
        .select('stock')
        .eq('id', productId)
        .single();

      if (product) {
        const newStock = Math.max(0, product.stock - quantity);
        
        // Обновление количества на складе
        await supabase
          .from('products')
          .update({ stock: newStock })
          .eq('id', productId);
      }
    }

    // Получение полного заказа с позициями
    const { data: fullOrder, error: fetchError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (*)
        )
      `)
      .eq('id', order.id)
      .single();

    if (fetchError) throw fetchError;

    res.status(201).json(fullOrder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получить заказы пользователя
router.get('/my-orders', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (*)
        )
      `)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получить один заказ
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (*)
        )
      `)
      .eq('id', req.params.id)
      .single();

    if (error) throw error;

    // Проверка принадлежности заказа пользователю или прав администратора
    if (data.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Админ: Получить все заказы
router.get('/admin/all', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (*)
        ),
        users (
          id,
          email,
          name
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Админ: Обновить статус заказа
router.put('/admin/:id/status', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !['pending', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Valid status required' });
    }

    // Получение текущего заказа для проверки предыдущего статуса
    const { data: currentOrder, error: fetchError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (*)
        )
      `)
      .eq('id', req.params.id)
      .single();

    if (fetchError) throw fetchError;

    // Если заказ отменяется, возвращаем товар на склад
    if (status === 'cancelled' && currentOrder.status !== 'cancelled') {
      for (const item of currentOrder.order_items || []) {
        const productId = item.product_id;
        const quantity = item.quantity;

        // Получение текущего количества на складе
        const { data: product } = await supabase
          .from('products')
          .select('stock')
          .eq('id', productId)
          .single();

        if (product) {
          const newStock = (product.stock || 0) + quantity;
          
          // Обновление количества на складе
          await supabase
            .from('products')
            .update({ stock: newStock })
            .eq('id', productId);
        }
      }
    }

    // Обновление статуса заказа
    const { data, error } = await supabase
      .from('orders')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

