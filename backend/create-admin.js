// Скрипт для создания первого админа
// Запуск: node create-admin.js

require('dotenv').config();
const bcrypt = require('bcryptjs');
const supabase = require('./config/supabase');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createAdmin() {
  try {
    console.log('Создание администратора...\n');
    
    const email = await question('Email: ');
    const password = await question('Пароль: ');
    const name = await question('Имя (необязательно): ') || email.split('@')[0];

    // Проверка существования пользователя
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (existingUser) {
      // Обновление роли существующего пользователя
      const hashedPassword = await bcrypt.hash(password, 10);
      const { data, error } = await supabase
        .from('users')
        .update({
          password: hashedPassword,
          role: 'admin',
          name
        })
        .eq('email', email)
        .select()
        .single();

      if (error) throw error;
      console.log('\n✅ Пользователь обновлен и назначен администратором!');
      console.log('Email:', data.email);
      console.log('Роль:', data.role);
    } else {
      // Создание нового администратора
      const hashedPassword = await bcrypt.hash(password, 10);
      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            email,
            password: hashedPassword,
            name,
            role: 'admin'
          }
        ])
        .select()
        .single();

      if (error) throw error;
      console.log('\n✅ Администратор успешно создан!');
      console.log('Email:', data.email);
      console.log('Роль:', data.role);
    }
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    rl.close();
  }
}

createAdmin();


