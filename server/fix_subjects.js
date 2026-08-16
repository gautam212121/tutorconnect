import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function fix() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Ajeet@143',
    database: process.env.DB_NAME || 'tutorconnect'
  });

  await connection.execute('UPDATE users SET subjects = ? WHERE id = ?', ['["Mathematics", "Physics", "English", "Chemistry"]', 4]);
  console.log("Fixed user 4");
  
  await connection.execute('UPDATE users SET subjects = ? WHERE id = ?', ['["Physics", "Maths"]', 2]);
  console.log("Fixed user 2");
  
  await connection.end();
}
fix().catch(console.error);
