const fs = require('fs');
const files = [
  'frontend/src/pages/admin/AdminDashboard.jsx',
  'frontend/src/pages/car-renting/CarRentingDashboard.jsx',
  'frontend/src/pages/ceo/CEODashboard.jsx',
  'frontend/src/pages/farming/FarmingDashboard.jsx',
  'frontend/src/pages/finance/FinanceDashboard.jsx',
  'frontend/src/pages/hr/HRDashboard.jsx',
  'frontend/src/pages/pharmacy/PharmacyDashboard.jsx',
  'frontend/src/pages/printing/PrintingDashboard.jsx',
  'frontend/src/pages/purchase/PurchaseDashboard.jsx',
  'frontend/src/pages/retail/RetailDashboard.jsx',
  'frontend/src/pages/retail/RetailManagerDashboard.jsx',
  'frontend/src/pages/sales/SalesDashboard.jsx',
  'frontend/src/pages/store/StoreDashboard.jsx'
];
for(let f of files) {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    // regex to find DashboardLayout title
    content = content.replace(/<DashboardLayout\s+([^>]*?)title=(["'])(.*?)\2/g, (match, p1, p2, p3) => {
      // Remove any \n from the title
      let newTitle = p3.replace(/\\n/g, ' ').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
      return `<DashboardLayout ${p1}title="${newTitle}"`;
    });
    fs.writeFileSync(f, content, 'utf8');
    console.log('Updated', f);
  }
}
