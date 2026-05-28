const bcrypt = require('bcrypt');
const mysql = require('mysql2');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'sutana_ems'
}).promise();

async function resetAllPasswords() {
    const password = 'sutana@#!987';
    const hash = await bcrypt.hash(password, 10);
    
    console.log('✅ New hash generated for password: sutana@#!987');
    
    // Reset password for all active users
    const [result] = await pool.execute(
        "UPDATE users SET password = ?, must_change_password = ? WHERE deleted_at IS NULL",
        [hash, true]
    );
    
    console.log(`\n✅ Password reset for ${result.affectedRows} user(s)`);
    console.log('⚠️  All users will be required to change password on next login');
    
    // Show updated users
    const [users] = await pool.execute(`
        SELECT u.email, u.full_name, r.name as role, 
               CASE WHEN u.must_change_password = 1 THEN 'Yes' ELSE 'No' END as must_change_password
        FROM users u
        JOIN user_roles ur ON u.id = ur.user_id
        JOIN roles r ON ur.role_id = r.id
        WHERE u.deleted_at IS NULL
        ORDER BY r.id
    `);
    
    console.log('\n📋 Users with reset passwords:');
    console.table(users);
    
    console.log('\n🔐 All passwords reset to: sutana@#!987');
    
    process.exit(0);
}

resetAllPasswords().catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
});