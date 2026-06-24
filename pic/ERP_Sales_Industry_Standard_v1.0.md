# ERP Sales & Point of Sale (POS) Module
## Industry Standard Specification v1.0

> **Document Classification:** Internal — Reference Architecture
> **Target Systems:** SAP S/4HANA Sales, Oracle NetSuite ERP, Microsoft Dynamics 365 Sales, Odoo Sales, Infor CloudSuite
> **Date:** June 2026

---

# Table of Contents

1. [Sales Officer Role & Privileges](#1-sales-officer-role--privileges)
2. [Complete Sales Workflows](#2-complete-sales-workflows)
3. [Multi-Channel Order Management](#3-multi-channel-order-management)
4. [Pricing & Promotions Engine](#4-pricing--promotions-engine)
5. [Customer Relationship Management (CRM)](#5-customer-relationship-management)
6. [Returns, Refunds & RMA](#6-returns-refunds--rma)
7. [Inventory & Fulfillment Integration](#7-inventory--fulfillment-integration)
8. [Payment Processing & Reconciliation](#8-payment-processing--reconciliation)
9. [Reporting & Analytics](#9-reporting--analytics)
10. [Security, Audit & Compliance](#10-security-audit--compliance)
11. [Integration Contracts & APIs](#11-integration-contracts--apis)
12. [Appendices](#12-appendices)

---

# 1. Sales Officer Role & Privileges

## 1.1 Role Hierarchy

Industry-standard ERP systems define a hierarchy of sales roles with graduated privileges:

| Role | Scope | System Access | Reports To |
|---|---|---|---|
| **Sales Associate** (Cashier) | Single POS terminal, own transactions | POS Terminal Only | Shift Supervisor / Store Manager |
| **Shift Supervisor** | All terminals in one shift | POS + Supervisor Dashboard | Store Manager |
| **Store Manager** | Full store operations | POS + Manager Dashboard + Reports | Regional Sales Manager |
| **Regional Sales Manager** | Multiple stores/units | Analytics, Pricing, Promotions | Director of Sales |
| **Director of Sales** | Company-wide | Strategic Reports, Target Setting | CEO / COO |
| **Sales Administrator** | Back-office | Price Lists, Customer Admin, Contract Setup | Director of Sales |

## 1.2 Sales Associate (Cashier) — Complete Privileges Matrix

### Core POS Privileges

| Privilege ID | Privilege | Default | Overrideable By | Notes |
|---|---|---|---|---|
| SA-01 | Log in to POS terminal with employee credentials | ✓ Granted | — | Requires active employee record + Sales Associate role |
| SA-02 | Scan/search products via barcode or text | ✓ Granted | — | Scoped to assigned business unit's inventory |
| SA-03 | Add items to cart with quantity | ✓ Granted | — | Validated against available stock |
| SA-04 | Modify cart item quantity | ✓ Granted | — | Cannot exceed available stock |
| SA-05 | Remove items from cart | ✓ Granted | — | — |
| SA-06 | Apply discount up to role limit (default 15%) | ✓ Granted | Manager | Exceeding limit requires manager PIN override |
| SA-07 | Accept cash payment | ✓ Granted | — | Must calculate correct change |
| SA-08 | Accept credit/debit card payment | ✓ Granted | — | Requires payment terminal integration |
| SA-09 | Accept mobile money (Telebirr, MPesa, etc.) | ✓ Granted | — | Reference number required |
| SA-10 | Process credit sale (customer account) | ✓ Granted (if trained) | Manager | Requires customer validation + credit limit check |
| SA-11 | Complete sale & generate invoice | ✓ Granted | — | Atomic: inventory + finance + audit |
| SA-12 | Print / email / SMS receipt | ✓ Granted | — | Customer preference |
| SA-13 | Suspend transaction (park cart) | ✓ Granted | — | Retrievable within same shift only |
| SA-14 | Resume suspended transaction | ✓ Granted | — | Only own suspended carts |
| SA-15 | Start shift (confirm opening float) | ✓ Granted | — | Entered by Manager, confirmed by Cashier |
| SA-16 | Close shift (submit cash count) | ✓ Granted | — | Discrepancy requires comment |
| SA-17 | View own shift report | ✓ Granted | — | Read-only after shift closure |
| SA-18 | Request supervisor override | ✓ Granted | — | Triggers notification to Shift Supervisor |
| SA-19 | Process customer returns (within limit) | Requires Training | Manager | See Returns Section |
| SA-20 | Issue gift card | ✓ Granted | — | Requires gift card activation |

### Privileges Explicitly NOT Granted to Sales Associate

| Action | Reason |
|---|---|
| Void a completed transaction | Fraud prevention — reserved for Admin/Finance |
| Approve discounts above limit | Segregation of duties |
| Modify product prices | Pricing authority reserved for Manager/Sales Admin |
| Create/Edit customer accounts beyond basic info | Data integrity |
| Access other cashier's shift reports | Privacy |
| Close register without counting cash | Accountability |
| Change own discount limit | Segregation of duties |
| Export system data | Data security |
| Modify tax rates | Compliance — reserved for Finance |
| Process refunds without a receipt | Fraud prevention — requires Manager |

## 1.3 Shift Supervisor — Extended Privileges

All Sales Associate privileges (SA-01 through SA-20) **PLUS**:

| Privilege ID | Privilege | Notes |
|---|---|---|
| SS-01 | Override discount approvals above Sales Associate limit | Secondary authentication (PIN/biometrics) |
| SS-02 | View all cashier shift reports for current shift | — |
| SS-03 | Suspend/unsuspend any cashier's transaction | Supervisor override |
| SS-04 | Approve customer returns without receipt | Subject to store policy limits |
| SS-05 | Authorize price adjustments within limit (±10%) | Logged with Supervisor ID |
| SS-06 | Force-close a cashier's shift | Used when cashier is unable to close |
| SS-07 | Assign/reassign POS terminals to cashiers | — |
| SS-08 | Perform contingency end-of-day if Manager absent | Requires dual-authorization with another Supervisor |

## 1.4 Store Manager — Extended Privileges

All Supervisor privileges (SS-01 through SS-08) **PLUS**:

| Privilege ID | Privilege | Notes |
|---|---|---|
| SM-01 | Full user management for store-level roles | Cannot create Admin accounts |
| SM-02 | Create and modify price lists | Effective dating, scheduled changes |
| SM-03 | Create promotions (BOGO, % off, bundle) | Requires Director approval for >20% discount |
| SM-04 | Set and modify discount limits per role | Within policy set by Director |
| SM-05 | Access full store sales reports & dashboards | Drill-down to product/cashier level |
| SM-06 | Approve write-offs and inventory adjustments | Up to 10,000 ETB per adjustment |
| SM-07 | Manage customer accounts (create, credit limit) | Credit limit changes require Finance approval |
| SM-08 | Configure POS terminal settings | Receipt format, tax defaults, shift timing |
| SM-09 | Process no-receipt returns (subject to policy) | Limits per customer, tracked in CRM |
| SM-10 | View and respond to cash discrepancy alerts | Must resolve or escalate within 24 hours |
| SM-11 | Manage inventory transfers between units | Requires destination confirmation |
| SM-12 | Generate store P&L reports | — |

## 1.5 Regional Sales Manager — Extended Privileges

| Privilege ID | Privilege | Notes |
|---|---|---|
| RM-01 | Cross-store sales analytics & comparison | Benchmarking across region |
| RM-02 | Set and modify regional pricing | Within corporate guidelines |
| RM-03 | Approve promotions exceeding store manager limits | — |
| RM-04 | View and approve staff performance metrics | — |
| RM-05 | Regional inventory allocation | Rebalance stock across stores |
| RM-06 | Escalation point for unresolved discrepancies | — |
| RM-07 | Generate regional revenue forecasts | — |

## 1.6 Sales Administrator (Back-Office) — Extended Privileges

| Privilege ID | Privilege | Notes |
|---|---|---|
| AD-01 | Create and maintain product catalog | Categories, attributes, variants |
| AD-02 | Create and maintain price lists | Multiple lists, effective dating, versions |
| AD-03 | Configure tax codes and rates | Per product category, per jurisdiction |
| AD-04 | Create customer contracts and agreements | Volume discounts, net terms |
| AD-05 | Manage sales quotas and targets | Per salesperson, per store, per region |
| AD-06 | Configure POS system parameters | Receipt templates, tax defaults, shift config |
| AD-07 | Import/export product data | CSV/Excel bulk operations |
| AD-08 | Configure payment method availability | Per business unit, per terminal |

---

# 2. Complete Sales Workflows

## 2.1 Lead-to-Cash Lifecycle

```
                   ┌─────────────────────────────────────────────────────┐
                   │                   LEAD-TO-CASH                      │
                   │                                                      │
    ┌──────┐   ┌──────┐   ┌──────┐   ┌──────┐   ┌──────┐   ┌──────┐
    │LEAD  │──▶│OPPORT│──▶│QUOTE │──▶│ORDER │──▶│FULFILL│──▶│CASH  │
    │      │   │UNITY │   │      │   │      │   │MENT  │   │      │
    └──────┘   └──────┘   └──────┘   └──────┘   └──────┘   └──────┘
                                                      │
                                                      ▼
                                                ┌──────────┐
                                                │ INVOICE  │
                                                └──────────┘
```

### 2.1.1 Lead Management
- **Source attribution:** Walk-in, web, referral, phone, email campaign, trade show
- **Lead capture:** Name, phone, email, source, interest area, notes
- **Lead qualification:** Hot/Warm/Cold scoring based on engagement
- **Lead assignment:** Auto-assign to available sales staff (round-robin) or manual
- **Lead conversion:** Convert to customer profile with full KYC

### 2.1.2 Opportunity Management
- **Opportunity stages:** New → Qualification → Needs Analysis → Proposal → Negotiation → Closed Won/Lost
- **Expected value:** Weighted pipeline = Sum(opp_value × win_probability)
- **Product interest:** Which products/services the customer is evaluating
- **Competitor tracking:** Which competitor they're also considering
- **Expected close date:** Rolling forecast

### 2.1.3 Quotation
- **Quotation creation:** From opportunity or ad-hoc
- **Line items:** Products/services with quantities, negotiated prices
- **Discounts:** Line-level and header-level discounts
- **Validity period:** Quotation expires after set date
- **Versioning:** Quotation revisions tracked (Rev 1, Rev 2, ...)
- **Approval workflow:** Quotations above threshold require Manager approval
- **Conversion:** Accepted quotation auto-creates a Sales Order

### 2.1.4 Sales Order Processing
- **Order sources:** POS terminal, web store, salesperson mobile, EDI, phone order
- **Order types:** Standard, Rush, Backorder, Drop-ship, Standing Order
- **Order states:** Draft → Confirmed → In Fulfillment → Shipped → Invoiced → Closed
- **Hold management:** Credit hold, price hold, approval hold, inventory hold
- **Split orders:** Partial fulfillment by warehouse
- **Order amendment:** Changes tracked with version history
- **Order cancellation:** Full or partial, with reason code

### 2.1.5 Fulfillment & Shipping
- **Pick-pack-ship:** Wave picking, zone picking, single-order picking
- **Packing verification:** Scan-verified item count
- **Shipping methods:** In-store pickup, courier, freight, own fleet
- **Tracking integration:** Real-time carrier tracking (DHL, FedEx, local)
- **Partial shipments:** Multiple shipments per order
- **Delivery confirmation:** Customer signature (digital) or delivery proof

### 2.1.6 Invoicing & Cash
- **Invoice generation:** On fulfillment completion or on payment (POS)
- **Invoice types:** Standard, Credit Note, Debit Note, Proforma, Recurring
- **Credit management:** Customer credit limit check before invoice posting
- **Payment allocation:** Manual or automatic (by invoice number, by oldest due)
- **Dunning:** Automated payment reminders at 0, 7, 15, 30 days overdue
- **Cash application:** Match customer payments to open invoices

## 2.2 Point of Sale (Walk-in) Transaction Flow

```
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│  CUSTOMER│   │ PRODUCT  │   │   CART   │   │ PAYMENT  │   │COMPLETION│
│  ARRIVES │──▶│ SELECTION│──▶│ REVIEW   │──▶│   FLOW   │──▶│          │
└──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘
                                                      │
                                                      ▼
                                                ┌──────────┐
                                                │ RECEIPT  │
                                                │ + NOTIFY │
                                                └──────────┘
```

## 2.3 Credit Sale (Customer Account) Workflow

```
┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐
│CUSTOMER│   │IDENTIFY│   │VERIFY  │   │CREATE  │   │CONFIRM │   │RECORD  │
│ SELECT │──▶│CREDIT  │──▶│CREDIT  │──▶│INVOICE │──▶│SALE    │──▶│RECEIV. │
│        │   │LIMIT   │   │AVAIL.  │   │        │   │        │   │        │
└────────┘   └────────┘   └────────┘   └────────┘   └────────┘   └────────┘
                                      │
                                      ▼
                               ┌──────────────┐
                               │ 30-DAY DUE   │
                               │   AUTOMATIC  │
                               │ DUNNING ON   │
                               │  OVERDUE     │
                               └──────────────┘
```

## 2.4 Recurring / Subscription Billing Workflow

- **Subscription types:** Fixed-term, evergreen, usage-based, tiered
- **Billing frequency:** Weekly, monthly, quarterly, annual, custom
- **Invoice generation:** Automated on billing date
- **Payment collection:** Standing instruction, auto-debit, card-on-file
- **Proration:** Mid-cycle upgrades/downgrades prorated
- **Renewal management:** Auto-renew with notification, or manual renewal
- **Churn handling:** Cancellation reason collection, win-back workflow

---

# 3. Multi-Channel Order Management

## 3.1 Channel Types

| Channel | System Touchpoint | Order Entry | Fulfillment |
|---|---|---|---|
| **Physical POS (In-Store)** | POS Terminal | Sales Associate | Immediate handover |
| **E-Commerce (Web Store)** | Customer Portal | Customer (self-service) | Warehouse/Pick-pack |
| **Mobile App** | Customer Mobile App | Customer (self-service) | Warehouse/Pick-pack |
| **Phone Order** | Salesperson or CSR | Salesperson (internal) | Warehouse |
| **B2B Portal** | Customer Portal | Customer (self-service or punch-out) | Warehouse |
| **Marketplace** | API Integration (e.g., Shopify, Jumia) | Automated sync | Warehouse |
| **EDI** | Electronic Data Interchange | Automated | Warehouse |
| **Salesperson Mobile** | Mobile Sales App | Salesperson (field) | Warehouse or direct |

## 3.2 Omni-Channel Order Visibility

Industry-standard requirement: **Any order from any channel is visible in real time across all touchpoints.**

- Customer can buy online, return in-store
- In-store stock check shows e-commerce reserved stock
- Salesperson can see customer's online browsing history and cart
- Unified customer profile across all channels
- Unified inventory across all channels (with allocation rules)

## 3.3 Order Orchestration

| Function | Description |
|---|---|
| **Order Routing** | Auto-route to nearest fulfillment center based on stock availability |
| **Split Shipment** | Optimize shipping cost by splitting across warehouses |
| **Cross-Docking** | Inbound stock directly routed to outbound customer orders |
| **Backorder Management** | Auto-notification, estimated availability date, cancellation option |
| **Pre-order / Reserve** | Accept orders before stock arrives |
| **Click & Collect** | Buy online, pick up in store (BOPIS) |
| **Ship-from-Store** | Use store inventory to fulfill online orders |

---

# 4. Pricing & Promotions Engine

## 4.1 Price Types

| Price Type | Definition | Priority |
|---|---|---|
| **Base List Price** | Default catalog price | Lowest priority |
| **Customer Price List** | Negotiated prices for specific customer/group | Medium |
| **Volume Tier Pricing** | Price breaks by quantity (e.g., 100+ units) | Higher than list |
| **Contract Price** | Fixed price per contract agreement | High |
| **Promotional Price** | Temporary price reduction | Highest (overrides all) |
| **Bundle Price** | Fixed price for product bundle | Overrides component prices |

## 4.2 Promotion Types

| Promotion Type | Example | System Requirements |
|---|---|---|
| **Percentage Discount** | "15% off all seeds" | Discount field, product/category filter, date range |
| **Fixed Amount Off** | "500 ETB off purchases over 5,000 ETB" | Threshold validation |
| **Buy One Get One (BOGO)** | "Buy 2, get 1 free" | BOGO rule engine, component products |
| **Bundle Deal** | "Farming starter kit: 3 items for 1,200 ETB" | Bundle product setup, override component prices |
| **Volume Discount** | "10% off when buying 50+ units" | Tiered pricing table |
| **Loyalty Points Redeem** | "Redeem 500 points for 250 ETB discount" | Points-to-currency conversion rate |
| **Coupon / Voucher** | "Enter code SPRING15 for 15% off" | Coupon code generation, single/multiple use |
| **Seasonal Sale** | "End-of-season sale 20-50% off" | Date range, category filter |
| **Flash Sale** | "Today only: 40% off selected items" | Time-limited (hours), quantity-limited |
| **Employee Discount** | "Staff price: cost + 5%" | Role-based pricing rule |
| **Member Price** | "Gold members get 10% extra discount" | Loyalty tier-based rule |

## 4.3 Pricing Engine Evaluation Order

```
1. Contract Price (if customer has contract for this product)
2. Customer-Specific Price List (if assigned)
3. Customer Group Price List (if group exists)
4. Volume Tier Price (if quantity >= tier threshold)
5. Promotional Price (if active promotion applies)
6. Base List Price (fallback)
```

---

# 5. Customer Relationship Management (CRM)

## 5.1 Unified Customer Profile

Every customer has a single, unified profile across all channels:

| Field | Required | Notes |
|---|---|---|
| Customer ID | Auto-generated | Unique, system-generated |
| Full Name | ✓ | — |
| Phone Number | ✓ | Primary contact |
| Email Address | Business/Varies | — |
| Physical Address | Business/Varies | Region, city, sub-city, landmark |
| Tax ID / TIN | For B2B | Required for invoice with tax |
| Customer Group | ✓ | Retail, Wholesale, Corporate, Government, NGO |
| Credit Limit | Default 0 | 0 = no credit allowed |
| Current Balance | Auto-calculated | Sum of open invoices |
| Payment Terms | Default: Immediate | Net 15, Net 30, etc. |
| Loyalty Tier | Auto-calculated | Based on annual spend |
| Total Lifetime Value | Auto-calculated | Historical total spend |
| Last Purchase Date | Auto-calculated | — |
| Preferred Communication | Business/Varies | SMS, Email, WhatsApp |
| Tags | Optional | e.g., "VIP", "Wholesale", "Complaint" |

## 5.2 Customer Segmentation

| Segment | Criteria | Benefits |
|---|---|---|
| Bronze | Annual spend < 50K ETB | Standard pricing |
| Silver | Annual spend 50K–200K ETB | 3% discount |
| Gold | Annual spend 200K–500K ETB | 7% discount, priority support |
| Platinum | Annual spend 500K+ ETB | 12% discount, dedicated account manager |
| Wholesale | Business registration + bulk purchasing | Wholesale price list |
| Government | Government entity | Gov. contract pricing, deferred payment |
| NGO | Registered NGO | NGO pricing, project-based billing |
| Internal | Employee | Cost + 5% pricing |

## 5.3 Loyalty Program

| Feature | Description |
|---|---|
| **Points Accrual** | 1 point per 10 ETB spent (configurable ratio) |
| **Points Expiry** | 12 months from last earning date |
| **Points Redemption** | 100 points = 10 ETB discount (configurable) |
| **Bonus Points** | Double points on birthdays, promotional periods |
| **Tier Upgrade** | Automatic on crossing spend threshold |
| **Tier Downgrade** | Annual review: demote if spend drops below threshold |
| **Points on Returns** | Points deducted when return is processed |
| **Sign-up Bonus** | 500 points on first registration |

---

# 6. Returns, Refunds & RMA

## 6.1 Return Types

| Type | Description | Who Can Process |
|---|---|---|
| **Standard Return** | Customer returns item within policy period with receipt | Sales Associate (trained) |
| **No-Receipt Return** | Customer returns without proof of purchase | Shift Supervisor+ |
| **Exchange** | Customer returns item and purchases replacement | Sales Associate |
| **Warranty Return** | Item defective within warranty period | Sales Associate (with warranty check) |
| **RMA** | Return Merchandise Authorization (pre-approved) | Sales Admin / Manager |
| **Damage-in-Transit** | Item arrived damaged | Sales Associate (with photo evidence) |

## 6.2 Return Workflow

```
┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐
│CUSTOMER│   │VERIFY  │   │INSPECT │   │PROCESS │   │COMPLETE│
│PRESENTS│──▶│RECEIPT │──▶│CONDITION│──▶│REFUND  │──▶│        │
│ ITEM   │   │/ORDER  │   │        │   │/EXCHANGE│   │        │
└────────┘   └────────┘   └────────┘   └────────┘   └────────┘
                                           │
                    ┌──────────────────────┼──────────────────────┐
                    ▼                      ▼                      ▼
              ┌──────────┐          ┌──────────┐          ┌──────────┐
              │ RESTOCK  │          │ REFUND   │          │ EXCHANGE │
              │ INVENTORY│          │  - CASH  │          │ + NEW    │
              │          │          │  - STORE │          │  SALE    │
              │          │          │  CREDIT  │          │          │
              │          │          │  - CARD  │          │          │
              └──────────┘          └──────────┘          └──────────┘
```

## 6.3 Return Policy Configuration

| Setting | Default | Purpose |
|---|---|---|
| Return window (days) | 30 | How long after purchase returns are accepted |
| Restocking fee % | 0% | Fee charged for non-defective returns |
| Condition thresholds | Unopened, Opened, Damaged | Different refund % per condition |
| Non-returnable categories | Medicines, undergarments | Product category blacklist |
| Max no-receipt value | 1,000 ETB | Per transaction limit for receiptless returns |
| No-receipt frequency limit | 3 per 90 days | Per customer anti-fraud limit |

## 6.4 Refund Methods

| Method | Processing Time | System Action |
|---|---|---|
| Cash refund | Immediate | Cash drawer opens, transaction logged |
| Credit/debit card refund | 3–5 business days | Reversal submitted via payment terminal |
| Store credit / Gift card | Immediate | Issued as electronic or physical gift card |
| Bank transfer | 1–2 business days | Finance initiates transfer |
| Customer account credit | Immediate | Credit memo applied to customer account |

---

# 7. Inventory & Fulfillment Integration

## 7.1 Real-Time Stock Visibility

| Feature | Description |
|---|---|
| **Real-time stock levels** | Updated atomically with each sale, receipt, adjustment |
| **Multi-warehouse** | Separate stock per warehouse/location |
| **Bin location** | Specific shelf/bin tracking for picking efficiency |
| **Serial/lot tracking** | Track individual units for warranty, recall |
| **Batch expiry** | First-expiry-first-out (FEFO) for perishable goods |
| **Stock allocation** | Reserve stock for open orders, prevent overselling |
| **Low-stock alerts** | Configurable threshold per product |
| **Reorder point** | Auto-calculate reorder quantity (EOQ formula) |
| **Stock counting** | Cycle counting and full physical inventory |

## 7.2 Fulfillment Methods

| Method | Description | Use Case |
|---|---|---|
| **Immediate handover** | Customer receives product at POS | In-store purchases |
| **Will-call / Layaway** | Reserved for customer pickup | Large items, partial payment |
| **Ship-from-store** | Store staff picks and ships | Online orders fulfilled locally |
| **Ship-from-warehouse** | Central warehouse fulfillment | Bulk/e-commerce orders |
| **Drop-ship** | Supplier ships directly to customer | Items not in own inventory |
| **Cross-dock** | Incoming goods routed to outgoing orders | Distribution centers |

## 7.3 Backorder Management

- **Backorder creation:** Auto-create when order exceeds available stock
- **Customer notification:** Email/SMS on creation and when stock arrives
- **Partial fulfillment:** Ship available items; backorder remaining
- **Backorder cancellation:** Customer may cancel at any time before shipment
- **Allocation rules:** First-ordered, first-allocated (unless VIP override)

---

# 8. Payment Processing & Reconciliation

## 8.1 Payment Methods

| Method | System Handling | Clearance Time |
|---|---|---|
| **Cash** | Cash drawer, shift reconciliation | Same day |
| **Credit/Debit Card** | Payment terminal integration (PCI-DSS) | T+1 to T+3 |
| **Mobile Money** (Telebirr, M-Pesa) | API integration, reference number | Real-time |
| **Bank Transfer** | Manual or API (EBS) | T+1 to T+2 |
| **Check** | Check number + bank deposit | T+3 to T+5 |
| **Customer Credit** | Receivables ledger update | Due in 30 days |
| **Store Credit / Gift Card** | Liability account deduction | Immediate |
| **Loyalty Points** | Points account deduction | Real-time |
| **Buy Now Pay Later** (BNPL) | Third-party integration | Per provider (T+30+) |

## 8.2 Cash Reconciliation Flow

```
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│ SHIFT    │   │ PHYSICAL │   │ SYSTEM   │   │ VARIANCE │   │ SIGN-OFF │
│ START    │──▶│ CASH     │──▶│ EXPECTED │──▶│ ANALYSIS │──▶│          │
│ (FLOAT)  │   │ COUNT    │   │ TOTAL    │   │          │   │          │
└──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘
                                                      │
                                              ┌───────┴───────┐
                                              │               │
                                              ▼               ▼
                                        ┌──────────┐   ┌──────────┐
                                        │ ZERO VAR │   │NON-ZERO  │
                                        │ CLOSED   │   │INVESTIGATE│
                                        └──────────┘   │ + REPORT  │
                                                       └──────────┘
```

## 8.3 Float Management

| Action | Description | Responsible |
|---|---|---|
| **Float allocation** | Manager assigns opening cash to cashier | Shift Supervisor |
| **Float confirmation** | Cashier confirms float amount in system | Sales Associate |
| **Float deduction** | Deducted from cashier's end-of-day cash total | Automatic |
| **Float handover** | Physical cash + system acknowledgement | Cashier → Manager |
| **Float audit** | Surprise float count verification | Regional Manager |

---

# 9. Reporting & Analytics

## 9.1 Real-Time Dashboards

### Sales Associate Dashboard
- Current shift sales total
- Number of transactions completed
- Average transaction value
- Items sold per hour
- Discounts given (total value, % of sales)
- Time remaining in shift

### Shift Supervisor Dashboard
- All active cashiers with current totals
- Pending override requests
- Cash discrepancy alerts (live)
- Store-wide sales vs. target (today)
- Peak hours sales volume

### Store Manager Dashboard
| Metric | Description | Refresh |
|---|---|---|
| Today's Sales vs Target | Real-time comparison | Live |
| Week-to-Date vs Forecast | Rolling weekly view | Live |
| Top 10 Selling Products | Current day | Live |
| Slow-Moving Inventory | 90-day zero movement | Daily |
| Cashier Performance | Sales per hour, items per transaction | Live |
| Discount % of Sales | Overall and per cashier | Live |
| Return Rate % | Returns ÷ Sales for current period | Live |
| Customer Count | Unique customers served | Live |
| Average Basket Size | Items per transaction trend | Live |
| Hourly Sales Trend | Sales volume by hour | Live |

### Regional Manager Dashboard
- Multi-store sales comparison
- Same-store sales growth (YoY)
- Inventory turnover by store
- Staff productivity ranking
- Promotion effectiveness analysis
- Customer acquisition cost by channel

## 9.2 Standard Reports

| Report ID | Report | Frequency | Audience |
|---|---|---|---|
| R-01 | Daily Sales Summary | End of Day | Store Manager, Finance |
| R-02 | Cashier Shift Report | Per Shift | Cashier, Manager |
| R-03 | Cash Reconciliation Report | End of Day | Manager, Finance |
| R-04 | Payment Method Summary | Daily | Finance |
| R-05 | Tax Summary (VAT) | Daily/Monthly | Finance, Tax Authority |
| R-06 | Top Selling Products (MTD) | Weekly | Store Manager |
| R-07 | Slow-Moving Inventory | Weekly | Store Manager |
| R-08 | Discount Analysis | Weekly | Store Manager, Regional |
| R-09 | Return/Refund Report | Weekly | Store Manager |
| R-10 | Customer Credit Aging | Weekly | Finance |
| R-11 | Monthly P&L by Business Unit | Monthly | All Management |
| R-12 | Sales vs Target (YTD) | Monthly | Regional, CEO |
| R-13 | Customer Acquisition Report | Monthly | Marketing, Sales |
| R-14 | Promotion ROI Analysis | Per Promotion | Regional, Director |
| R-15 | Year-over-Year Comparison | Monthly/Quarterly | CEO, Board |

---

# 10. Security, Audit & Compliance

## 10.1 Authentication & Authorization

| Requirement | Standard | Implementation |
|---|---|---|
| **Authentication** | Multi-factor (password + optional OTP/biometric) | JWT with refresh tokens |
| **Session timeout** | 15 minutes idle | Auto-logout with warning |
| **Password policy** | Min 8 chars, complexity, 90-day expiry | Enforced at login |
| **Role-based access** | RBAC per privilege matrix (Section 1) | Attribute-based policy engine |
| **Dual-control** | Critical actions require 2nd approver | Discount override, void, write-off |
| **Terminal binding** | Cashier logged into one terminal at a time | Session bound to device ID |

## 10.2 Audit Trail Requirements

| Event | Data Captured | Retention |
|---|---|---|
| User login/logout | User ID, timestamp, IP, terminal ID, outcome | 7 years |
| Transaction (sale) | Full invoice details, cashier ID, items, prices | 7 years |
| Discount application | Discount %, amount, reason, approver (if overridden) | 7 years |
| Void | Original invoice, void reason, Finance Officer ID | Permanent (immutable) |
| Return/Refund | Original invoice, return reason, item condition | 7 years |
| Price override | Original price, new price, reason, approver | 7 years |
| Customer credit change | Previous limit, new limit, changed by | 7 years |
| Inventory adjustment | Product, previous qty, new qty, reason, user | 7 years |
| User role change | Previous roles, new roles, changed by | 7 years |
| Shift open/close | Cashier, float, time, expected vs. actual cash | 7 years |
| Cash discrepancy | Expected, actual, difference, comment, manager | 7 years |
| Data export | User, timestamp, data scope, destination | 2 years |

## 10.3 Tamper-Evident Logging

- **Append-only:** Logs may not be modified or deleted by any user
- **Hash chaining:** Each log entry contains hash of previous entry (blockchain-light)
- **Write-once storage:** Logs written to storage with no update/delete API
- **Separate access:** Log viewing is read-only via report interface
- **Integrity verification:** Daily cron job verifies hash chain integrity
- **Alert on tamper:** System administrator notified if hash chain is broken

## 10.4 Compliance Requirements

| Regulation | Applicability | Requirements |
|---|---|---|
| **Tax Law (Ethiopia)** | Mandatory | VAT 15%, withholding tax, sales tax reports |
| **Data Protection** | Recommended | Customer data privacy, consent, purpose limitation |
| **PCI DSS** | If card payments | Card data never stored, encrypted transmission, SAQ |
| **IFRS 15** | Accounting standard | Revenue recognition per performance obligations |
| **SOX (US)** | If publicly traded | Internal controls, audit trail, segregation of duties |
| **Local procurement law** | Government contracts | Competitive bidding, tender tracking |

---

# 11. Integration Contracts & APIs

## 11.1 Internal Module Integration

| Module | Integration Type | Data Shared |
|---|---|---|
| **Finance/GL** | Event-driven | Journal entries for every sale, return, void |
| **Inventory** | Real-time API | Stock query, stock deduction, stock receipt |
| **Accounts Receivable** | Event-driven | Invoice creation, payment allocation, aging |
| **HR/Employee** | Reference data | Employee roles, terminal permissions |
| **CRM** | Shared database | Customer profile, interaction history |
| **Procurement/Purchasing** | Reference data | Supplier product catalog, purchase orders |
| **Reporting/BI** | Data warehouse | All transactional data (aggregated) |
| **Audit** | Event bus | All auditable events pushed to audit service |

## 11.2 External Integration

| Integration | Protocol | Data Flow |
|---|---|---|
| **Bank payment gateway** | REST API (HTTPS) | Payment initiation, status callback |
| **Mobile money (Telebirr)** | REST API + Webhook | Transaction request, callback notification |
| **Card payment terminal** | LAN/USB/Bluetooth | Transaction amount, approval code |
| **E-commerce platform** | REST API (OAuth2) | Product sync, order sync, customer sync |
| **Tax authority (e-invoicing)** | REST API | Invoice submission, tax report submission |
| **SMS gateway** | REST API | Transaction alerts, OTP, marketing |
| **Email service** | SMTP / API | Invoices, receipts, dunning letters |
| **Barcode label printer** | Printer driver | Price tag / shelf label printing |

## 11.3 Webhook / Event Definitions

| Event | Trigger | Payload (Summary) | Subscribers |
|---|---|---|---|
| `sale.completed` | POS transaction finalized | Invoice ID, amount, items, payment method | Finance, Inventory, CRM |
| `return.processed` | Return completed | Return ID, original invoice, refund amount | Finance, Inventory |
| `void.executed` | Transaction voided | Original invoice, void reason, officer | Finance, Inventory, Audit |
| `cash.discrepancy` | Shift close with variance | Cashier, expected, actual, difference | Audit, Manager |
| `credit.limit.exceeded` | Sale blocked by credit check | Customer, current balance, attempted amount | CRM, Sales Admin |
| `stock.low` | Stock below threshold | Product, current qty, reorder point | Purchasing, Store Manager |
| `customer.created` | New customer profile | Customer ID, name, phone, segment | CRM |
| `price.change` | Price list updated | Product ID, old price, new price | Audit |

---

# 12. Appendices

## 12.1 POS Terminal Hardware Specification (Reference)

| Component | Specification | Notes |
|---|---|---|
| **Terminal device** | PC / Tablet with 15.6" minimum display | Touchscreen recommended |
| **Barcode scanner** | 2D imager, USB HID, auto-scan | Supports 1D + QR codes |
| **Receipt printer** | Thermal, 80mm paper, USB/Ethernet | Auto-cut, ESC/POS protocol |
| **Cash drawer** | RJ12 connector, 24V | Auto-open on sale completion |
| **Customer display** | 7" secondary display (optional) | Shows cart total + payment prompt |
| **Payment terminal** | PCI P2PE certified, LAN or Bluetooth | PIN pad for card transactions |
| **UPS** | 500VA minimum | Graceful shutdown during power loss |
| **Network** | Wired Ethernet (primary) + WiFi (fallback) | At least 10 Mbps dedicated bandwidth |

## 12.2 Key Performance Indicators (KPIs)

| KPI | Formula | Target Benchmark |
|---|---|---|
| **Average Transaction Value (ATV)** | Total Sales ÷ Number of Transactions | Increase 5% YoY |
| **Items Per Transaction (IPT)** | Total Items Sold ÷ Number of Transactions | Industry: 2.5–4 |
| **Conversion Rate** | Transactions ÷ Foot Traffic × 100 | Retail: 20–40% |
| **Shrinkage Rate** | (Book Stock - Physical Stock) ÷ Book Stock × 100 | Target: < 1% |
| **Return Rate** | Return Value ÷ Gross Sales × 100 | Target: < 5% |
| **Discount Rate** | Discount Amount ÷ Gross Sales × 100 | Target: < 8% |
| **Cashier Productivity** | Transactions per Cashier per Hour | Target: 8–12 |
| **First-Time Resolution** | Returns resolved on first visit | Target: > 90% |
| **POS Uptime** | Available hours ÷ Business hours × 100 | Target: > 99.5% |
| **Transaction Time** | Average seconds from first scan to receipt | Target: < 60s |
| **Customer Wait Time** | Seconds from arrival to first scan | Target: < 30s |
| **Credit Collection Rate** | Collected ÷ Due × 100 | Target: > 95% within terms |

## 12.3 Role Permission Summary Matrix

| Feature / Action | Cashier | Shift Supervisor | Store Manager | Regional Mgr | Sales Admin | Finance | CEO |
|---|---|---|---|---|---|---|---|
| POS Login | ✓ | ✓ | ✓ | — | — | — | — |
| Search products | ✓ | ✓ | ✓ | Read only | Read only | — | — |
| Add to cart | ✓ | ✓ | ✓ | — | — | — | — |
| Apply discount (≤ limit) | ✓ | ✓ | ✓ | — | — | — | — |
| Approve override discount | — | ✓ | ✓ | — | — | — | — |
| Complete sale | ✓ | ✓ | ✓ | — | — | — | — |
| Process return (with receipt) | ✓ (trained) | ✓ | ✓ | — | — | — | — |
| Process return (no receipt) | — | ✓ | ✓ | — | — | — | — |
| Void transaction | — | — | — | — | — | ✓ | — |
| Close shift | ✓ | ✓ | ✓ | — | — | — | — |
| View shift report (own) | ✓ | — | — | — | — | — | — |
| View shift report (all) | — | ✓ | ✓ | Summary | Summary | ✓ | — |
| Create customer | Basic | Basic | Full | — | Full | — | — |
| Modify credit limit | — | — | ✓ (limited) | ✓ | ✓ | ✓ | — |
| Create price list | — | — | ✓ | ✓ | ✓ | — | — |
| Create promotion | — | — | ✓ | ✓ | ✓ | — | — |
| Configure tax rates | — | — | — | — | — | ✓ | — |
| User management (store) | — | — | ✓ | — | — | — | — |
| View sales reports | — | — | Store | Region | Company | Company | Summary |
| View financial reports | — | — | P&L | P&L | Full | Full | Summary |
| Approve PO > 200K ETB | — | — | — | — | — | — | ✓ |
| Set discount policy limits | — | — | Within policy | Within policy | — | — | ✓ |
| Export data | — | — | ✓ (limited) | ✓ | ✓ | ✓ | — |
| View audit log | Own | Dept | Store | Region | All | All | Summary |

## 12.4 Invoice Template — Standard Fields

```
┌─────────────────────────────────────────────────────────────┐
│            SUTANA ENTERPRISE MANAGEMENT SYSTEM              │
│                    TAX INVOICE / RECEIPT                    │
├─────────────────────────────────────────────────────────────┤
│ Invoice #:    INV-20260612-0001                             │
│ Date:         2026-06-12 10:30:00                           │
│ Business Unit:  Pharmacy                                   │
│ Cashier:      CASH-001 — Alemitu Tadesse                   │
│ Terminal:     POS-03                                         │
├─────────────────────────────────────────────────────────────┤
│ Sold To:                                                    │
│ Name:        Biruk Desta                                   │
│ Phone:       +251-911-123456                                │
│ TIN:         1234567890 (if B2B)                            │
├─────────────────────────────────────────────────────────────┤
│ # │ Product           │ Qty │ Unit Price │  Total (ETB)     │
├─────────────────────────────────────────────────────────────┤
│ 1 │ Amoxicillin 500mg │  2  │    250.00  │       500.00     │
│ 2 │ Paracetamol 1g   │  1  │    120.00  │       120.00     │
├─────────────────────────────────────────────────────────────┤
│ Subtotal:                                     620.00 ETB    │
│ Discount (10%):                               -62.00 ETB    │
│ Taxable Amount:                               558.00 ETB    │
│ VAT (15%):                                     83.70 ETB    │
│ Total Due:                                    641.70 ETB    │
├─────────────────────────────────────────────────────────────┤
│ Payment:  Cash                                             │
│ Amount Received:                            1,000.00 ETB    │
│ Change Given:                               358.30 ETB      │
├─────────────────────────────────────────────────────────────┤
│ # Items: 2  │  TIN: 0001234567  │  Invoice is tax document │
│                                                             │
│        Thank you for your business!                        │
│     Goods once sold are not returnable after 30 days       │
│     For returns: www.sutanaems.com/returns                 │
└─────────────────────────────────────────────────────────────┘
```

## 12.5 Document Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.1 | June 2026 | System Architecture | Initial draft — Industry standard role matrix |
| 0.2 | June 2026 | Sales Process Owner | Added full workflows |
| 0.3 | June 2026 | Compliance | Audit, security, & compliance requirements |
| 1.0 | June 2026 | Architecture Review Board | Finalized for implementation reference |

---

*End of Document — ERP Sales & POS Industry Standard v1.0*

> This document is a reference architecture based on industry-standard ERP systems including SAP S/4HANA Sales, Oracle NetSuite, Microsoft Dynamics 365 Sales, Odoo Sales, and Infor CloudSuite. It defines the minimum feature set, privileges, and workflows required for a competitive ERP sales module.
