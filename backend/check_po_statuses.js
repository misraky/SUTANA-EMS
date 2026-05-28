const mysql = require('mysql2');

async function check() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'sutana_ems'
  }).promise();

  try {
    const [statuses] = await pool.execute('SELECT * FROM po_statuses');
    console.log('PO Statuses:', statuses);
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
check();
