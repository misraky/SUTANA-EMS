const db = require('./src/config/database');
const bcrypt = require('bcrypt');

async function createWorker() {
  const hash = await bcrypt.hash('sutana@#!987', 10);
  const [activeStatus] = await db.db.raw("SELECT id FROM user_statuses WHERE status_code = 'active'");
  const sId = activeStatus[0].id;
  
  const [departments] = await db.db.raw("SELECT id, name FROM departments");
  const salesDeptId = departments.find(d => d.name === 'Sales').id;
  
  const u = { email: 'farming-worker@sutana.com', name: 'Farming Worker', role: 'Farming Worker', dept: salesDeptId };
  
  const [existing] = await db.db.raw("SELECT id FROM users WHERE email = ?", [u.email]);
  let uid;
  if (existing.length === 0) {
    const phone = '0999' + Math.floor(100000 + Math.random() * 900000);
    const [res] = await db.db.raw("INSERT INTO users (full_name, email, phone, password, department_id, status_id, must_change_password, created_at) VALUES (?, ?, ?, ?, ?, ?, 1, NOW())", [u.name, u.email, phone, hash, u.dept, sId]);
    uid = res.insertId;
  } else {
    uid = existing[0].id;
  }
  const [roleRow] = await db.db.raw("SELECT id FROM roles WHERE name = ?", [u.role]);
  await db.db.raw("DELETE FROM user_roles WHERE user_id = ?", [uid]);
  if (roleRow.length > 0) {
    await db.db.raw("INSERT INTO user_roles (user_id, role_id, assigned_at) VALUES (?, ?, NOW())", [uid, roleRow[0].id]);
  }
  process.exit();
}

createWorker();
