const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Все админские маршруты требуют аутентификации и роли администратора
router.use(authenticateToken);
router.use(isAdmin);

// Получить все товары (админ)
router.get('/products', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Создать товар
router.post('/products', async (req, res) => {
  try {
    const { name, description, price, image_url, stock } = req.body;

    if (!name || !price) {
      return res.status(400).json({ error: 'Name and price required' });
    }

    // Сохраняем ID создателя (текущего админа)
    const { data, error } = await supabase
      .from('products')
      .insert([
        {
          name,
          description: description || '',
          price,
          image_url: image_url || '',
          stock: stock || 0,
          created_by: req.user.id // Сохраняем ID создателя
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

// Обновить товар
router.put('/products/:id', async (req, res) => {
  try {
    const { name, description, price, image_url, stock } = req.body;

    const { data, error } = await supabase
      .from('products')
      .update({
        name,
        description,
        price,
        image_url,
        stock
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

// Удалить товар
router.delete('/products/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;


