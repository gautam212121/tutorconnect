import mysql from 'mysql2/promise';

async function testConnection() {
  const configs = [
    { host: 'localhost', port: 3306, user: 'root', password: 'Ajeet@143' },
    { host: 'localhost', port: 3306, user: 'root', password: '' }
  ];

  for (const conf of configs) {
    try {
      console.log(`Trying to connect with user: ${conf.user}, password: "${conf.password}"...`);
      const conn = await mysql.createConnection(conf);
      console.log('SUCCESS: Connected to MySQL!');
      
      // Check if tutorconnect DB exists
      const [rows] = await conn.query("SHOW DATABASES LIKE 'tutorconnect'");
      if (rows.length === 0) {
        console.log('Database "tutorconnect" does NOT exist. Creating it now...');
        await conn.query('CREATE DATABASE tutorconnect');
        console.log('Database created successfully.');
      } else {
        console.log('Database "tutorconnect" already exists.');
      }
      
      await conn.end();
      return conf.password;
    } catch (err) {
      console.log(`FAILED: ${err.message}`);
    }
  }
}

testConnection().then(pwd => {
  if (pwd !== undefined) {
    console.log(`\nValid password is: "${pwd}"`);
  } else {
    console.log('\nCould not connect to MySQL. Is XAMPP MySQL running?');
  }
  process.exit(0);
});
