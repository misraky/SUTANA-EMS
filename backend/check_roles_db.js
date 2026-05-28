const mysql = require('mysql2');

async function check() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'sutana_ems'
  }).promise();

  try {
    const [roles] = await pool.execute('SELECT id, name FROM roles');
    console.log('Roles:', roles);

    const [users] = await pool.execute('SELECT id, email, deleted_at FROM users');
    console.log('Users:', users);
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
check();
