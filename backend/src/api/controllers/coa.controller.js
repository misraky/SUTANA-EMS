const { db } = require('../../config/database');
const { audit } = require('../../config/logger');
const AppError = require('../../utils/AppError');
const { catchAsync } = require('../../utils/catchAsync');
const ChartOfAccountsRepository = require('../../repositories/coa.repository');
const coaRepo = new ChartOfAccountsRepository();

exports.getAccounts = catchAsync(async (req, res) => {
  const { type } = req.query;
  let accounts;
  if (type) accounts = await coaRepo.getByType(type);
  else accounts = await coaRepo.findAll({ orderBy: 'account_code', orderDirection: 'asc' });
  res.json({ status: 'success', data: { accounts } });
});

exports.getAccountTree = catchAsync(async (req, res) => {
  const tree = await coaRepo.getAccountTree();
  res.json({ status: 'success', data: { tree } });
});

exports.createAccount = catchAsync(async (req, res) => {
  const { accountCode, accountName, accountType, accountClass, parentId, description } = req.body;
  const existing = await coaRepo.getByCode(accountCode);
  if (existing) throw new AppError('Account code already exists', 400);
  const [id] = await db('chart_of_accounts').insert({
    account_code: accountCode, account_name: accountName,
    account_type: accountType, account_class: accountClass || null,
    parent_id: parentId || null, description: description || ''
  });
  await audit('COA_CREATED', id, { ip: req.ip, details: { accountCode, accountName, accountType } });
  res.status(201).json({ status: 'success', data: { accountId: id } });
});

exports.updateAccount = catchAsync(async (req, res) => {
  const { id } = req.params;
  const account = await coaRepo.findById(id);
  if (!account) throw new AppError('Account not found', 404);
  const { accountName, isActive, description } = req.body;
  const updateData = { updated_at: db.fn.now() };
  if (accountName) updateData.account_name = accountName;
  if (isActive !== undefined) updateData.is_active = isActive;
  if (description !== undefined) updateData.description = description;
  await coaRepo.update(id, updateData);
  res.json({ status: 'success', message: 'Account updated' });
});
