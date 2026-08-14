import { query } from './src/config/db.js';

async function run() {
  try {
    const users = await query('SELECT id, name, email, role FROM users');
    console.log('Users:', users);
    
    const callbacks = await query('SELECT * FROM callback_requests');
    console.log('Callbacks:', callbacks);
  } catch(e) {
    console.error(e);
  }
  process.exit(0);
}
run();
