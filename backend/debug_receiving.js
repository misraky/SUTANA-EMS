const { db, transaction } = require('./src/config/database');

async function debugReceiving() {
  try {
    const poId = 7;
    // Get actual PO items for PO 7
    const dbItems = await db('po_items').where('po_id', poId);
    
    const items = dbItems.map(item => ({
      poItemId: item.id,
      quantityReceived: item.quantity_ordered,
      quantityDamaged: 0,
      qualityPass: true
    }));
    
    const purchaseOrder = await db('purchase_orders as po')
      .leftJoin('po_statuses as ps', 'po.status_id', 'ps.id')
      .select('po.*', 'ps.status_code', 'po.po_number')
      .where('po.id', poId)
      .whereNull('po.deleted_at')
      .first();
      
    if (!purchaseOrder) throw new Error('PO not found');
    console.log('PO Status:', purchaseOrder.status_code);
    
    await transaction(async (trx) => {
        let allReceived = true;
        let anyReceived = false;
        for (const item of items) {
          const poItem = await trx('po_items')
            .where('id', item.poItemId)
            .where('po_id', poId)
            .first();
            
          const newReceived = poItem.quantity_received + item.quantityReceived;
          const newDamaged = (poItem.quantity_damaged || 0) + (item.quantityDamaged || 0);
          
          await trx('po_items')
            .where('id', item.poItemId)
            .update({
              quantity_received: newReceived,
              quantity_damaged: newDamaged,
              quality_pass: item.qualityPass
            });
            
          const goodQuantity = item.quantityReceived;
          if (goodQuantity > 0 && poItem.product_id) {
            const currentInventory = await trx('inventory')
              .where('product_id', poItem.product_id)
              .first();
              
            if (currentInventory) {
              const newQuantity = currentInventory.quantity + goodQuantity;
              const newAvgCost = ((currentInventory.quantity * currentInventory.unit_cost) + (goodQuantity * poItem.unit_price)) / newQuantity;
              await trx('inventory')
                .where('product_id', poItem.product_id)
                .update({
                  quantity: newQuantity,
                  unit_cost: newAvgCost,
                  last_updated: db.fn.now()
                });
            } else {
              await trx('inventory').insert({
                product_id: poItem.product_id,
                quantity: goodQuantity,
                unit_cost: poItem.unit_price,
                last_updated: db.fn.now()
              });
            }
            
            await trx('inventory_movements').insert({
              product_id: poItem.product_id,
              transaction_type: 'Purchase',
              quantity_change: goodQuantity,
              quantity_before: currentInventory?.quantity || 0,
              quantity_after: (currentInventory?.quantity || 0) + goodQuantity,
              reference_type: 'PO',
              reference_id: poId,
              reason: `Purchase order ${purchaseOrder.po_number}`,
              performed_by: 1,
              created_at: db.fn.now()
            });
          }
        }
        
        throw new Error("ROLLBACK - WE JUST WANTED TO TEST");
    });
  } catch(e) {
    console.error('ERROR:', e.message);
    console.error(e.stack);
  } finally {
    process.exit(0);
  }
}
debugReceiving();
