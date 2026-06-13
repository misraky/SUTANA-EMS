const fs = require('fs');
const path = require('path');
const { db } = require('./src/config/database');

async function runSQL() {
  try {
    const sqlPath = path.join(__dirname, '../database/add_prescription_requests_table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Running SQL...');
    await db.raw(sql);
    console.log('SQL executed successfully!');
    
  } catch (error) {
    console.error('Error executing SQL:', error);
  } finally {
    process.exit(0);
  }
}

runSQL();
