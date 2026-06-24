
exports.closeShift = catchAsync(async (req, res) => {
  const worker_id = req.user.id;
  const today = new Date().toISOString().split('T')[0];
  const sales = await db('printing_orders').where('status', 'Delivered').whereRaw('DATE(created_at) = ?', [today]);
  const totalSales = sales.reduce((sum, o) => sum + parseFloat(o.total_price), 0);
  const financeUser = await db('users').join('user_roles', 'users.id', 'user_roles.user_id').join('roles', 'user_roles.role_id', 'roles.id').where('roles.name', 'Finance').first() || { user_id: 3 };
  await db('cash_handovers').insert({
    from_user_id: worker_id,
    to_user_id: financeUser.user_id,
    handover_type: 'PRINTING_TO_FINANCE',
    total_cash: totalSales,
    total_amount: totalSales,
    notes: 'Printing Daily Sales Handover',
    status: 'PENDING',
    created_at: db.fn.now(),
    updated_at: db.fn.now()
  });
  res.json({ status: 'success', message: 'Printing daily sales handed over to finance.' });
});
