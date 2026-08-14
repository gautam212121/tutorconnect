import mysql from 'mysql2/promise';

async function run() {
  try {
    const conn = await mysql.createConnection({ host: 'localhost', port: 3306, user: 'root', password: 'Ajeet@143', database: 'tutorconnect' });
    const [users] = await conn.query('SELECT id, name, email, role FROM users');
    console.log('MySQL Users:', users);
    
    const [callbacks] = await conn.query('SELECT * FROM callback_requests');
    console.log('MySQL Callbacks:', callbacks);
    await conn.end();
  } catch(e) {
    console.error(e);
  }
  process.exit(0);
}
run();
