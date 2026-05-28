const { db } = require('./src/config/database');
async function seed() {
  try {
    await db('expense_categories').insert([
      { id: 1, name: 'Office Supplies', requires_approval: false, approval_limit: 1000 },
      { id: 2, name: 'Travel', requires_approval: true, approval_limit: 500 },
      { id: 3, name: 'Logistics', requires_approval: true, approval_limit: 500 }
    ]).onConflict('id').merge();
    console.log('Seeded expense categories');
  } catch(e) {
    console.error(e);
  }
  process.exit(0);
}
seed();
