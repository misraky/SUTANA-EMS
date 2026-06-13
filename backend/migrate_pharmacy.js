require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { db } = require('./src/config/database');

async function runMigration() {
  try {
    const sqlPath = path.resolve(__dirname, '../database/add_pharmacy_tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split by semicolons and run each statement
    const statements = sql.split(';').filter(stmt => stmt.trim() !== '');
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        await db.raw(statement);
      }
    }
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
