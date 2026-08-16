import { execute } from './src/config/db.js';
import bcrypt from 'bcryptjs';

async function run() {
  const hashedPassword = await bcrypt.hash('password123', 10);
  await execute('UPDATE users SET password = ? WHERE id IN (4, 11)', [hashedPassword]);
  console.log('Reset passwords of Abhinav and Praveen Pal to password123 successfully.');
  process.exit(0);
}
run();
