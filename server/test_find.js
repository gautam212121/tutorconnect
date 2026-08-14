import User from './src/models/User.js';

async function run() {
  try {
    const users = await User.find({ role: 'student' });
    console.log('Students:', users);
  } catch(e) {
    console.error(e);
  }
  process.exit(0);
}
run();
