const { db } = require('./src/config/database');
const config = require('./src/config/env');

async function debugApprove() {
  try {
    const id = 7;
    
    console.log('1. Fetching PO...');
    const purchaseOrder = await db('purchase_orders as po')
      .leftJoin('suppliers as s', 'po.supplier_id', 's.id')
      .leftJoin('po_statuses as ps', 'po.status_id', 'ps.id')
      .select('po.*', 's.name as supplier_name', 'ps.status_code as current_status')
      .where('po.id', id)
      .whereNull('po.deleted_at')
      .first();
    
    console.log('PO:', JSON.stringify(purchaseOrder, null, 2));
    
    console.log('\n2. Checking config...');
    console.log('businessRules:', config.businessRules);
    
    console.log('\n3. Checking status record...');
    const statusRecord = await db('po_statuses').where('status_code', 'approved').first();
    console.log('Status record:', statusRecord);
    
    console.log('\n4. Checking audit function...');
    const { audit } = require('./src/config/logger');
    console.log('audit type:', typeof audit);
    
    console.log('\nAll checks passed!');
  } catch(e) {
    console.error('ERROR:', e.message);
    console.error(e.stack);
  } finally {
    process.exit(0);
  }
}
debugApprove();
