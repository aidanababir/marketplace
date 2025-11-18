// Убеждаемся, что dotenv загружен
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Ошибка: Отсутствуют переменные окружения Supabase!');
  console.error('Убедитесь, что файл .env существует в папке backend/ и содержит:');
  console.error('  SUPABASE_URL=...');
  console.error('  SUPABASE_SERVICE_KEY=...');
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;

