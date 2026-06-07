const mysql = require('mysql2');

async function run() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'sutana_ems'
  }).promise();

  try {
    const [departments] = await pool.execute('SELECT * FROM departments');
    console.log('Departments:', departments);

    const [users] = await pool.execute('SELECT email, department_id, password FROM users');
    console.log('Users:', users.map(u => ({ email: u.email, dept: u.department_id, hashLength: u.password.length })));
    
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

run();
