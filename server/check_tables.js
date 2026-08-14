import mysql from 'mysql2/promise';

async function run() {
  try {
    const conn = await mysql.createConnection({ host: 'localhost', port: 3306, user: 'root', password: 'Ajeet@143', database: 'tutorconnect' });
    const [tables] = await conn.query('SHOW TABLES');
    console.log('Tables in tutorconnect:', tables);

    // Let's also check if there's any data in users table
    if (tables.length > 0 && tables.some(t => Object.values(t)[0] === 'users')) {
       const [users] = await conn.query('SELECT * FROM users');
       console.log('Users in DB:', users.length);
    }
    await conn.end();
  } catch(e) {
    console.error(e);
  }
  process.exit(0);
}
run();
