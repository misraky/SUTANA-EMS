const db = require('./src/config/database');
const bcrypt = require('bcrypt');

async function createPrintingWorker() {
  const hash = await bcrypt.hash('sutana@#!987', 10);
  const [activeStatus] = await db.db.raw("SELECT id FROM user_statuses WHERE status_code = 'active'");
  const sId = activeStatus[0].id;
  const [departments] = await db.db.raw("SELECT id, name FROM departments");
  const printingDept = departments.find(d => d.name === 'Printing');
  if (!printingDept) {
    console.error('Printing department not found');
    process.exit(1);
  }
  // Create Printing Worker role with permissions
  const perms = JSON.stringify({ orders: ['create', 'read'], pos: ['create', 'read'], tax_receipts: ['create', 'read'] });
  const [existingRole] = await db.db.raw("SELECT id FROM roles WHERE name = ?", ['Printing Worker']);
  let roleId;
  if (existingRole.length === 0) {
    const [res] = await db.db.raw("INSERT INTO roles (name, description, permissions) VALUES (?, ?, ?)", ['Printing Worker', 'Printing operations and POS', perms]);
    roleId = res.insertId;
    console.log('Created role: Printing Worker');
  } else {
    roleId = existingRole[0].id;
    await db.db.raw("UPDATE roles SET permissions = ? WHERE id = ?", [perms, roleId]);
    console.log('Updated role: Printing Worker');
  }
  // Create user
  const email = 'printing-worker@sutana.com';
  const [existingUser] = await db.db.raw("SELECT id FROM users WHERE email = ?", [email]);
  let uid;
  if (existingUser.length === 0) {
    const [res] = await db.db.raw(
      "INSERT INTO users (full_name, email, phone, password, department_id, status_id, must_change_password, created_at) VALUES (?, ?, ?, ?, ?, ?, 1, NOW())",
      ['Chaltu Tadesse', email, '0912345678', hash, printingDept.id, sId]
    );
    uid = res.insertId;
    console.log('Created user:', email);
  } else {
    uid = existingUser[0].id;
    await db.db.raw("UPDATE users SET password = ?, full_name = ?, department_id = ?, status_id = ? WHERE id = ?", [hash, 'Chaltu Tadesse', printingDept.id, sId, uid]);
    console.log('Updated user:', email);
  }
  // Assign role
  await db.db.raw("DELETE FROM user_roles WHERE user_id = ?", [uid]);
  await db.db.raw("INSERT INTO user_roles (user_id, role_id, assigned_at) VALUES (?, ?, NOW())", [uid, roleId]);
  console.log('Assigned role: Printing Worker');
  console.log('\nDone!');
  process.exit(0);
}
createPrintingWorker().catch(e => { console.error(e); process.exit(1); });
