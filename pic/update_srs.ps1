# SRS Finance Expense Management - Comprehensive Update Script
# Fixes all issues to match ERP industry standards

$xmlPath = "D:\SUTANA-EMS-main\pic\srs_temp\word\document.xml"
$content = [System.IO.File]::ReadAllText($xmlPath, [System.Text.Encoding]::UTF8)

# Helper: XML-encode special characters in replacement text
function XmlEncode($t) {
    return $t -replace '&', '&amp;' -replace '<', '&lt;' -replace '>', '&gt;'
}

# ============================================================
# 1. Fix Subtitle / Header - CEO Only -> Multi-Tier
# ============================================================
$content = $content -replace [regex]::Escape('(All Expenses Approved by CEO - Dashboard Notifications Only - No Graphs)'), 
    '(Multi-Tier Approval by Amount - Email &amp; Dashboard Notifications - Budget-Controlled)'

$content = $content -replace [regex]::Escape('Finance & Expense Management Module - Complete Documentation
(All Expenses Approved by CEO - Dashboard Notifications Only - No Graphs)'),
    'Finance & Expense Management Module - Complete Documentation
(Multi-Tier Approval by Amount - Email &amp; Dashboard Notifications - Budget-Controlled)'

# ============================================================
# 2. Module Overview - Fix CEO-only language
# ============================================================
$content = $content -replace [regex]::Escape('ALL MONEY FLOWS THROUGH FINANCE - ALL EXPENSES APPROVED BY CEO'),
    'ALL MONEY FLOWS THROUGH FINANCE - EXPENSES APPROVED VIA MULTI-TIER WORKFLOW'

$content = $content -replace [regex]::Escape('1.2 Key Feature - All Expenses Require CEO Approval'),
    '1.2 Key Feature - Multi-Tier Approval Workflow with Budget Control'

# Replace the feature table
$content = $content -replace [regex]::Escape('Feature Description
100% CEO Approval Every single expense, regardless of amount, requires CEO approval
Dashboard-Only Notifications All approval requests appear on CEO dashboard - NO EMAILS
Real-time Alerts CEO sees pending approvals immediately upon login
Audit Trail Complete history of who approved what and when'),
    'Feature Description
Multi-Tier Approval Expenses route to Manager/Director/CEO based on amount thresholds
Budget-Controlled All expenses checked against department budget before submission
Email &amp; Dashboard Notifications Approval requests sent via email AND dashboard
Petty Cash Fund Fast-track for small expenses (&lt; 1,000 ETB) with monthly reconciliation
Real-time Alerts Approvers see pending approvals immediately upon login
Audit Trail Complete history of who approved what and when
Segregation of Duties Finance Officer records, Payment Processor pays, Accountant reconciles'

# ============================================================
# 3. Feature List - Update table
# ============================================================
$content = $content -replace [regex]::Escape('# Feature Description
1 Income Recording Auto-records sales from all modules
2 Expense Recording Manual entry with categories - ALL need CEO approval
3 CEO Approval Workflow Dashboard-based approval for ALL expenses
4 Credit Management Track customer credit balances
5 AR/AP Aging Accounts receivable and payable aging reports
6 Financial Reports P L, Balance Sheet, Cash Flow, Department reports
7 Bank Reconciliation Match system records with bank statements'),
    '# Feature Description
1 Income Recording Auto-records sales from all modules
2 Expense Recording Manual entry with categories - requires approval per amount tier
3 Multi-Tier Approval Workflow Manager/Director/CEO approval based on amount thresholds
4 Budgetary Control Department budgets with pre-encumbrance checking
5 Petty Cash Management Fast-track small expenses with float reconciliation
6 Credit Management Track customer credit balances with credit limits
7 Accounts Receivable/Payable Aging Aging reports with automated dunning
8 Financial Reports P&amp;L, Balance Sheet, Cash Flow, Department reports
9 Bank Reconciliation Match system records with bank statements
10 Ethiopian Tax Compliance VAT, withholding tax, pension, ERCA/MoF reporting
11 Month-End Close Formal close process with accruals and checklists
12 Chart of Accounts Hierarchical COA with account types and mapping'

# ============================================================
# 4. Finance Officer Role - Fix to show SoD
# ============================================================
$content = $content -replace [regex]::Escape('2.1 Role Summary'),
    '2.1 Role Summary - Segregation of Duties Applied'

$content = $content -replace [regex]::Escape('Responsibility Description Frequency Approval Required
Record Expenses Enter operational expenses with categories Daily CEO (ALL)
Record Income Record all sales revenue from all modules Daily No
Manage Credit Track customer credit balances, record payments Daily No
Pay Suppliers Process payments against POs As needed CEO (ALL)
Pay Salaries Process monthly payroll from HR Monthly CEO (ALL)
Generate Reports P L, Balance Sheet, Cash Flow Monthly/Quarterly No
Bank Reconciliation Match system to bank statements Monthly No
Manage AR/AP Track aging of receivables and payables Weekly No'),
    'Responsibility Description Frequency Approval Required Performed By
Record Expenses Enter operational expenses with categories Daily Tiered (Mgr/Dir/CEO) Finance Officer
Record Income Record all sales revenue from all modules Daily No Finance Officer
Manage Credit Track customer credit balances, record payments Daily No Finance Officer
Verify 3-Way Match Match Invoice/PO/Receipt before recording As needed No Finance Officer
Process Payments Execute approved payments As needed CEO (Large) / Dir (Medium) Payment Processor
Pay Salaries Process monthly payroll from HR Monthly CEO HR Manager / Payment Processor
Generate Reports P&amp;L, Balance Sheet, Cash Flow Monthly/Quarterly No Finance Officer
Bank Reconciliation Match system to bank statements Monthly No Accountant
Manage AR/AP Track aging of receivables and payables Weekly No Finance Officer
Petty Cash Management Reconcile petty cash float Weekly No Accountant
Tax Filing Prepare &amp; file VAT/Withholding/Pension returns Monthly CEO (approval) Finance Officer
Month-End Close Execute close checklist tasks Monthly No Accountant'

# ============================================================
# 5. Role Relations - Add SoD
# ============================================================
$content = $content -replace [regex]::Escape('2.2 Role Relations The Finance Officer receives cash from'),
    '2.2 Role Relations &amp; Segregation of Duties The Finance Officer receives cash from'

$content = $content -replace [regex]::Escape('All expense payments require CEO approval before Finance Officer can process them.'),
    'All expense payments require tiered approval (Manager/Director/CEO based on amount). A separate Payment Processor role executes approved payments. Finance Officer records the expense but does NOT have payment execution rights. An Accountant performs reconciliation and is independent of both recording and payment.'

# ============================================================
# 6. Update Approval Requirement Table
# ============================================================
$content = $content -replace [regex]::Escape('ID Requirement Priority Approval
FIN-001 Record income from all sales channels automatically High No
FIN-002 Record operational expenses with categories High CEO
FIN-003 Process supplier payments against approved POs High CEO
FIN-004 Record bank deposits High No
FIN-005 Manage customer credit accounts (receivables) High No
FIN-006 Manage supplier credit accounts (payables) High No
FIN-007 ALL expenses require CEO approval - NO auto-approval High CEO
FIN-008 CEO receives dashboard notification for ALL expenses High CEO
FIN-009 Generate Daily Sales Report High No
FIN-010 Generate Weekly Profit   Loss Statement High No
FIN-011 Generate Monthly Balance Sheet High No
FIN-012 Generate Cash Flow Statement High No
FIN-013 Generate Accounts Receivable Aging Report Medium No
FIN-014 Generate Accounts Payable Aging Report Medium No
FIN-015 Record manual payment verification (Bank Transfer, Telebirr) High No
FIN-016 Process customer refunds Medium CEO
FIN-017 Track tax payments Medium CEO
FIN-018 Bank reconciliation Medium No
FIN-019 Export reports to PDF/Excel Low No'),
    'ID Requirement Priority Approval Threshold
FIN-001 Record income from all sales channels automatically High None
FIN-002 Record operational expenses with categories High Tiered
FIN-003 Process supplier payments against approved POs High Tiered
FIN-004 Record bank deposits High None
FIN-005 Manage customer credit accounts (receivables) High None
FIN-006 Manage supplier credit accounts (payables) High None
FIN-007 Multi-tier approval based on amount thresholds High Tiered
FIN-008 Email &amp; Dashboard notifications for approval requests High All approvers
FIN-009 Generate Daily Sales Report High None
FIN-010 Generate Weekly Profit &amp; Loss Statement High None
FIN-011 Generate Monthly Balance Sheet High None
FIN-012 Generate Cash Flow Statement High None
FIN-013 Generate Accounts Receivable Aging Report Medium None
FIN-014 Generate Accounts Payable Aging Report Medium None
FIN-015 Record manual payment verification (Bank Transfer, Telebirr) High None
FIN-016 Process customer refunds Medium Tiered
FIN-017 Track tax payments &amp; file returns Medium CEO (returns)
FIN-018 Bank reconciliation Medium None
FIN-019 Budget management &amp; encumbrance tracking High None
FIN-020 Petty cash fund management Medium Finance Officer
FIN-021 Multi-currency transaction support Medium None
FIN-022 Month-end close process with checklist High Accountant
FIN-023 Ethiopian tax compliance (VAT, Withholding, Pension) High Finance Officer
FIN-024 Export reports to PDF/Excel Low None'

# ============================================================
# 7. Fix FIN-007 and FIN-008 descriptions
# ============================================================
$content = $content -replace [regex]::Escape('FIN-007: ALL Expenses Require CEO Approval The system shall require CEO approval for ALL expenses regardless of amount or category. There is NO auto-approval for any expense. Every single expense entry must be approved by CEO before payment can be processed.'),
    'FIN-007: Multi-Tier Approval Workflow The system shall implement a multi-tier approval hierarchy:
- Tier 1 (Manager): Approves expenses up to 5,000 ETB
- Tier 2 (Director): Approves expenses from 5,001 to 50,000 ETB
- Tier 3 (CEO): Approves expenses above 50,000 ETB
There is NO auto-approval. Every expense routes to the appropriate approver based on amount. The system checks department budget before submission (pre-encumbrance). All approvals are recorded in the audit trail with before/after snapshots.'

$content = $content -replace [regex]::Escape('FIN-008: Dashboard Notifications for CEO The system shall send notifications to CEO dashboard for ALL expense approval requests. No emails shall be sent. CEO sees pending approvals immediately upon login to the dashboard.'),
    'FIN-008: Email &amp; Dashboard Notifications The system shall send notifications via BOTH email and dashboard for all expense approval requests. Each approver receives an email with a direct link to the approval modal. Dashboard notifications serve as a centralized hub. Approvers can configure notification preferences (email immediately, daily digest, or dashboard-only).'

# ============================================================
# 8. Update Income Management
# ============================================================
$content = $content -replace [regex]::Escape('NO CEO APPROVAL REQUIRED FOR INCOME RECORDING. Income recording is purely administrative and does not require approval.'),
    'NO CEO APPROVAL REQUIRED FOR INCOME RECORDING. Income recording is purely administrative and does not require approval. However, all income is subject to audit review and reconciliation by the Accountant.'

$content = $content -replace [regex]::Escape('5. EXPENSE MANAGEMENT'),
    '5. EXPENSE MANAGEMENT &amp; APPROVAL WORKFLOW'

$content = $content -replace [regex]::Escape('5.1 Expense Categories - ALL Require CEO Approval'),
    '5.1 Expense Categories - Multi-Tier Approval by Amount'

# Replace the expense categories table
$content = $content -replace [regex]::Escape('Category Description CEO Approval Required
Salary Employee payroll payments YES - ALL
Rent Office/space rental payments YES - ALL
Utilities Electricity, water, internet, phone YES - ALL
Supplies Office supplies, consumables YES - ALL
Maintenance Equipment/vehicle repairs YES - ALL
Supplier Payment Payment to suppliers for goods YES - ALL
Tax Government tax payments YES - ALL
Other Miscellaneous expenses YES - ALL'),
    'Category Description Approval Threshold
Salary Employee payroll payments Tier 2/3 (&gt;5K Dir, &gt;50K CEO)
Rent Office/space rental payments Tier 2/3 (&gt;5K Dir, &gt;50K CEO)
Utilities Electricity, water, internet, phone Tier 1/2/3 (Manager up to 5K)
Supplies Office supplies, consumables Tier 1/2/3
Maintenance Equipment/vehicle repairs Tier 1/2/3
Supplier Payment Payment to suppliers for goods Tier 2/3
Tax Government tax payments Tier 3 (CEO)
Petty Cash Small cash expenses (&lt;1,000 ETB) Finance Officer float
Other Miscellaneous expenses Tier 1/2/3'

# ============================================================
# 9. Add Petty Cash to Expense Entry Form
# ============================================================
$content = $content -replace [regex]::Escape('After filling out the form, the Finance Officer clicks "SUBMIT FOR APPROVAL". The system creates expense record with status PENDING_CEO_APPROVAL and adds a notification to CEO Dashboard.'),
    'For expenses under 1,000 ETB, the Finance Officer may use the Petty Cash fund instead of the approval workflow. Petty Cash expenses are tracked separately and reconciled monthly by the Accountant.
For standard expenses, after filling out the form, the Finance Officer clicks "SUBMIT FOR APPROVAL". The system checks the department budget. If sufficient budget exists, the system creates the expense record with status PENDING_APPROVAL and routes it to the appropriate approver (Manager/Director/CEO) based on the amount. The approver receives an email notification with a direct link, and a dashboard notification appears in the notification center.'

# ============================================================
# 10. Update Expense Sources
# ============================================================
$content = $content -replace [regex]::Escape('5.3 Expense Sources - ALL Require CEO Approval'),
    '5.3 Expense Sources &amp; Approval Tiers'

$content = $content -replace [regex]::Escape('Source How it Leaves Finance Recorded As CEO Approval
Supplier Payment Finance Officer pays supplier COGS / Expense YES - ALL
Employee Salary HR submits to Finance pays Salary Expense YES - ALL
Rent Finance Officer pays landlord Operating Expense YES - ALL
Utilities Finance Officer pays utility companies Operating Expense YES - ALL
Supplies Dept Manager requests to Finance pays Operating Expense YES - ALL
Maintenance Dept Manager requests to Finance pays Operating Expense YES - ALL
Tax Finance Officer pays government Tax Expense YES - ALL
Refund Finance processes refund Refund Expense YES - ALL'),
    'Source How it Leaves Finance Recorded As Approval Tier
Supplier Payment Payment Processor pays supplier COGS / Expense Tier 2 (Dir up to 50K) / Tier 3 (CEO &gt;50K)
Employee Salary HR submits to Payment Processor pays Salary Expense Tier 2 / Tier 3
Rent Payment Processor pays landlord Operating Expense Tier 2 / Tier 3
Utilities Payment Processor pays utility companies Operating Expense Tier 1 (Mgr up to 5K)
Supplies Dept Manager requests to Payment Processor pays Operating Expense Tier 1
Maintenance Dept Manager requests to Payment Processor pays Operating Expense Tier 1
Tax Finance Officer prepares, CEO approves, Payment Processor pays Tax Expense Tier 3 (CEO)
Refund Finance Officer processes, Payment Processor executes Refund Expense Tier 2 / Tier 3
Petty Cash Finance Officer uses cash float Cash Expense Finance Officer float'

# ============================================================
# 11. Fix Approval Workflow Section
# ============================================================
$content = $content -replace [regex]::Escape('6. CEO APPROVAL WORKFLOW (DASHBOARD-ONLY)'),
    '6. MULTI-TIER APPROVAL WORKFLOW (EMAIL &amp; DASHBOARD)'

$content = $content -replace [regex]::Escape('6.1 Complete Approval Flow STEP 1: Finance Officer records expense and submits for approval. STEP 2: System creates expense record with status: PENDING_CEO_APPROVAL. STEP 3: System adds notification to CEO Dashboard with details: Category: Salary Amount: 45,000 ETB Department: Printing Requested By: Finance Officer Submitted: 2026-06-15 10:30 AM Action Button: REVIEW AND APPROVE STEP 4: CEO logs in to dashboard and sees pending approval notification with a count badge showing number of pending approvals. STEP 5: CEO clicks "REVIEW AND APPROVE" button. STEP 6: CEO sees expense details modal with: Expense ID Category Amount Department Requested By Submitted Date/Time Description Attachments (clickable to view) Justification provided by Finance Officer Comments field for CEO to add notes STEP 7: CEO takes one of three actions: APPROVE: Click APPROVE button System updates expense status to APPROVED Finance Officer receives dashboard notification: "Expense approved by CEO" Payment can now be processed REJECT: Click REJECT button System prompts for rejection reason CEO enters reason System updates expense status to REJECTED Finance Officer receives dashboard notification: "Expense rejected by CEO - Reason provided" Expense cannot be paid REQUEST MORE INFO: Click REQUEST MORE INFO button System prompts for additional information request CEO enters question System updates expense status to NEEDS_INFO Finance Officer receives dashboard notification: "CEO requests more information" Finance Officer adds information and re-submits STEP 8: CEO can view approval history with date, category, amount, status, and comments. NO EMAILS ARE SENT. ALL NOTIFICATIONS ARE ON DASHBOARD.'),
    '6.1 Complete Approval Flow STEP 1: Finance Officer records expense and submits for approval. Budget check occurs before submission. STEP 2: System checks budget availability (pre-encumbrance). If sufficient, creates expense with status: PENDING_APPROVAL. If insufficient, status: BUDGET_EXCEEDED, notifies Finance Officer. STEP 3: System routes to the correct approver based on amount: Up to 5,000 ETB: Routes to Department Manager (Tier 1) 5,001 - 50,000 ETB: Routes to Director (Tier 2) Above 50,000 ETB: Routes to CEO (Tier 3) STEP 4: System sends email notification to the approver with direct link AND adds dashboard notification with details: Category: Salary Amount: 45,000 ETB Department: Printing Requested By: Finance Officer Submitted: 2026-06-15 10:30 AM Action Button: REVIEW AND APPROVE STEP 5: Approver receives email "New expense requires your approval - Category - Amount - Department" with "Review in ERP" button. Approver clicks link or logs in to dashboard and sees pending approvals count badge. STEP 6: Approver sees expense details modal with: Expense ID, Category, Amount, Department, Requested By, Submitted Date/Time, Description, Attachments (clickable to view), Justification, Budget remaining for department, Comments field STEP 7: Approver takes one of three actions: APPROVE: Updates status to APPROVED. Notifies Finance Officer via email AND dashboard: "Expense approved by [Approver Name]". Payment can be processed by Payment Processor. REJECT: Prompts for rejection reason. Updates status to REJECTED. Notifies Finance Officer via email AND dashboard: "Expense rejected by [Approver Name] - Reason provided". Expense cannot be paid. REQUEST MORE INFO: Prompts for additional information request. Updates status to NEEDS_INFO. Notifies Finance Officer via email AND dashboard: "[Approver Name] requests more information". Finance Officer adds info and re-submits. STEP 8: If expense exceeds the approver tier, it cascades upward. For example, a 60,000 ETB expense first goes to Manager (Tier 1, informational), then Director (Tier 2, approve/reject), then CEO (Tier 3, final approval). STEP 9: Approver can view approval history with date, category, amount, status, and comments. STEP 10: After approval, the Payment Processor (separate role from Finance Officer) executes the payment. The Accountant reconciles the transaction.'

# ============================================================
# 12. Update Expense Status Workflow
# ============================================================
$content = $content -replace [regex]::Escape('6.2 Expense Status Workflow DRAFT: Finance Officer creates expense entry but has not submitted yet. Expense is in draft state. PENDING_CEO_APPROVAL: Finance Officer submits expense for approval. CEO dashboard notification added. CEO sees pending approval count. Expense is waiting for CEO action. APPROVED: CEO approves expense. Finance Officer notified on dashboard. Payment can now be processed. REJECTED: CEO rejects expense with reason. Finance Officer notified on dashboard. Expense cannot be paid. NEEDS_INFO: CEO requests more information. Finance Officer notified on dashboard. Finance Officer adds information and re-submits. PAID: Finance Officer processes payment after CEO approval. Expense status updated to PAID. CANCELLED: Finance Officer cancels expense request before approval. Expense removed from approval queue.'),
    '6.2 Expense Status Workflow DRAFT: Finance Officer creates expense entry but has not submitted yet. Expense is in draft state. PENDING_BUDGET_CHECK: System verifies budget availability before routing. BUDGET_EXCEEDED: Expense exceeds department budget. Finance Officer notified. Can request budget reallocation or special override. PENDING_APPROVAL: Expense routed to correct approver (Manager/Director/CEO). Email + Dashboard notification sent. APPROVED: Approver approves expense. Finance Officer &amp; Payment Processor notified. Payment can be processed. REJECTED: Approver rejects expense with reason. Finance Officer notified. Expense cannot be paid. NEEDS_INFO: Approver requests more information. Finance Officer notified. Finance Officer adds information and re-submits. PAID: Payment Processor executes payment after approval. Expense status updated to PAID with payment reference. RECONCILED: Accountant matches payment to bank statement. CANCELLED: Finance Officer cancels expense request before approval.'

# ============================================================
# 13. Fix Notification Rules
# ============================================================
$content = $content -replace [regex]::Escape('6.3 Notification Rules CEO receives a dashboard notification when ANY expense is submitted for approval. No emails are sent - notifications appear ONLY on CEO dashboard. Notifications remain unread until CEO views them. Notification count appears as a badge on CEO dashboard. CEO can mark notifications as read. All notification history is stored for audit purposes. Finance Officer can click "NOTIFY CEO" to send a reminder notification (dashboard-only, no email).'),
    '6.3 Notification Rules 6.3.1 Email Notifications: The approver (Manager/Director/CEO) receives an email notification when an expense is submitted for their approval. Email includes: expense category, amount, department, and a direct "Review in ERP" link. Email subject: "New Expense Requires Your Approval - [Category] - [Amount] ETB - [Department]". 6.3.2 Dashboard Notifications: All approval requests also appear as dashboard notifications. Approver sees pending count badge. Notifications remain unread until viewed. Approver can mark notifications as read. 6.3.3 Notification History: All notifications (email sent, dashboard, actions taken) are stored for audit. 6.3.4 Escalation: If an expense remains unapproved for 48 hours, the system sends a reminder email to the approver and escalates to the next level. 6.3.5 Finance Officer Notifications: Finance Officer receives email + dashboard notification when an expense is approved, rejected, or needs more info. 6.3.6 Reminder: Finance Officer can click "Send Reminder" to re-notify the approver.'

# ============================================================
# 14. Update CEO Dashboard section to mention all approvers
# ============================================================
$content = $content -replace [regex]::Escape('7. CEO DASHBOARD - APPROVAL MANAGEMENT'),
    '7. APPROVER DASHBOARDS - APPROVAL MANAGEMENT'

$content = $content -replace [regex]::Escape('7.1 CEO Dashboard - Pending Approvals Section'),
    '7.1 Approver Dashboard - Pending Approvals Section'

$content = $content -replace [regex]::Escape('The CEO Dashboard displays pending expense approvals'),
    'Each approver dashboard (Manager/Director/CEO) displays pending expense approvals'

$content = $content -replace [regex]::Escape('7.2 CEO Expense Approval Modal'),
    '7.2 Approver Expense Approval Modal'

$content = $content -replace [regex]::Escape('When CEO clicks "VIEW DETAILS"'),
    'When the approver clicks "VIEW DETAILS"'

$content = $content -replace [regex]::Escape('CEO COMMENTS: Text area for CEO to add optional comments'),
    'APPROVER COMMENTS: Text area for the approver to add optional comments'

$content = $content -replace [regex]::Escape('APPROVE REJECT REQUEST MORE INFO CANCEL'),
    'APPROVE REJECT REQUEST MORE INFO BUDGET OVERRIDE (if applicable) CANCEL'

$content = $content -replace [regex]::Escape('7.3 CEO Dashboard - Approval History'),
    '7.3 Approver Dashboard - Approval History'

$content = $content -replace [regex]::Escape('The CEO Dashboard shows approval history for the last 30 days displaying: Date Category Amount Requested By Status (APPROVED, REJECTED, PAID) Approved By (CEO name) Comments The approval history also shows summary statistics: Total Approved Amount Total Rejected Amount Approval Rate Percentage'),
    'Each Approver Dashboard shows approval history for the last 30 days displaying: Date, Category, Amount, Requested By, Status (APPROVED, REJECTED, PAID), Approved By, Comments, Budget Utilization. The approval history also shows summary statistics: Total Approved Amount, Total Rejected Amount, Approval Rate Percentage, Average Time to Approve, Budget Remaining.'

$content = $content -replace [regex]::Escape('7.4 Finance Officer Dashboard - Approval Status'),
    '7.4 Finance Officer Dashboard - Expense &amp; Budget Status'

$content = $content -replace [regex]::Escape('The Finance Officer Dashboard shows expense status summary:'),
    'The Finance Officer Dashboard shows expense and budget status summary:'

$content = $content -replace [regex]::Escape('PENDING CEO APPROVAL: Count of expenses awaiting CEO approval'),
    'PENDING APPROVAL: Count of expenses awaiting approval at any tier (Manager/Director/CEO)'

$content = $content -replace [regex]::Escape('7.5 CEO Dashboard Notification Center'),
    '7.5 Notification Center (All Users)'

# ============================================================
# 15. Add Budget Management section
# ============================================================
$content = $content -replace [regex]::Escape('7.6 CEO Dashboard Summary The CEO Dashboard shows key metrics: PENDING APPROVALS: Number of expenses waiting for CEO approval TODAYS EXPENSES: Total expenses submitted today THIS WEEKS EXPENSES: Total expenses submitted this week MONTH-TO-DATE EXPENSES: Total expenses submitted this month APPROVAL RATE: Percentage of expenses approved vs total submitted'),
    '7.6 Budget Management Module 7.6.1 Annual Budget Setup: Each department (Printing, Pharmacy, Car Rental, Farming, Retail, Admin) receives an annual budget at the start of the fiscal year. Budgets are broken down by month and by expense category. CEO approves the annual budget. 7.6.2 Budget Checking: When an expense is submitted, the system checks the remaining budget for that department and category. If sufficient budget exists, the system reserves the amount (pre-encumbrance). When approved, the encumbrance is recorded. When paid, the actual is recorded. 7.6.3 Budget Alerts: Warnings at 80% utilization. Hard block at 100% unless budget override is approved by next-level approver. 7.6.4 Budget Reallocation: Finance Officer can request budget reallocation between categories within a department, approved by Department Manager. Cross-department reallocation requires CEO approval. 7.6.5 Budget Reports: Budget vs Actual by department and category. Monthly budget variance analysis. Year-to-date budget consumption. 7.6.6 Approver Dashboard Summary: Each approver sees: PENDING APPROVALS at their tier, TODAYS EXPENSES, THIS WEEKS EXPENSES, MONTH-TO-DATE EXPENSES, APPROVAL RATE, Budget Utilization for their department.'

# ============================================================
# 16. Update Credit Management with credit limits
# ============================================================
$content = $content -replace [regex]::Escape('8. CREDIT MANAGEMENT'),
    '8. CREDIT MANAGEMENT &amp; LIMITS'

$content = $content -replace [regex]::Escape('Step 2: System automatically adds amount to customer credit balance.'),
    'Step 2: System checks the customer credit limit before allowing the credit sale. If the new balance exceeds the limit, the POS blocks the transaction. The Finance Officer can request a credit limit increase approved by Manager/Director based on amount. System automatically adds amount to customer credit balance if within limit.'

$content = $content -replace [regex]::Escape('NO CEO APPROVAL REQUIRED FOR CREDIT PAYMENT RECORDING.'),
    'NO CEO APPROVAL REQUIRED FOR CREDIT PAYMENT RECORDING. However, credit limit increases require tiered approval.'

# ============================================================
# 17. Add Tax Compliance Section
# ============================================================
$content = $content -replace [regex]::Escape('8.4 Accounts Payable Aging'),
    '8.5 Ethiopian Tax Compliance (ERCA/MoF) 8.5.1 Value Added Tax (VAT): VAT rate: 15% on taxable goods and services. VAT Registration threshold: annual turnover exceeding 1,000,000 ETB. VAT on Sales (Output VAT): automatically calculated on all sales transactions. VAT on Purchases (Input VAT): captured from supplier invoices. VAT Return: Monthly filing to ERCA/MoF by the 15th of the following month. VAT Report includes: Output VAT summary by rate, Input VAT summary, Net VAT payable/refundable. 8.5.2 Withholding Tax: Purchases from non-registered suppliers: 2% withholding. Purchases from registered suppliers: 50% of VAT withholding. Service withholding: 15% for certain professional services. Rental income withholding: 15%. Withholding Tax Return: Monthly filing with VAT return. 8.5.3 Employment Income Tax: Monthly PAYE calculation based on Ethiopian tax brackets. Monthly remittance to ERCA by the 7th of the following month. Annual income tax reconciliation for each employee. 8.5.4 Pension Contributions: Employee contribution: 7% of gross salary. Employer contribution: 11% of gross salary. Monthly remittance to Public Service Pension Agency / Private Organization. 8.5.5 Tax Reports: VAT 7.1 Monthly Report, Withholding Tax Monthly Report, Income Tax Annual Report, Pension Contribution Report. All tax reports printable and exportable to ERCA/MoF format. 8.5.6 Tax Audit Trail: Complete history of all tax calculations, returns filed, and payments made. Tax payment approval: all tax payments require CEO approval (Tier 3). 8.6 Accounts Payable Aging'

# ============================================================
# 18. Update Financial Reports - add tax and budget reports
# ============================================================
$content = $content -replace [regex]::Escape('9.7 Top Expenses Report'),
    '9.7 Budget vs Actual Report The report shows for each department and category: Annual Budget, Monthly Budget, Month Actual, Month Variance, YTD Actual, YTD Variance, Budget Remaining, Utilization Percentage. Highlights categories exceeding 80% utilization with warnings and 100% with critical alerts. 9.8 Tax Report Summary Monthly tax liability summary: Output VAT, Input VAT, Net VAT Payable, Withholding Tax Collected, PAYE Due, Pension Due. Shows filing status, due dates, and payment status for each period. 9.9 Top Expenses Report'

$content = $content -replace [regex]::Escape('Category: amount (percentage of total) Category: amount (percentage of total) Category: amount (percentage of total)'),
    'Category: amount (percentage of total) with budget utilization indicator'

# ============================================================
# 19. Add Chart of Accounts to Data Dictionary
# ============================================================
$content = $content -replace [regex]::Escape('10.1 Expense Table'),
    '10.1 Chart of Accounts (COA) Structure The system shall maintain a hierarchical Chart of Accounts with the following structure: Account Type, Account Code, Account Name, Parent Account, Is Active, Normal Balance. Major account types: 1xxx - Assets (Current Assets: 11xx Cash, 12xx Accounts Receivable, 13xx Inventory; Fixed Assets: 14xx Equipment, 15xx Vehicles, 16xx Furniture; Accumulated Depreciation: 17xx). 2xxx - Liabilities (Current: 21xx Accounts Payable, 22xx Accrued Expenses; Long-Term: 23xx Bank Loans). 3xxx - Equity (31xx Owner Capital, 32xx Retained Earnings). 4xxx - Revenue (41xx Sales Revenue, 42xx Service Revenue, 43xx Other Income). 5xxx - Cost of Goods Sold (51xx COGS - Printing, 52xx COGS - Pharmacy, etc.). 6xxx - Operating Expenses (61xx Salaries, 62xx Rent, 63xx Utilities, 64xx Supplies, 65xx Maintenance, 66xx Depreciation, 67xx Tax Expense). Each transaction posts to at least two accounts (double-entry accounting). Account codes are 4 digits with hierarchical grouping. 10.2 Expense Table'

# Renumber data dictionary sections
$content = $content -replace [regex]::Escape('10.2 Notification Table'), '10.3 Notification Table'
$content = $content -replace [regex]::Escape('10.3 Customer Credit Table'), '10.4 Customer Credit Table'
$content = $content -replace [regex]::Escape('10.4 Expense Status Values'), '10.5 Expense Status Values'

# ============================================================
# 20. Add Budget Table and Payment Run fields to data dictionary
# ============================================================
$content = $content -replace [regex]::Escape('10.4 Expense Status Values Status Description DRAFT Finance Officer created expense but not submitted PENDING_CEO_APPROVAL Expense submitted, waiting for CEO approval APPROVED CEO approved expense REJECTED CEO rejected expense NEEDS_INFO CEO requested more information PAID Finance Officer processed payment CANCELLED Finance Officer cancelled expense request'),
    '10.5 Expense Status Values Status Description DRAFT Finance Officer created expense but not submitted PENDING_BUDGET_CHECK System verifying budget availability BUDGET_EXCEEDED Expense exceeds department budget PENDING_APPROVAL Expense submitted, waiting for tiered approval (Mgr/Dir/CEO) APPROVED Approver approved expense REJECTED Approver rejected expense NEEDS_INFO Approver requested more information PAID Payment Processor executed payment RECONCILED Accountant matched payment to bank statement CANCELLED Finance Officer cancelled expense request 10.6 Budget Table Field Name Data Type Description budget_id INT Auto-increment primary key department ENUM Printing, Pharmacy, Car_Rental, Farming, Retail, Admin fiscal_year INT Budget year category ENUM Salary, Rent, Utilities, Supplies, Maintenance, Other annual_amount DECIMAL(12,2) Annual budget amount jan_amount DECIMAL(12,2) Monthly budget each month feb_amount DECIMAL(12,2) ... up to dec_amount created_by INT User ID who created budget approved_by INT CEO user ID who approved budget created_at DATETIME Record creation timestamp 10.7 Payment Run Table Field Name Data Type Description payment_run_id INT Auto-increment primary key run_date DATE Date of payment run status ENUM PENDING, PROCESSED, COMPLETED, FAILED total_amount DECIMAL(12,2) Total payment amount expense_count INT Number of expenses in run payment_method ENUM Bank_Transfer, Cheque, Cash processed_by INT Payment Processor user ID bank_reference VARCHAR(100) Bank transaction reference created_at DATETIME Record creation timestamp 10.8 Tax Compliance Table Field Name Data Type Description tax_id INT Auto-increment primary key tax_type ENUM VAT, WITHHOLDING, PAYE, PENSION period VARCHAR(7) Period YYYY-MM filing_date DATE Date filed due_date DATE Filing due date total_liability DECIMAL(12,2) Total tax liability amount_paid DECIMAL(12,2) Amount paid payment_date DATE Date paid status ENUM DRAFT, FILED, PAID, OVERDUE filed_by INT User ID created_at DATETIME Record creation timestamp'

# ============================================================
# 21. Add Month-End Close to Non-Functional Requirements
# ============================================================
$content = $content -replace [regex]::Escape('12.6 Usability Requirements'),
    '12.6 Month-End Close Process 12.6.1 Close Schedule: Close occurs on the last business day of each month. No new transactions can be posted to the closed period. Only adjusting entries by the Accountant are allowed after close. 12.6.2 Close Checklist: Verify all bank transactions are reconciled. Post all depreciation entries. Post all accrued expenses (salaries, utilities, interest). Post prepaid expense amortization. Reconcile all inter-department transactions. Verify AR and AP aging reports. Run trial balance and verify it balances. Run financial reports (P&amp;L, Balance Sheet, Cash Flow). Review budget vs actual variances. File monthly tax returns (VAT, Withholding, PAYE, Pension). Lock period to prevent further changes. 12.6.3 Close Approval: Accountant runs close checklist. Finance Officer reviews and signs off. CEO provides final close approval. 12.6.4 Period Locking: Closed periods are locked and cannot be modified. Adjusting entries require Accountant role and create audit trail. Re-opening a period requires CEO approval. 12.7 Usability Requirements'

# ============================================================
# 22. Add Foreign Currency support
# ============================================================
$content = $content -replace [regex]::Escape('FIN-021 Multi-currency transaction support Medium None'),
    'FIN-021 Multi-currency transaction support Medium None 12.8 Multi-Currency Support 12.8.1 The system supports transactions in foreign currencies (primarily USD, EUR, GBP). Each transaction records: original currency, original amount, exchange rate, converted ETB amount. 12.8.2 Exchange rates are maintained daily by the Finance Officer. Rate source: National Bank of Ethiopia daily rate. Historical rates preserved for audit. 12.8.3 Unrealized gain/loss calculated at month-end for outstanding foreign currency balances. Realized gain/loss recorded at settlement. 12.8.4 Financial reports presented in ETB with original currency disclosure.'

# ============================================================
# 23. Fix Integration Points - update
# ============================================================
$content = $content -replace [regex]::Escape('Purchase Officer creates PO. PO is approved. Supplier delivers goods. Store Keeper receives goods. Supplier sends invoice. Finance Officer records expense. CEO approves via dashboard. Finance Officer pays supplier. Expense recorded in Finance.'),
    'Purchase Officer creates PO. PO is approved (multi-tier). Supplier delivers goods. Store Keeper receives goods (GRN created). Supplier sends invoice. Finance Officer performs 3-way match (PO vs GRN vs Invoice). If match passes, Finance Officer records expense. Expense routed to appropriate approver. Approver approves via email/dashboard. Payment Processor pays supplier. Accountant reconciles payment to bank statement. Expense recorded in Finance.'

# ============================================================
# 24. Fix integration legend
# ============================================================
$content = $content -replace [regex]::Escape('APPROVAL FLOW: Expense approval requests flow from Finance Officer to CEO via dashboard notifications. Approval decisions flow from CEO back to Finance Officer.'),
    'APPROVAL FLOW: Expense approval requests flow from Finance Officer to the appropriate approver (Manager/Director/CEO) via email and dashboard notifications. Approval decisions flow back to Finance Officer. Escalation occurs if no action within 48 hours.'

# ============================================================
# 25. Update Appendix
# ============================================================
$content = $content -replace [regex]::Escape('13.1 Complete Expense Approval Flow Summary ALL expenses follow this workflow regardless of amount or category: Finance Officer records expense with category, amount, description, department, and attachment. Finance Officer submits expense for approval. Status becomes PENDING_CEO_APPROVAL. System adds notification to CEO Dashboard with expense details and APPROVE, REJECT, VIEW DETAILS buttons. CEO logs in to dashboard and sees pending approvals count. CEO clicks VIEW DETAILS to see full expense information including description, attachments, and justification. CEO takes one of three actions: a. APPROVE - Expense status becomes APPROVED. Finance Officer notified on dashboard. b. REJECT - CEO provides reason. Expense status becomes REJECTED. Finance Officer notified on dashboard. c. REQUEST MORE INFO - CEO asks question. Expense status becomes NEEDS_INFO. Finance Officer notified on dashboard. Finance Officer adds info and re-submits. After CEO approval, Finance Officer processes payment. Expense status becomes PAID. NO EMAILS ARE SENT AT ANY STAGE. All notifications are on dashboard only.'),
    '13.1 Complete Expense Approval Flow Summary All expenses follow this multi-tier workflow: STEP 1: Finance Officer records expense with category, amount, description, department, and attachment. STEP 2: System checks department budget (pre-encumbrance). If insufficient, status becomes BUDGET_EXCEEDED, Finance Officer notified. STEP 3: If budget sufficient, expense routes to the correct approver: Up to 5,000 ETB: Department Manager (Tier 1). 5,001 to 50,000 ETB: Director (Tier 2). Above 50,000 ETB: CEO (Tier 3). Status becomes PENDING_APPROVAL. STEP 4: Email notification sent to approver with direct link. Dashboard notification added. STEP 5: Approver reviews expense details (description, attachments, justification, budget remaining). STEP 6: Approver takes action: APPROVE - Status becomes APPROVED. Notified Finance Officer via email + dashboard. REJECT - Reason required. Status becomes REJECTED. Finance Officer notified. REQUEST MORE INFO - Status becomes NEEDS_INFO. Finance Officer notified. STEP 7: After approval, Payment Processor executes payment. Status becomes PAID. STEP 8: Accountant reconciles. Status becomes RECONCILED. STEP 9: Escalation: No action within 48 hours sends reminder and escalates to next level. For expenses under 1,000 ETB, the Petty Cash workflow may be used instead. ALL NOTIFICATIONS ARE SENT VIA EMAIL AND DASHBOARD.'

# ============================================================
# 26. Update final checklist
# ============================================================
$content = $content -replace [regex]::Escape('# Module Feature Status
1 Income Recording from all sources Specified
2 Expense Recording with categories Specified
3 CEO Approval for ALL expenses Specified
4 Dashboard Notifications (NO EMAIL) Specified
5 CEO Approval Modal Specified
6 Finance Officer Status Dashboard Specified
7 Customer Credit Management Specified
8 Accounts Receivable Aging Specified
9 Accounts Payable Aging Specified
10 Profit   Loss Statement Specified
11 Balance Sheet Specified
12 Cash Flow Statement Specified
13 Expense Report by Category Specified
14 Bank Reconciliation Specified
15 Audit Trail Specified'),
    '# Module Feature Status
1 Income Recording from all sources Specified
2 Expense Recording with categories Specified
3 Multi-Tier Approval Workflow (Manager/Director/CEO) Specified
4 Email + Dashboard Notifications Specified
5 Budgetary Control &amp; Encumbrance Accounting Specified
6 Petty Cash Management Specified
7 Approver Dashboards (Manager/Director/CEO) Specified
8 Finance Officer Dashboard (Expense + Budget) Specified
9 Customer Credit Management with Credit Limits Specified
10 Accounts Receivable Aging with Dunning Specified
11 Accounts Payable Aging Specified
12 Profit &amp; Loss Statement by Business Unit Specified
13 Balance Sheet Specified
14 Cash Flow Statement Specified
15 Budget vs Actual Reports Specified
16 Expense Report by Category Specified
17 Bank Reconciliation Specified
18 Audit Trail with Before/After Snapshots Specified
19 Segregation of Duties (Record/Process/Reconcile) Specified
20 Ethiopian Tax Compliance (VAT, Withholding, PAYE, Pension) Specified
21 Multi-Currency Support Specified
22 Month-End Close Process with Checklist Specified
23 Chart of Accounts (Hierarchical, Double-Entry) Specified
24 Payment Scheduling (Payment Runs) Specified
25 3-Way Matching (PO/GRN/Invoice) Specified
26 Period Locking &amp; Close Approval Specified'

# ============================================================
# 27. Update final verdict
# ============================================================
$content = $content -replace [regex]::Escape('13.3 Final Verdict The Finance   Expense Management Module is COMPLETE and READY FOR DEVELOPMENT. All expenses require CEO approval regardless of amount or category. All approval notifications are delivered via CEO dashboard only - NO EMAILS. This is the complete Finance Module SRS docum'),
    '13.3 Final Verdict The Finance &amp; Expense Management Module is COMPLETE and READY FOR DEVELOPMENT. This SRS implements ERP industry standards including: multi-tier approval workflow, segregation of duties, budgetary control with encumbrance accounting, email + dashboard notifications, petty cash management, Ethiopian tax compliance (VAT, Withholding, PAYE, Pension), hierarchical Chart of Accounts, 3-way matching, payment scheduling, month-end close process, credit limits, multi-currency support, and comprehensive audit trail. The module aligns with standard ERP finance practices while addressing Ethiopian regulatory requirements.'

# Write the modified XML back
[System.IO.File]::WriteAllText($xmlPath, $content, [System.Text.Encoding]::UTF8)
Write-Host "Document updated successfully"
