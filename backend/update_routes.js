const fs = require('fs');
const path = './src/api/routes/finance.routes.js';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('Cash Handovers (Unified)')) {
  content += `
// --- Cash Handovers (Unified) ---
router.get('/cash-handovers', authenticate, authorize(['reports:read', 'CEO']), FinanceController.getCashHandovers);
router.post('/cash-handovers/:id/approve', authenticate, authorize(['CEO']), FinanceController.approveCashHandover);
router.post('/cash-handovers/:id/reject', authenticate, authorize(['CEO']), FinanceController.rejectCashHandover);
`;
  fs.writeFileSync(path, content);
  console.log('Routes updated');
} else {
  console.log('Already updated');
}
