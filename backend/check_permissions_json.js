const mysql = require('mysql2');

async function check() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'sutana_ems'
  }).promise();

  try {
    const [roles] = await pool.execute('SELECT name, permissions FROM roles');
    console.log(JSON.stringify(roles, null, 2));
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
check();
