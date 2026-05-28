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
      // 1. Remove 'approve' from Purchase
      if (role.name === 'Purchase') {
        const perms = role.permissions;
        if (perms.purchase_orders && perms.purchase_orders.includes('approve')) {
          perms.purchase_orders = perms.purchase_orders.filter(p => p !== 'approve');
          
          await pool.execute('UPDATE roles SET permissions = ? WHERE id = ?', [JSON.stringify(perms), role.id]);
          console.log('✅ Removed approve permission from Purchase role');
        }
      }
      
      // 2. Add 'read', 'approve' (and maybe 'update') to CEO for purchase_orders
      if (role.name === 'CEO') {
        const perms = role.permissions;
        if (!perms.purchase_orders) perms.purchase_orders = [];
        
        if (!perms.purchase_orders.includes('read')) perms.purchase_orders.push('read');
        if (!perms.purchase_orders.includes('approve')) perms.purchase_orders.push('approve');
        
        // Also add suppliers:read just in case CEO needs to see supplier details
        if (!perms.suppliers) perms.suppliers = [];
        if (!perms.suppliers.includes('read')) perms.suppliers.push('read');

        await pool.execute('UPDATE roles SET permissions = ? WHERE id = ?', [JSON.stringify(perms), role.id]);
        console.log('✅ Added read and approve permission to CEO role');
      }
    }
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
fix();
