const bcrypt = require('bcrypt');
const mysql = require('mysql2');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'sutana_ems'
}).promise();

async function createAllUsers() {
    const password = 'sutana@#!987';
    const hash = await bcrypt.hash(password, 10);
    
    // Get department IDs and status ID
    const [departments] = await pool.execute("SELECT id, name FROM departments");
    const [activeStatus] = await pool.execute("SELECT id FROM user_statuses WHERE status_code = 'active'");
    const activeStatusId = activeStatus[0]?.id;
    
    if (!activeStatusId) {
        console.error('❌ Active user status not found. Please run migrations first.');
        process.exit(1);
    }
    
    // Map department names to IDs
    const deptMap = {};
    departments.forEach(dept => {
        deptMap[dept.name] = dept.id;
    });
    
    // Users mapped to YOUR 8 roles
    const users = [
        { 
            email: 'admin@sutana.com', 
            full_name: 'Kidist Belay', 
            phone: '0911000000', 
            department: 'Admin',
            role: 'Admin'
        },
        { 
            email: 'ceo@sutana.com', 
            full_name: 'Habtamu Abera', 
            phone: '0912345671', 
            department: 'CEO',
            role: 'CEO'
        },
        { 
            email: 'finance@sutana.com', 
            full_name: 'Melat Sisay', 
            phone: '0912345672', 
            department: 'Finance',
            role: 'Finance'
        },
        { 
            email: 'printing@sutana.com', 
            full_name: 'Ephrem Abebe', 
            phone: '0912345673', 
            department: 'Printing',
            role: 'Printing Supervisor'
        },
        { 
            email: 'purchase@sutana.com', 
            full_name: 'Getaneh Mihtere', 
            phone: '0912345674', 
            department: 'Purchase',
            role: 'Purchase'
        },
        { 
            email: 'inventory@sutana.com', 
            full_name: 'Shibabaw Alemu', 
            phone: '0912345675', 
            department: 'Inventory',
            role: 'Store Worker'
        },
        { 
            email: 'sales@sutana.com', 
            full_name: 'Dereje Alemneh', 
            phone: '0901407032', 
            department: 'Sales',
            role: 'Sales/Cashier'
        },
        { 
            email: 'customer@sutana.com', 
            full_name: 'Customer User', 
            phone: '0912345676', 
            department: 'Sales',
            role: 'Customer'
        }
    ];
    
    console.log('\n📋 Creating users with roles:\n');
    
    for (const user of users) {
        // Check if user already exists
        const [existing] = await pool.execute("SELECT id FROM users WHERE email = ? OR phone = ?", [user.email, user.phone]);
        
        if (existing.length > 0) {
            console.log(`⚠️  User already exists: ${user.email} - Updating password and role...`);
            
            // Update existing user
            const departmentId = deptMap[user.department];
            await pool.execute(`
                UPDATE users 
                SET full_name = ?, phone = ?, department_id = ?, status_id = ?, password = ?, must_change_password = ?, deleted_at = NULL
                WHERE email = ?
            `, [user.full_name, user.phone, departmentId, activeStatusId, hash, true, user.email]);
            
            // Get user ID
            const [userId] = await pool.execute("SELECT id FROM users WHERE email = ?", [user.email]);
            
            // Delete existing roles
            await pool.execute("DELETE FROM user_roles WHERE user_id = ?", [userId[0].id]);
            
            // Assign new role
            const [roles] = await pool.execute("SELECT id FROM roles WHERE name = ?", [user.role]);
            if (roles.length > 0) {
                await pool.execute(`
                    INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at) 
                    VALUES (?, ?, NULL, NOW())
                `, [userId[0].id, roles[0].id]);
            }
            
            console.log(`✅ Updated: ${user.email} (${user.role})`);
            continue;
        }
        
        const departmentId = deptMap[user.department];
        if (!departmentId) {
            console.error(`❌ Department not found: ${user.department} for user ${user.email}`);
            continue;
        }
        
        // Insert user
        const [result] = await pool.execute(`
            INSERT INTO users (full_name, email, phone, password, department_id, status_id, must_change_password, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        `, [user.full_name, user.email, user.phone, hash, departmentId, activeStatusId, true]);
        
        const userId = result.insertId;
        
        // Get role ID
        const [roles] = await pool.execute("SELECT id FROM roles WHERE name = ?", [user.role]);
        
        if (roles.length === 0) {
            console.error(`❌ Role not found: ${user.role} for user ${user.email}`);
            console.log(`   Available roles: Admin, CEO, Finance, Printing Supervisor, Purchase, Store Worker, Sales/Cashier, Customer`);
            continue;
        }
        
        // Assign role to user
        await pool.execute(`
            INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at) 
            VALUES (?, ?, NULL, NOW())
        `, [userId, roles[0].id]);
        
        console.log(`✅ Created: ${user.email} (${user.role})`);
    }
    
    // Display all created users with their roles
    console.log('\n📋 Current Users in System:');
    const [allUsers] = await pool.execute(`
        SELECT u.id, u.email, u.full_name, u.phone, d.name as department, r.name as role, 
               CASE WHEN u.must_change_password = 1 THEN 'Yes' ELSE 'No' END as must_change_password
        FROM users u
        JOIN departments d ON u.department_id = d.id
        JOIN user_roles ur ON u.id = ur.user_id
        JOIN roles r ON ur.role_id = r.id
        WHERE u.deleted_at IS NULL
        ORDER BY r.id, u.id
    `);
    
    console.table(allUsers);
    
    // Show role count
    const [roleCount] = await pool.execute(`
        SELECT r.name, COUNT(ur.user_id) as user_count
        FROM roles r
        LEFT JOIN user_roles ur ON r.id = ur.role_id
        GROUP BY r.id
        ORDER BY r.id
    `);
    
    console.log('\n📊 Role Distribution:');
    console.table(roleCount);
    
    console.log('\n🎉 All users created/updated successfully!');
    console.log('📝 Default password for all users: sutana@#!987');
    console.log('⚠️  Users will be prompted to change password on first login');
    
    process.exit(0);
}

createAllUsers().catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
});