const { db } = require('./src/config/database');

async function checkAndSeed() {
  console.log('Checking current state...\n');

  const cats = await db('product_categories').select('*');
  console.log('Categories:', cats.length, cats.map(c => c.name));

  const units = await db('units').select('*');
  console.log('Units:', units.length, units.map(u => u.name));

  const suppliers = await db('suppliers').select('*');
  console.log('Suppliers:', suppliers.length, suppliers.map(s => s.name));

  const customers = await db('customers').select('*');
  console.log('Customers:', customers.length, customers.map(c => c.name));

  const products = await db('products').select('*');
  console.log('Products:', products.length);

  const pos = await db('purchase_orders').select('*');
  console.log('Purchase Orders:', pos.length);

  // Seed missing data
  if (units.length === 0) {
    await db('units').insert([
      { name: 'Pieces', abbreviation: 'pcs' },
      { name: 'Reams', abbreviation: 'ream' },
      { name: 'Boxes', abbreviation: 'box' }
    ]);
    console.log('\n✅ Seeded 3 Units');
  }

  if (suppliers.length === 0) {
    await db('suppliers').insert({
      name: 'Ethio Office Supplies PLC',
      contact_person: 'Abebe Girma',
      phone: '0911111111',
      email: 'supplier@ethiooffice.com',
      address: 'Addis Ababa, Bole',
      is_active: true,
      created_at: db.fn.now()
    });
    console.log('✅ Seeded 1 Supplier');
  }

  if (customers.length === 0) {
    await db('customers').insert({
      name: 'Tigray Water Works',
      phone: '0922222222',
      email: 'procurement@tigraywaterworks.com',
      customer_type_id: 1,
      address: 'Mekelle, Tigray',
      credit_limit: 100000,
      current_balance: 0,
      created_at: db.fn.now()
    });
    console.log('✅ Seeded 1 Customer');
  }

  console.log('\n🎉 Database is ready for demo!');
  console.log('\n═══════════════════════════════════════');
  console.log('  LOGIN: admin@sutana.com');
  console.log('  PASSWORD: sutana@#!987');
  console.log('═══════════════════════════════════════\n');

  process.exit(0);
}

checkAndSeed().catch(e => { console.error('❌', e.message); process.exit(1); });
