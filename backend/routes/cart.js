const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');

// Получить корзину пользователя
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        *,
        products (*)
      `)
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Добавить в корзину
router.post('/add', authenticateToken, async (req, res) => {
  try {
    const { product_id, quantity = 1 } = req.body;

    if (!product_id) {
      return res.status(400).json({ error: 'Product ID required' });
    }

    // Проверка наличия товара на складе
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('stock')
      .eq('id', product_id)
      .single();

    if (productError || !product) {
      return res.status(400).json({ error: 'Товар не найден' });
    }

    // Проверка наличия товара в корзине
    const { data: existingItem } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('product_id', product_id)
      .single();

    const newQuantity = existingItem ? existingItem.quantity + quantity : quantity;

    // Проверка достаточности товара на складе
    if (product.stock < newQuantity) {
      return res.status(400).json({ 
        error: `Недостаточно товара на складе. Доступно: ${product.stock}` 
      });
    }

    if (existingItem) {
      // Обновление количества
      const { data, error } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', existingItem.id)
        .select()
        .single();

      if (error) throw error;
      return res.json(data);
    }

    // Добавление нового товара
    const { data, error } = await supabase
      .from('cart_items')
      .insert([
        {
          user_id: req.user.id,
          product_id,
          quantity
        }
      ])
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Обновить товар в корзине
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { quantity } = req.body;

    if (quantity <= 0) {
      return res.status(400).json({ error: 'Количество должно быть больше 0' });
    }

    // Получение товара из корзины с информацией о продукте
    const { data: cartItem, error: cartError } = await supabase
      .from('cart_items')
      .select(`
        *,
        products (*)
      `)
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (cartError || !cartItem) {
      return res.status(404).json({ error: 'Товар в корзине не найден' });
    }

    // Проверка наличия товара на складе
    if (cartItem.products.stock < quantity) {
      return res.status(400).json({ 
        error: `Недостаточно товара на складе. Доступно: ${cartItem.products.stock}` 
      });
    }

    const { data, error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Удалить из корзины
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ message: 'Item removed from cart' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;


