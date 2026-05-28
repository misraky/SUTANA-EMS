const mysql = require('mysql2');

async function run() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'sutana_ems'
  }).promise();

  try {
    const [roles] = await pool.execute('SELECT u.email, r.name as role FROM users u LEFT JOIN user_roles ur ON u.id = ur.user_id LEFT JOIN roles r ON ur.role_id = r.id');
    console.log('User Roles:', roles);
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

run();
