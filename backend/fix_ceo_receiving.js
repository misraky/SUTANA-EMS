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
      // CEO needs receiving:read and receiving:create to see the pending list
      if (role.name === 'CEO') {
        const perms = role.permissions;

        if (!perms.receiving) perms.receiving = [];
        if (!perms.receiving.includes('read')) perms.receiving.push('read');
        if (!perms.receiving.includes('create')) perms.receiving.push('create');

        // Also needs suppliers:read in case they browse suppliers too
        if (!perms.suppliers) perms.suppliers = [];
        if (!perms.suppliers.includes('read')) perms.suppliers.push('read');

        await pool.execute('UPDATE roles SET permissions = ? WHERE id = ?', [JSON.stringify(perms), role.id]);
        console.log('✅ Updated CEO permissions:', JSON.stringify(perms.receiving));
      }
    }
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
fix();
