const mysql = require('mysql2');

async function check() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'sutana_ems'
  }).promise();

  try {
    const [permissions] = await pool.execute(`
      SELECT r.name as role, p.name as permission 
      FROM role_permissions rp 
      JOIN roles r ON rp.role_id = r.id 
      JOIN permissions p ON rp.permission_id = p.id 
      WHERE p.name = 'purchase_orders:approve'
    `);
    console.log('Roles with purchase_orders:approve:', permissions);

    const [adminRoles] = await pool.execute(`
      SELECT p.name as permission 
      FROM role_permissions rp 
      JOIN roles r ON rp.role_id = r.id 
      JOIN permissions p ON rp.permission_id = p.id 
      WHERE r.name = 'Admin'
    `);
    console.log('Admin permissions:', adminRoles.map(r => r.permission));

  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
check();
