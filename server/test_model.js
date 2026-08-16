import User from './src/models/User.js';
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'Ajeet@143',
  database: 'tutorconnect'
});

// Mock the execute function
import * as dbModule from './src/config/db.js';
dbModule.execute = async (sql, params) => {
  const [rows] = await pool.query(sql, params);
  return rows;
};
dbModule.query = async (sql, params) => {
  const [rows] = await pool.query(sql, params);
  return rows;
};

async function test() {
  try {
    const id = 4;
    const updates = { status: 'active', verified: true };
    const user = await User.findByIdAndUpdate(id, updates, { new: true });
    console.log("Success:", user);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
}
test();
