import { query } from './src/config/db.js';

async function run() {
  const users = await query('SELECT * FROM users WHERE id = 4');
  console.log(JSON.stringify(users[0], null, 2));
  process.exit(0);
}
run();
