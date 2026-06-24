const fs = require('fs');
const path = './src/api/controllers/finance.controller.js';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('getCashHandovers')) {
  content += `
// --- Cash Handovers (Unified) ---
exports.getCashHandovers = catchAsync(async (req, res) => {
  const handovers = await db('cash_handovers as ch')
    .leftJoin('users as from_u', 'ch.from_user_id', 'from_u.id')
    .leftJoin('users as to_u', 'ch.to_user_id', 'to_u.id')
    .select(
      'ch.*',
      'from_u.full_name as from_user_name',
      'from_u.roles as from_user_roles',
      'to_u.full_name as to_user_name'
    )
    .orderBy('ch.created_at', 'desc');

  res.status(200).json({ status: 'success', data: handovers });
});

exports.approveCashHandover = catchAsync(async (req, res) => {
  const { id } = req.params;
  
  const handover = await db('cash_handovers').where({ id }).first();
  if (!handover) {
    return res.status(404).json({ status: 'error', message: 'Handover not found' });
  }

  await db('cash_handovers')
    .where({ id })
    .update({
      status: 'APPROVED',
      verified_at: new Date(),
      updated_at: new Date()
    });

  // Notify submitter
  await db('notifications').insert({
    user_id: handover.from_user_id,
    title: 'Cash Handover Approved',
    message: \`Your cash handover of \${handover.total_amount} ETB has been approved by the CEO.\`,
    type: 'SYSTEM',
    is_read: false,
    created_at: new Date()
  });

  res.status(200).json({ status: 'success', message: 'Handover approved successfully' });
});

exports.rejectCashHandover = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const handover = await db('cash_handovers').where({ id }).first();
  if (!handover) {
    return res.status(404).json({ status: 'error', message: 'Handover not found' });
  }

  await db('cash_handovers')
    .where({ id })
    .update({
      status: 'REJECTED',
      notes: reason ? \`\${handover.notes || ''} [Rejected: \${reason}]\` : handover.notes,
      updated_at: new Date()
    });

  // Notify submitter
  await db('notifications').insert({
    user_id: handover.from_user_id,
    title: 'Cash Handover Rejected',
    message: \`Your cash handover of \${handover.total_amount} ETB was rejected. \${reason ? 'Reason: ' + reason : ''}\`,
    type: 'SYSTEM',
    is_read: false,
    created_at: new Date()
  });

  res.status(200).json({ status: 'success', message: 'Handover rejected successfully' });
});
`;
  fs.writeFileSync(path, content);
  console.log('Controller updated');
} else {
  console.log('Already updated');
}
