const db = require('./src/config/database');

async function fixAll() {
  const rolePermissions = {
    'Store Manager': { inventory: ['create','read','update'], receiving: ['create','read'], reports: ['read'] },
    'HR Manager':    { hr: ['create','read','update','delete'], employees: ['create','read','update'], reports: ['read'] }
  };

  const rolesToAdd = ['Store Manager', 'HR Manager'];
  for (const r of rolesToAdd) {
    const [existing] = await db.db.raw("SELECT id FROM roles WHERE name = ?", [r]);
    if (existing.length === 0) {
      await db.db.raw(
        "INSERT INTO roles (name, description, permissions) VALUES (?, ?, ?)",
        [r, r, JSON.stringify(rolePermissions[r])]
      );
      console.log('Created role:', r);
    } else {
      console.log('Role already exists:', r);
    }
  }

  // Step 2: Assign roles to users
  const fixes = [
    { email: 'store@sutana.com',  role: 'Store Manager' },
    { email: 'hr@sutana.com',     role: 'HR Manager'    }
  ];

  for (const f of fixes) {
    const [user]    = await db.db.raw("SELECT id FROM users WHERE email = ?", [f.email]);
    const [roleRow] = await db.db.raw("SELECT id FROM roles WHERE name = ?",  [f.role]);

    if (!user.length)    { console.log('User not found:', f.email);  continue; }
    if (!roleRow.length) { console.log('Role not found:', f.role);   continue; }

    await db.db.raw("DELETE FROM user_roles WHERE user_id = ?", [user[0].id]);
    await db.db.raw(
      "INSERT INTO user_roles (user_id, role_id, assigned_at) VALUES (?, ?, NOW())",
      [user[0].id, roleRow[0].id]
    );
    console.log(`Assigned: ${f.email}  =>  ${f.role}`);
  }

  // Step 3: Show final state
  const [rows] = await db.db.raw(
    "SELECT u.email, r.name as role FROM users u LEFT JOIN user_roles ur ON u.id=ur.user_id LEFT JOIN roles r ON ur.role_id=r.id WHERE u.deleted_at IS NULL ORDER BY u.id"
  );
  console.log('\n=== Final User-Role Map ===');
  console.table(rows);

  process.exit();
}

fixAll();
