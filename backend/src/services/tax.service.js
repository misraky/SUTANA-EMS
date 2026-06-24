const { db } = require('../config/database');
const { logger } = require('../config/logger');

const ETHIOPIAN_VAT_RATE = 0.15;
const WITHHOLDING_RATES = {
  goods: 0.02,
  services: 0.02,
  transport: 0.02,
  commission: 0.10,
  rent: 0.10,
  consultancy: 0.10,
  construction: 0.05,
  other: 0.02
};
const PENSION_RATES = {
  employee: 0.07,
  employer: 0.11
};
const PAYE_BRACKETS = [
  { min: 0, max: 600, rate: 0 },
  { min: 601, max: 1650, rate: 0.10 },
  { min: 1651, max: 3200, rate: 0.15 },
  { min: 3201, max: 5250, rate: 0.20 },
  { min: 5251, max: 7800, rate: 0.25 },
  { min: 7801, max: 10900, rate: 0.30 },
  { min: 10901, max: Infinity, rate: 0.35 }
];

const calculateVAT = (amount, isVatRegistered = true) => {
  if (!isVatRegistered) return 0;
  return amount * ETHIOPIAN_VAT_RATE;
};

const calculateWithholding = (amount, expenseType = 'goods') => {
  const rate = WITHHOLDING_RATES[expenseType] || WITHHOLDING_RATES.other;
  return amount * rate;
};

const calculatePAYE = (monthlyGrossSalary) => {
  let tax = 0;
  let remaining = monthlyGrossSalary;
  for (const bracket of PAYE_BRACKETS) {
    if (remaining <= 0) break;
    const taxableInBracket = Math.min(remaining, bracket.max - bracket.min);
    tax += taxableInBracket * bracket.rate;
    remaining -= taxableInBracket;
  }
  return tax;
};

const calculatePension = (basicSalary) => ({
  employee: basicSalary * PENSION_RATES.employee,
  employer: basicSalary * PENSION_RATES.employer,
  total: basicSalary * (PENSION_RATES.employee + PENSION_RATES.employer)
});

const computeExpenseTaxes = (amount, expenseType = 'goods', isVatRegistered = true) => {
  const vat = calculateVAT(amount, isVatRegistered);
  const withholding = calculateWithholding(amount, expenseType);
  const netAmount = amount + vat - withholding;
  return {
    grossAmount: amount,
    vatAmount: vat,
    vatRate: isVatRegistered ? ETHIOPIAN_VAT_RATE : 0,
    withholdingTax: withholding,
    withholdingRate: WITHHOLDING_RATES[expenseType] || WITHHOLDING_RATES.other,
    netAmount,
    totalTax: vat + withholding
  };
};

const getTaxRegistrations = async () => {
  return await db('tax_registrations').where('is_active', true);
};

const saveExpenseTaxes = async (expenseId, taxComputation, userId) => {
  const taxes = [];
  if (taxComputation.vatAmount > 0) {
    taxes.push({
      expense_id: expenseId,
      tax_type: 'VAT',
      taxable_amount: taxComputation.grossAmount,
      tax_rate: taxComputation.vatRate * 100,
      tax_amount: taxComputation.vatAmount
    });
  }
  if (taxComputation.withholdingTax > 0) {
    taxes.push({
      expense_id: expenseId,
      tax_type: 'WITHHOLDING',
      taxable_amount: taxComputation.grossAmount,
      tax_rate: taxComputation.withholdingRate * 100,
      tax_amount: taxComputation.withholdingTax
    });
  }
  if (taxes.length > 0) {
    await db('expense_taxes').insert(taxes);
  }
  await db('expenses').where('id', expenseId).update({
    vat_amount: taxComputation.vatAmount,
    withholding_tax: taxComputation.withholdingTax,
    tax_amount: taxComputation.totalTax,
    net_amount: taxComputation.netAmount
  });
};

const generateERCADeclaration = async (expenseId) => {
  const expense = await db('expenses as e')
    .leftJoin('expense_categories as ec', 'e.category_id', 'ec.id')
    .leftJoin('purchase_orders as po', 'e.po_id', 'po.id')
    .leftJoin('suppliers as s', 'po.supplier_id', 's.id')
    .select('e.*', 'ec.name as category_name', 's.name as supplier_name', 's.tin_number')
    .where('e.id', expenseId)
    .first();
  if (!expense) return null;
  const ref = `ERCA-${expense.id}-${Date.now()}`;
  await db('expenses').where('id', expenseId).update({
    erca_declaration_ref: ref,
    tax_declared: true
  });
  return {
    declarationRef: ref,
    supplierName: expense.supplier_name || 'Unknown',
    supplierTIN: expense.tin_number || '',
    amount: expense.amount,
    vat: expense.vat_amount,
    withholding: expense.withholding_tax,
    totalTax: expense.tax_amount,
    declaredAt: new Date().toISOString()
  };
};

module.exports = {
  calculateVAT,
  calculateWithholding,
  calculatePAYE,
  calculatePension,
  computeExpenseTaxes,
  getTaxRegistrations,
  saveExpenseTaxes,
  generateERCADeclaration,
  ETHIOPIAN_VAT_RATE,
  WITHHOLDING_RATES,
  PAYE_BRACKETS
};
