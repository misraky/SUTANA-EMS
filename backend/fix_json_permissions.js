const mysql = require('mysql2');

async function fix() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'sutana_ems'
  }).promise();

  try {
    const [roles] = await pool.execute('SELECT id, name, permissions FROM roles');
    
    for (const role of roles) {
      if (role.name === 'Purchase') {
        const perms = role.permissions;
        if (perms.purchase_orders && !perms.purchase_orders.includes('approve')) {
          perms.purchase_orders.push('approve');
          
          await pool.execute('UPDATE roles SET permissions = ? WHERE id = ?', [JSON.stringify(perms), role.id]);
          console.log('✅ Added approve permission to Purchase role');
        }
      }
      
      if (role.name === 'CEO') {
        const perms = role.permissions;
        if (!perms.purchase_orders) perms.purchase_orders = [];
        if (!perms.purchase_orders.includes('approve')) {
          perms.purchase_orders.push('approve');
          
          await pool.execute('UPDATE roles SET permissions = ? WHERE id = ?', [JSON.stringify(perms), role.id]);
          console.log('✅ Added approve permission to CEO role');
        }
      }
    }
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
fix();
