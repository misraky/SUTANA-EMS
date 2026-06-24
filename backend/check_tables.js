const { db } = require('./src/config/database');
async function t() {
  try {
    const r = await db.raw('SHOW TABLES LIKE ?', ['payroll%']);
    console.log('payroll tables:', r[0].map(x => Object.values(x)[0]));
    const r2 = await db.raw('SHOW TABLES LIKE ?', ['attendance%']);
    console.log('attendance tables:', r2[0].map(x => Object.values(x)[0]));
    const r3 = await db.raw('SHOW TABLES LIKE ?', ['leave%']);
    console.log('leave tables:', r3[0].map(x => Object.values(x)[0]));
  } catch(e) { console.log(e.message); }
  process.exit();
}
t();
