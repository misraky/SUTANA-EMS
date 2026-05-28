const { db } = require('./src/config/database');

async function fixPermissions() {
  try {
    // Get the permission ID for 'purchase_orders:approve'
    const permission = await db('permissions').where({ name: 'purchase_orders:approve' }).first();
    if (!permission) {
      console.log('Permission not found!');
      process.exit(1);
    }

    // Get the roles that might need this permission for the demo
    const roles = await db('roles').whereIn('name', ['Purchase', 'Printing Supervisor', 'Admin', 'CEO']);
    
    for (const role of roles) {
      // Check if role already has this permission
      const existing = await db('role_permissions').where({
        role_id: role.id,
        permission_id: permission.id
      }).first();

      if (!existing) {
        await db('role_permissions').insert({
          role_id: role.id,
          permission_id: permission.id
        });
        console.log(`✅ Added 'purchase_orders:approve' to role: ${role.name}`);
      } else {
        console.log(`ℹ️ Role ${role.name} already has the permission.`);
      }
    }
  } catch (error) {
    console.error(error);
  } finally {
    process.exit(0);
  }
}

fixPermissions();
