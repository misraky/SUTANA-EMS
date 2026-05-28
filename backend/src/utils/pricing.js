const config = require('../config/env');
const BASE_PRICES = {
  A4: 0.50,
  A5: 0.75,
  A3: 1.00
};
const COLOR_MULTIPLIER = 2.0;
const BINDING_COSTS = {
  Spiral: 500,
  Thermal: 300,
  None: 0
};
const calculatePrintingPrice = (params) => {
  const { paperType, pagesPerCopy, quantity, bindingType = 'None', colorPrinting = false } = params;
  const basePrice = BASE_PRICES[paperType] || BASE_PRICES.A4;
  const colorMultiplier = colorPrinting ? COLOR_MULTIPLIER : 1.0;
  const pricePerUnit = pagesPerCopy * basePrice * colorMultiplier;
  const bindingCostPerUnit = BINDING_COSTS[bindingType] || 0;
  const totalBindingCost = bindingCostPerUnit * quantity;
  const subtotal = pricePerUnit * quantity;
  const totalPrice = subtotal + totalBindingCost;
  return {
    pricePerUnit: parseFloat(pricePerUnit.toFixed(2)),
    bindingCost: parseFloat(totalBindingCost.toFixed(2)),
    subtotal: parseFloat(subtotal.toFixed(2)),
    totalPrice: parseFloat(totalPrice.toFixed(2))
  };
};
const calculateDiscountAmount = (amount, discountPercent) => {
  return amount * (discountPercent / 100);
};
const calculatePriceAfterDiscount = (amount, discountPercent) => {
  const discount = calculateDiscountAmount(amount, discountPercent);
  return amount - discount;
};
const calculateTaxAmount = (amount, taxRate = null) => {
  const rate = taxRate !== null ? taxRate : config.businessRules.taxRate;
  return amount * (rate / 100);
};
const calculateTotalWithTax = (amount, taxRate = null) => {
  const tax = calculateTaxAmount(amount, taxRate);
  return amount + tax;
};
const calculateProfitMargin = (revenue, cost) => {
  if (revenue === 0) return 0;
  const profit = revenue - cost;
  return (profit / revenue) * 100;
};
const calculateGrossProfit = (revenue, cost) => {
  return revenue - cost;
};
const calculateNetProfit = (revenue, expenses, cogs) => {
  return revenue - expenses - cogs;
};
const calculateAverageOrderValue = (totalRevenue, orderCount) => {
  if (orderCount === 0) return 0;
  return totalRevenue / orderCount;
};
const calculateBulkDiscountPrice = (basePrice, quantity, discountTiers = null) => {
  const tiers = discountTiers || [
    { minQty: 50, discountPercent: 5 },
    { minQty: 100, discountPercent: 10 },
    { minQty: 500, discountPercent: 15 },
    { minQty: 1000, discountPercent: 20 }
  ];
  let discountPercent = 0;
  for (const tier of tiers.sort((a, b) => b.minQty - a.minQty)) {
    if (quantity >= tier.minQty) {
      discountPercent = tier.discountPercent;
      break;
    }
  }
  const discountAmount = basePrice * (discountPercent / 100);
  return basePrice - discountAmount;
};
const calculateBulkDiscountTotal = (basePrice, quantity, discountTiers = null) => {
  const discountedPrice = calculateBulkDiscountPrice(basePrice, quantity, discountTiers);
  return discountedPrice * quantity;
};
const calculateSellingPrice = (cost, markupPercent) => {
  return cost * (1 + markupPercent / 100);
};
const calculateMarginFromCost = (cost, sellingPrice) => {
  if (sellingPrice === 0) return 0;
  const profit = sellingPrice - cost;
  return (profit / sellingPrice) * 100;
};
const calculateMarkupFromMargin = (cost, marginPercent) => {
  if (cost === 0) return 0;
  const sellingPrice = cost / (1 - marginPercent / 100);
  return ((sellingPrice - cost) / cost) * 100;
};
const getDetailedPriceBreakdown = (params) => {
  const { paperType, pagesPerCopy, quantity, bindingType = 'None', colorPrinting = false } = params;
  const basePrice = BASE_PRICES[paperType] || BASE_PRICES.A4;
  const colorMultiplier = colorPrinting ? COLOR_MULTIPLIER : 1.0;
  const bindingCostPerUnit = BINDING_COSTS[bindingType] || 0;
  const pricePerPage = basePrice;
  const pricePerPageColor = basePrice * COLOR_MULTIPLIER;
  const pricePerCopy = pagesPerCopy * pricePerPage * colorMultiplier;
  const bindingCostTotal = bindingCostPerUnit * quantity;
  const subtotal = pricePerCopy * quantity;
  const total = subtotal + bindingCostTotal;
  const taxRate = config.businessRules.taxRate;
  const taxAmount = total * (taxRate / 100);
  const grandTotal = total + taxAmount;
  return {
    paperType,
    pagesPerCopy,
    quantity,
    bindingType,
    colorPrinting,
    basePricePerPage: pricePerPage,
    colorMultiplier,
    pricePerPageWithColor: pricePerPageColor,
    pricePerCopy: parseFloat(pricePerCopy.toFixed(2)),
    bindingCostPerCopy: bindingCostPerUnit,
    bindingCostTotal: parseFloat(bindingCostTotal.toFixed(2)),
    subtotal: parseFloat(subtotal.toFixed(2)),
    total: parseFloat(total.toFixed(2)),
    taxRate,
    taxAmount: parseFloat(taxAmount.toFixed(2)),
    grandTotal: parseFloat(grandTotal.toFixed(2))
  };
};
const getBasePrices = () => {
  return { ...BASE_PRICES };
};
const getColorMultiplier = () => {
  return COLOR_MULTIPLIER;
};
const getBindingCosts = () => {
  return { ...BINDING_COSTS };
};
const updateBasePrice = (paperType, price) => {
  if (BASE_PRICES[paperType]) {
    BASE_PRICES[paperType] = price;
  }
};
const updateBindingCost = (bindingType, cost) => {
  if (BINDING_COSTS[bindingType] !== undefined) {
    BINDING_COSTS[bindingType] = cost;
  }
};
module.exports = {
  BASE_PRICES,
  COLOR_MULTIPLIER,
  BINDING_COSTS,
  calculatePrintingPrice,
  calculateDiscountAmount,
  calculatePriceAfterDiscount,
  calculateTaxAmount,
  calculateTotalWithTax,
  calculateProfitMargin,
  calculateGrossProfit,
  calculateNetProfit,
  calculateAverageOrderValue,
  calculateBulkDiscountPrice,
  calculateBulkDiscountTotal,
  calculateSellingPrice,
  calculateMarginFromCost,
  calculateMarkupFromMargin,
  getDetailedPriceBreakdown,
  getBasePrices,
  getColorMultiplier,
  getBindingCosts,
  updateBasePrice,
  updateBindingCost
};
