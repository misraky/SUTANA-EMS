# ERP Purchase & Procurement Management — Complete Industry Standard Reference

## 18 Dimensions for Purchase Order / Procurement Workflow Design

**Compiled from:** SAP S/4HANA MM (Materials Management), Oracle Fusion Cloud Procurement, Microsoft Dynamics 365 Supply Chain Management, IFS Applications, Gartner Procurement Magic Quadrant, SOX ITGC, COSO Procurement Framework, ISO 20400 Sustainable Procurement, CIPFA Procurement Standards

**Target:** Sutana Enterprise Management System — Purchase & Procurement Module Redesign

---

# TABLE OF CONTENTS

1. [Tiered Procurement Role Model](#1-tiered-procurement-role-model)
2. [Purchase Requisition (PR) Management](#2-purchase-requisition-pr-management)
3. [Sourcing & Contract Management](#3-sourcing--contract-management)
4. [Request for Quotation (RFQ) & E-Sourcing](#4-request-for-quotation-rfq--e-sourcing)
5. [Supplier Evaluation & Scorecard](#5-supplier-evaluation--scorecard)
6. [Purchase Order (PO) Management](#6-purchase-order-po-management)
7. [Approval Release Strategy](#7-approval-release-strategy)
8. [Budget Control & Commitment Accounting](#8-budget-control--commitment-accounting)
9. [Goods Receipt & Quality Management](#9-goods-receipt--quality-management)
10. [Invoice Verification & Three-Way Matching](#10-invoice-verification--three-way-matching)
11. [Payment Authorization](#11-payment-authorization)
12. [Supplier Collaboration Portal](#12-supplier-collaboration-portal)
13. [Services Procurement](#13-services-procurement)
14. [Procurement Fraud Detection](#14-procurement-fraud-detection)
15. [Procurement Analytics & KPIs](#15-procurement-analytics--kpis)
16. [Emergency & Spot Procurement](#16-emergency--spot-procurement)
17. [Consignment, Subcontracting & Stock Transfer](#17-consignment-subcontracting--stock-transfer)
18. [Procurement Audit & Compliance](#18-procurement-audit--compliance)

---

# 1. TIERED PROCUREMENT ROLE MODEL

## Industry Standard: 6 Procurement Roles

Every enterprise ERP (SAP, Oracle, Dynamics 365) divides procurement responsibilities into distinct roles with specific privileges. This is the foundation of SoD compliance.

### The 6 Procurement Tiers

| Tier | Role Name | Scope | Core Privileges | SOX Critical? |
|------|-----------|-------|-----------------|---------------|
| **P1** | **Requisitioner (Employee)** | Request goods/services | Create PR, view own PRs, track status | No |
| **P2** | **Department Approver** | Approve departmental PRs | Approve/reject PRs ≤ threshold, delegate approval | No |
| **P3** | **Procurement Officer (Buyer)** | Full procurement lifecycle | Create/amend POs, run RFQ, select suppliers, manage contracts | Yes |
| **P4** | **Finance Officer** | Budget & payment control | Verify budget, approve ≤ threshold, three-way match, authorize payment | Yes |
| **P5** | **Executive Approver (CEO/CFO)** | High-value / strategic purchases | Approve above threshold, override, strategic supplier decisions | Yes |
| **P6** | **Procurement Auditor** | Read-only compliance | View all procurement, audit logs, reports (NO create/modify) | Yes |

### Segregation of Duties Matrix

| Action | P1 | P2 | P3 | P4 | P5 | P6 |
|--------|:--:|:--:|:--:|:--:|:--:|:--:|
| Create PR | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Approve PR | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Create RFQ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Select Supplier | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Create PO | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Approve PO (≤ threshold) | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Approve PO (> threshold) | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Receive Goods | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Verify Invoice | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Authorize Payment | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Audit Procurement | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

**Hard SoD Rules (system-enforced):**
- Creator and approver of the same PO MUST be different users
- Goods receiver and payment authorizer MUST be different users
- Procurement Officer cannot approve their own supplier selection
- No single user may hold P3 + P4 roles simultaneously

---

# 2. PURCHASE REQUISITION (PR) MANAGEMENT

## Dashboard Section: "Purchase Requisitions"

### Industry Standard: PR Lifecycle

Every procurement begins with a Purchase Requisition. Industry-standard lifecycle:

```
Draft ──► Submitted ──► Under Review ──► Approved ──► RFQ / PO Conversion
  │                       │                │
  │                       ▼                ▼
  │                   Returned        Rejected (terminal)
  │                     │
  └──────────► Cancelled
```

### Dashboard UI Requirements

```
┌─────────────────────────────────────────────────────────────────────┐
│ PURCHASE REQUISITIONS                                      [+ New] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Pending My Approval: 5              Total Open: 23                 │
│                                                                     │
│  ┌──────┬──────────┬────────┬────────┬────────┬───────────────────┐ │
│  │PR #  │ REQUESTER│ DEPT   │ AMOUNT │ STATUS │ ACTIONS           │ │
│  ├──────┼──────────┼────────┼────────┼────────┼───────────────────┤ │
│  │PR-001│ Alice    │ Sales  │ 45,000 │Pending │ [Approve] [Reject]│ │
│  │PR-002│ Bob      │ IT     │ 250,000│Pending │ [Approve] [Reject]│ │
│  │PR-003│ Carol    │ Ops    │ 12,000 │ Return │ [View Comments]   │ │
│  │PR-004│ Dave     │ Fin    │ 500,000│Approved│ [Convert to PO]   │ │
│  │PR-005│ Eve      │ HR     │ 8,000  │ Draft  │ [Edit]  [Submit]  │ │
│  └──────┴──────────┴────────┴────────┴────────┴───────────────────┘ │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │ FILTERS: [All Status] [All Depts] [Date Range] [Search PR #]  │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Business Rules

- PR numbers must be auto-generated with prefix + year + sequence (e.g., `PR-2026-00001`)
- Quantity must be > 0
- Required delivery date cannot be in the past
- Estimated amount auto-calculated from line items
- Budget category mandatory (CAPEX / OPEX / COGS)
- Attachments encouraged for > 50,000 ETB

---

# 3. SOURCING & CONTRACT MANAGEMENT

## Dashboard Section: "Contracts & Agreements"

### Industry Standard: 4 Contract Types

| Contract Type | Description | Example | PO Attachment |
|--------------|-------------|---------|---------------|
| **Quantity Contract** | Fixed quantity at fixed price | 10,000 units of Item A | Yes — release orders against contract |
| **Value Contract** | Max spend at agreed prices | 1,000,000 ETB for IT hardware | Yes — releases consume value |
| **Service Contract** | Services with rates/SOW | Annual maintenance agreement | Yes — service entry sheets |
| **Framework Agreement** | Terms without volume commitment | Preferred supplier terms | No — individual POs reference terms |

### Contract Management UI

```
┌──────────────────────────────────────────────────────────────────────┐
│ CONTRACTS & AGREEMENTS                                    [+ New]   │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Active Contracts: 24               Expiring in 30 Days: 4 ⚠        │
│                                                                      │
│  ┌─────────┬────────────┬──────────┬──────────┬────────┬──────────┐ │
│  │ CONTRACT│ SUPPLIER   │ VALUE    │ CONSUMED │ STATUS │ EXPIRES  │ │
│  ├─────────┼────────────┼──────────┼──────────┼────────┼──────────┤ │
│  │ CTR-001 │ TechPro    │ 1.5M ETB │ 1.2M ETB │ Active │ 2026-12 │ │
│  │ CTR-002 │ OfficeMax  │ 500K ETB │ 500K ETB │ Full   │ 2026-08 │ │
│  │ CTR-003 │ BuildCorp  │ 5.0M ETB │ 3.0M ETB │ Active │ 2026-07⚠│ │
│  │ CTR-004 │ ConsultNet │ 2.0M ETB │ 0.5M ETB │ Active │ 2026-09 │ │
│  └─────────┴────────────┴──────────┴──────────┴────────┴──────────┘ │
│                                                                      │
│  [Create Release Order]  [Renegotiate]  [View Compliance]            │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### Contract Compliance Rules

- POs referencing a contract MUST use contracted prices (± configurable tolerance, default 3%)
- System blocks PO creation for items with active contracts from non-contract suppliers (with override + justification)
- Contract consumption tracked in real-time (quantity or value)
- Auto-alert when contract is 80%, 90%, 100% consumed
- Expired contracts cannot be referenced for new POs

---

# 4. REQUEST FOR QUOTATION (RFQ) & E-SOURCING

## Dashboard Section: "RFQ Management"

### RFQ Workflow

```
                 ┌──────────────────────────────┐
                 │  PR Approved for RFQ          │
                 │  (threshold exceeded or       │
                 │   mandatory RFQ category)     │
                 └──────────────┬───────────────┘
                                ▼
                 ┌──────────────────────────────┐
                 │  Create RFQ                  │
                 │  - Link to PR(s)             │
                 │  - Define supplier list      │
                 │  - Set closing date          │
                 │  - Attach specs/documents    │
                 └──────────────┬───────────────┘
                                ▼
                 ┌──────────────────────────────┐
                 │  RFQ Distribution             │
                 │  - Email to suppliers         │
                 │  - Supplier Portal posting    │
                 │  - Bid submission portal      │
                 └──────────────┬───────────────┘
                                ▼
           ┌────────────────────┴────────────────────┐
           ▼                                         ▼
    ┌──────────────┐                        ┌──────────────┐
    │ Quotations   │                        │ No Quotation │
    │ Received ≥ 3 │                        │ Received     │
    └──────┬───────┘                        └──────┬───────┘
           ▼                                       ▼
    ┌──────────────┐                        ┌──────────────┐
    │ Evaluation   │                        │ Justification│
    │ - Price      │                        │ + Single     │
    │ - Quality    │                        │ Source Appro-│
    │ - Delivery   │                        │ val Required │
    │ - Past Perf  │                        └──────┬───────┘
    │ - Weighted   │                               │
    │   Scorecard  │                               │
    └──────┬───────┘                               │
           │                                       │
           └──────────────┬────────────────────────┘
                          ▼
           ┌──────────────────────────────┐
           │  Supplier Selection          │
           │  - Recommended (auto)        │
           │  - Override w/ justification │
           │  - Conflict of Interest dec  │
           └──────────────┬───────────────┘
                          ▼
           ┌──────────────────────────────┐
           │  Negotiation (optional)      │
           │  - Best & Final Offer        │
           │  - Reverse auction           │
           └──────────────┬───────────────┘
                          ▼
           ┌──────────────────────────────┐
           │  Award & PO Creation         │
           └──────────────────────────────┘
```

### RFQ Dashboard UI

```
┌──────────────────────────────────────────────────────────────────────┐
│ RFQ MANAGEMENT                                             [+ New]  │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Open RFQs: 8                    Closing This Week: 3 ⚠             │
│                                                                      │
│  ┌───────┬──────────┬────────┬────────┬────────┬────────────────────┐│
│  │RFQ #  │ ITEM     │ VALUE  │CLOSING │ QUOTES │ STATUS             ││
│  ├───────┼──────────┼────────┼────────┼────────┼────────────────────┤│
│  │RFQ-001│ Laptops  │ 2.5M   │06/25   │  3/5   │ Open — ⚠ below min││
│  │RFQ-002│ Stationer│ 150K   │06/20   │  4/4   │ Evaluation         ││
│  │RFQ-003│ Machiner │ 8.0M   │07/01   │  2/5⚠  │ Open — extended   ││
│  │RFQ-004│ Consult  │ 500K   │06/18   │  0/3⚠  │ No responses      ││
│  └───────┴──────────┴────────┴────────┴────────┴────────────────────┘│
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### RFQ Rules

- Mandatory when estimated value > configurable threshold (default: 100,000 ETB)
- Minimum quotations: configurable (default: 3)
- Late submissions automatically rejected
- Supplier responses visible to evaluators only
- Evaluation criteria weights configurable per RFQ

---

# 5. SUPPLIER EVALUATION & SCORECARD

## Industry Standard: Multi-Dimensional Supplier Score

| Dimension | Weight (Default) | Data Source | Measurement |
|-----------|:----------------:|-------------|-------------|
| Price Competitiveness | 25% | RFQ response / Contract price | Compared to market avg |
| Quality (PPM Defect Rate) | 20% | Goods receipt inspection | Defective units per million |
| On-Time Delivery | 20% | GRN vs PO delivery date | % of deliveries on time |
| Lead Time Reliability | 10% | PO → Delivery variance | Standard deviation of lead time |
| Warranty / After-Sales | 10% | Service tickets | Response time, resolution rate |
| Compliance (Docs/Invoice) | 10% | Invoice submission | % error-free invoices |
| Sustainability (ESG) | 5% | Self-assessment / Audit | ISO 20400 compliance score |

### Supplier Scorecard Dashboard

```
┌──────────────────────────────────────────────────────────────────────┐
│ SUPPLIER SCORECARD                                          [Filter]│
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  TechPro Solutions — Rating: 87/100 ★★★★☆                           │
│  ┌──────────────────────────────────────────────────────────────────┐│
│  │ DIMENSION       │ SCORE │ WEIGHT │ WEIGHTED │ TREND (6mo)      ││
│  ├────────────────┼───────┼────────┼──────────┼───────────────────┤│
│  │ Price           │  85   │  25%   │  21.3    │ ↗ Steady         ││
│  │ Quality (PPM)   │  92   │  20%   │  18.4    │ ↗ Improving      ││
│  │ On-Time Deliver │  78   │  20%   │  15.6    │ ↘ Declining ⚠    ││
│  │ Lead Time Rel.  │  90   │  10%   │   9.0    │ → Stable         ││
│  │ Warranty        │  95   │  10%   │   9.5    │ ↗ Improving      ││
│  │ Compliance      │  80   │  10%   │   8.0    │ → Stable         ││
│  │ ESG             │  70   │   5%   │   3.5    │ ↗ Newly tracked  ││
│  ├────────────────┼───────┼────────┼──────────┼───────────────────┤│
│  │ **TOTAL**       │       │  100%  │  **87**  │                   ││
│  └────────────────┴───────┴────────┴──────────┴───────────────────┘│
│                                                                      │
│  Top Issues: [1] Delivery delays (3 POs late this quarter)          │
│              [2] 2 invoices with mismatch errors                      │
│                                                                      │
│  [Score Breakdown] [PO History] [Contact] [Flag for Review]         │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

# 6. PURCHASE ORDER (PO) MANAGEMENT

## Industry Standard: Full PO Lifecycle (12 States)

```
                                ┌──────────┐
                                │  DRAFT   │
                                └────┬─────┘
                                     │ Submit
                                     ▼
                                ┌──────────┐
                          ┌────►│ PENDING  │◄────┐
                          │     └────┬─────┘     │
                          │          │           │
                          │     ┌────┴─────┐     │
                          │     │ RELEASE  │     │
                          │     │ STRATEGY │     │
                          │     └────┬─────┘     │
                          │          │           │
                    ┌─────┴─────┐    │     ┌─────┴──────┐
                    │ REJECTED  │    │     │ INFO       │
                    │ (terminal)│    │     │ REQUESTED  │
                    └───────────┘    │     └─────┬──────┘
                                     ▼           │
                               ┌──────────┐      │
                          ┌───►│APPROVED │◄──────┘
                          │    └────┬─────┘
                          │         │ Send to Supplier
                          │         ▼
                          │    ┌──────────┐
                          │    │  ISSUED  │
                          │    │ (Sent)   │
                          │    └────┬─────┘
                          │         │
                    ┌───────────────┼────────────────┐
                    │               │                 │
                    ▼               ▼                 ▼
               ┌──────────┐   ┌────────────┐   ┌──────────┐
               │ CONFIRMED│   │ PARTIALLY  │   │ EXPIRED  │
               │(Supplier)│   │ RECEIVED   │   │ (no GR)  │
               └────┬─────┘   └──────┬─────┘   └────┬─────┘
                    │                │               │
                    └────────┬───────┘               │
                             ▼                       │
                       ┌──────────────┐              │
                       │  DELIVERED   │              │
                       │  (All GRN)   │              │
                       └──────┬───────┘              │
                              │ Invoice              │
                              ▼                       │
                       ┌──────────────┐              │
                       │ INVOICED     │              │
                       └──────┬───────┘              │
                              │ 3-Way Match          │
                              ▼                       │
                       ┌──────────────┐              │
                       │ READY FOR    │              │
                       │ PAYMENT      │              │
                       └──────┬───────┘              │
                              │ Pay                   │
                              ▼                       │
                       ┌──────────────┐              │
                       │  PAID        │              │
                       │  (Closed)    │◄─────────────┘
                       └──────────────┘
                                   
                          ┌──────────────┐
                          │  CANCELLED   │
                          │  (terminal)  │
                          └──────────────┘
                              ▲
                 Allowed from: Draft, Pending, Approved, Issued
                 NOT allowed after partial receipt
```

### PO Status Attributes

| Status | Display | Color | Delete/Modify | Description |
|--------|---------|:-----:|:------------:|-------------|
| `draft` | Draft | #6B7280 | Editable, Deletable | Initial creation, not yet in workflow |
| `pending` | Pending Approval | #F59E0B | Read-only | Submitted to release strategy |
| `rejected` | Rejected | #EF4444 | Read-only | Approval declined |
| `info_requested` | Info Requested | #F97316 | Editable (requester) | Approver requested clarification |
| `approved` | Approved | #10B981 | Read-only | All releases obtained, not yet sent |
| `issued` | Sent to Supplier | #3B82F6 | Read-only | PO transmitted to supplier |
| `confirmed` | Confirmed | #8B5CF6 | Read-only | Supplier acknowledged/confirmed |
| `partial_received` | Partial Received | #A855F7 | Read-only | Some items GRN'd |
| `delivered` | Fully Delivered | #059669 | Read-only | All items GRN'd |
| `invoiced` | Invoiced | #6366F1 | Read-only | Invoice received, matching in progress |
| `ready_payment` | Ready for Payment | #0EA5E9 | Read-only | 3-way match successful |
| `paid` | Paid / Closed | #22C55E | Read-only | Payment executed |
| `expired` | Expired | #78716C | Read-only | Validity period lapsed without acceptance |
| `cancelled` | Cancelled | #EF4444 | Read-only | Terminated before delivery |

---

# 7. APPROVAL RELEASE STRATEGY

## Industry Standard: SAP-Inspired Release Strategy

### Release Strategy Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│ RELEASE STRATEGY DESIGNER                                  [+ New]  │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ Strategy: HIGH_VALUE_CAPEX                                          │
│                                                                      │
│ Conditions (ALL must match):                                         │
│ ┌──────────┬────────────┬────────────┬───────────────────────────┐  │
│ │ FIELD    │ OPERATOR   │ FROM       │ TO                        │  │
│ ├──────────┼────────────┼────────────┼───────────────────────────┤  │
│ │ Amount   │ >          │ 200,000    │ (unlimited)                │  │
│ │ Category │ =          │ CAPEX      │                            │  │
│ │ Dept     │ ≠          │ IT         │ (IT has separate strategy) │  │
│ └──────────┴────────────┴────────────┴───────────────────────────┘  │
│                                                                      │
│ Release Codes (sequential order):                                    │
│ ┌──────┬──────────────┬────────────┬──────────┬───────────────────┐ │
│ │ STEP │ RELEASE CODE │ APPROVER   │ MIN AMT  │ PREREQUISITE      │ │
│ ├──────┼──────────────┼────────────┼──────────┼───────────────────┤ │
│ │  1   │ RC01         │ Dept Mgr   │ Any      │ None              │ │
│ │  2   │ RC02         │ Fin Dir     │ >200K    │ RC01 released     │ │
│ │  3   │ RC03         │ CEO         │ >500K    │ RC02 released     │ │
│ └──────┴──────────────┴────────────┴──────────┴───────────────────┘ │
│                                                                      │
│ Parallel Release (optional):                                         │
│ ┌──────┬──────────────┬────────────┬───────────────────────────────┐ │
│ │ STEP │ RELEASE CODE │ APPROVER   │ NOTE                          │ │
│ ├──────┼──────────────┼────────────┼───────────────────────────────┤ │
│ │  2a  │ RC02A        │ Legal      │ Parallel to RC02, both needed│ │
│ │  2b  │ RC02B        │ CFO        │ Both RC02A + RC02B must       │ │
│ └──────┴──────────────┴────────────┴───────────────────────────────┘ │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### Release Strategy Rules

- Each release code is assigned to one or more users
- A user with release code can release the PO (not "approve" — they release their step)
- All steps must be released for the PO to reach "Approved" status
- Release can be sequential (each step unlocks next) or parallel (multiple simultaneously)
- Release strategy determined by condition matching at time of submission
- Fallback strategy if no conditions match (default: standard routing)

### Release Strategy Table

| Strategy ID | Name | Condition Field | Operator | Value | Release Steps |
|:-----------:|------|----------------|----------|-------|---------------|
| RS-001 | Low Value (Standard) | Amount | ≤ | 50,000 | Dept Mgr |
| RS-002 | Medium Value | Amount | 50,001–200,000 | Dept Mgr → Finance |
| RS-003 | High Value | Amount | > 200,000 | Dept Mgr → Finance → CEO |
| RS-004 | CAPEX | Category | = | CAPEX | Dept Mgr → Finance → CEO |
| RS-005 | IT Procurement | Department | = | IT | IT Mgr → Finance |
| RS-006 | Service Contract | Category | = | Service | Dept Mgr → Legal → Finance |

---

# 8. BUDGET CONTROL & COMMITMENT ACCOUNTING

## Industry Standard: Three-Phase Budget Consumption

```
Phase 1: RESERVATION (PR Approval)
  ┌──────────────────────────────┐
  │ Available Budget: 10,000,000 │
  │ Reserved:         -500,000   │  ← PR-001 approved, budget held
  ├──────────────────────────────┤
  │ Remaining:        9,500,000  │
  └──────────────────────────────┘

Phase 2: OBLIGATION (PO Approval)
  ┌──────────────────────────────┐
  │ Available Budget: 10,000,000 │
  │ Reserved (PR):      -200,000 │  ← PR-001 partially consumed by PO
  │ Obligated (PO):     -450,000 │  ← PO-001 committed
  ├──────────────────────────────┤
  │ Uncommitted:        9,350,000│
  └──────────────────────────────┘

Phase 3: ACTUAL (Invoice / Payment)
  ┌──────────────────────────────┐
  │ Available Budget: 10,000,000 │
  │ Obligated (PO):      -450,000│  ← PO-001 remains open
  │ Actual (Paid):       -430,000│  ← Invoice paid (may differ from PO)
  ├──────────────────────────────┤
  │ Uncommitted:        9,120,000│
  └──────────────────────────────┘
```

### Budget Dashboard UI

```
┌──────────────────────────────────────────────────────────────────────┐
│ BUDGET COMMITMENT DASHBOARD                                [Filters]│
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Department: Operations              Period: Q3 2026                 │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────────┐│
│  │ CATEGORY   │ BUDGET  │ RESERVED │ OBLIGATED │ ACTUAL │ REMAINING││
│  ├────────────┼─────────┼──────────┼───────────┼────────┼──────────┤│
│  │ OPEX       │ 5,000,000│  200,000│   800,000 │ 600,000│ 3,400,000││
│  │ CAPEX      │ 3,000,000│  500,000│ 1,200,000 │       0│ 1,300,000││
│  │ Services   │ 2,000,000│  100,000│   300,000 │ 150,000│ 1,450,000││
│  ├────────────┼─────────┼──────────┼───────────┼────────┼──────────┤│
│  │ TOTAL      │10,000,000│  800,000│ 2,300,000 │ 750,000│ 6,150,000││
│  └────────────┴─────────┴──────────┴───────────┴────────┴──────────┘│
│                                                                      │
│  ⚠ 62% Remaining — 45% of quarter elapsed                            │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### Budget Control Rules

- Budget checked at PR creation (warning only), PR approval (reservation), and PO approval (obligation)
- PO cannot be approved if insufficient uncommitted budget
- Budget overrides require Finance Manager approval + justification + audit log
- Budget carry-forward rules configurable per fiscal year
- Multi-year contracts require proportional budget allocation per year

---

# 9. GOODS RECEIPT & QUALITY MANAGEMENT

## Industry Standard: GRN with Optional QM Integration

### Goods Receipt Workflow

```
PO Issued
    │
    ▼
Supplier Delivers
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│ GOODS RECEIPT FORM                                               │
├─────────────────────────────────────────────────────────────────┤
│ PO #: PO-2026-00123     Supplier: TechPro                       │
│                                                                  │
│ ┌──────────┬────────┬──────────┬────────┬────────┬────────────┐ │
│ │ ITEM     │ ORDERED│ RECEIVING│ GOOD   │ DAMAGED│ SERIAL #   │ │
│ ├──────────┼────────┼──────────┼────────┼────────┼────────────┤ │
│ │ Laptop-X │ 10     │ 10       │ 10     │ 0      │ SN001-SN010│ │
│ │ Monitor-Y│ 10     │ 8        │ 7      │ 1 ⚠    │ —          │ │
│ │ Dock-Z   │ 10     │ 10       │ 10     │ 0      │ —          │ │
│ └──────────┴────────┴──────────┴────────┴────────┴────────────┘ │
│                                                                  │
│ Storage Location: [WH-A ▾]                                       │
│ Receipt Date:    [06/18/2026 ▾]                                  │
│ Delivery Note #: [DN-98765              ]                        │
│                                                                  │
│ ⚠ Item "Monitor-Y" has QM lot required — inspection pending     │
│                                                                  │
│ [Receive & Post]  [Receive with QM Hold]  [Cancel]              │
└─────────────────────────────────────────────────────────────────┘
```

### Quality Management Flow

```
Goods Received
    │
    ▼
┌────────────────┐     ┌────────────────┐
│ QM Required?   │────►│ Create          │
│ (per item or   │ NO  │ Inspection Lot  │
│  per supplier) │     │ (skip QM)       │
└───────┬────────┘     └────────────────┘
        │ YES
        ▼
┌────────────────┐
│ Inspection Lot  │
│ Created         │
│ Status: Pending │
└───────┬────────┘
        │
        ▼
┌──────────────────────┐
│ Quality Inspection   │
│ - Sample size: 10%   │
│ - Defect recorded    │
│ - Pass/Fail decision │
└───────┬──────────────┘
        │
    ┌───┴───┐
    │       │
    ▼       ▼
┌────────┐ ┌────────┐
│ Pass   │ │ Fail   │
│ Stock  │ │ Reject │
│ Unlock │ │ Return │
└────────┘ └────────┘
```

### GRN Business Rules

- Goods cannot be received against cancelled/expired POs
- Over-delivery tolerance: configurable (default: 10% of line qty)
- Under-delivery: partial receipt allowed, balance remains open
- Damaged goods recorded separately with quantity and description
- Serialized items: serial numbers captured at receipt
- GRN auto-updates inventory (quantity + weighted average cost)
- Inventory movement logged with `reference_type = 'PO'`, `reference_id = po_id`

---

# 10. INVOICE VERIFICATION & THREE-WAY MATCHING

## Industry Standard: Three-Way + Two-Way Matching

### Matching Rules

| Method | Documents Matched | Use Case | Tolerance |
|--------|------------------|----------|-----------|
| **Two-Way** | PO ↔ Invoice | Services, non-stock items | Price: ±5%, Qty: N/A |
| **Three-Way** | PO ↔ GRN ↔ Invoice | Stock items, goods | Price: ±3%, Qty: ±5% |
| **ERS** (Evaluated Receipt Settlement) | GRN only → auto-pay | High-volume, trusted suppliers | No invoice needed |

### Three-Way Matching Dashboard

```
┌──────────────────────────────────────────────────────────────────────┐
│ INVOICE MATCHING                                           [Filters]│
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Pending Match: 12                          Blocked: 3 ⚠             │
│                                                                      │
│  ┌──────┬──────────┬────────┬────────┬────────┬────────┬───────────┐│
│  │PO #  │ SUPPLIER │ PO QTY │ GRN QTY│ INV QTY│ PO PRICE│ INV PRICE││
│  ├──────┼──────────┼────────┼────────┼────────┼────────┼───────────┤│
│  │PO-001│ TechPro  │ 10     │ 10     │ 10     │ 50,000 │ 50,000   ││
│  │      │          │        │        │        │        │ ✅ Match  ││
│  │PO-002│ OfficeMax│ 100    │ 100    │ 100    │ 15,000 │ 16,500   ││
│  │      │          │        │        │        │        │ ❌ Price ⚠││
│  │PO-003│ BuildCorp│ 5      │ 3      │ 5      │ 1.0M   │ 1.0M     ││
│  │      │          │        │        │        │        │ ❌ Qty ⚠  ││
│  └──────┴──────────┴────────┴────────┴────────┴────────┴───────────┘│
│                                                                      │
│  ❌ PO-002: Price variance 10% (> 5% tolerance)                      │
│     [Accept Variance] [Request Credit Note] [Reject Invoice]         │
│  ❌ PO-003: Quantity invoiced exceeds quantity received               │
│     [Hold until all received] [Partial Match] [Reject]               │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### Blocking Reasons

| Block Reason | Description | Resolver |
|-------------|-------------|----------|
| **Price Variance** | Invoice price > PO price + tolerance | Finance Officer |
| **Quantity Variance** | Invoiced qty > Received qty | Store Keeper / Finance |
| **Missing GRN** | No goods receipt posted | Store Keeper |
| **Tax Mismatch** | VAT/GST percentage differs | Finance Officer |
| **Duplicate Invoice** | Same supplier + amount + date pattern | System (auto-block) |
| **PO Not Approved** | Invoice against unapproved PO | Blocked until approved |

---

# 11. PAYMENT AUTHORIZATION

## Industry Standard: Payment Release Workflow

```
Three-Way Match Successful
    │
    ▼
┌────────────────────────────────────────┐
│ PAYMENT PROPOSAL                        │
│ - PO-001: TechPro — 430,000 ETB        │
│ - PO-005: OfficeMax — 15,000 ETB       │
│ - PO-012: BuildCorp — 3,200,000 ETB    │
├────────────────────────────────────────┤
│ Due Date Filter: [This Week ▾]         │
│ Payment Method: [Bank Transfer ▾]      │
│                                         │
│ [Generate Payment File] [Post to GL]    │
└────────────────────────────────────────┘
```

### Payment Authorization Rules

- Payment only after three-way matching is successful
- Payment amount = min(PO value, GRN value, Invoice value after adjustments)
- Early payment discount: configurable (e.g., 2% if paid within 10 days)
- Partial payment allowed for partial deliveries
- Payment batch approval for Finance Manager
- High-value payments (> 500,000 ETB) require dual authorization

---

# 12. SUPPLIER COLLABORATION PORTAL

## Industry Standard: Supplier Self-Service

### Portal Capabilities

| Capability | Description | Industry Adoption |
|-----------|-------------|:----------------:|
| **PO Acknowledgment** | Confirm or reject PO with delivery date | SAP Ariba, Oracle SCM |
| **Advanced Shipping Notification (ASN)** | Notify buyer of pending delivery with pack details | SAP S/4HANA, MS Dynamics |
| **Invoice Submission** | Submit invoice digitally (PDF/XML/e-invoice) | Mandatory in EU (PEPPOL) |
| **Order Status** | View PO status, payment status | All major ERPs |
| **RFQ Participation** | View RFQs, submit quotations | SAP Ariba, Coupa |
| **Contract Visibility** | View active contracts, pricing | Oracle Procurement |
| **Quality Notifications** | View defect/return notifications | SAP QM, Oracle |
| **Payment History** | View payment dates, amounts | All major ERPs |
| **Profile Management** | Update contact, bank details, certificates | SAP Business Network |
| **Dispute / Change Request** | Request PO changes, raise disputes | SAP Ariba |

### Portal Access Model

```
┌──────────────────────────────────────────────────────────────────────┐
│ SUPPLIER PORTAL ACCESS CONTROL                                       │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ Supplier: TechPro Solutions (SUP-001)                                │
│                                                                      │
│ User Accounts:                                                       │
│ ┌──────────┬─────────────┬──────────┬───────────────┬──────────────┐│
│ │ NAME     │ EMAIL       │ ROLE     │ LAST LOGIN    │ STATUS       ││
│ ├──────────┼─────────────┼──────────┼───────────────┼──────────────┤│
│ │ John Doe │ john@tp.com │ Admin    │ 2026-06-17    │ Active       ││
│ │ Jane Roe │ jane@tp.com │ Sales    │ 2026-06-10    │ Active       ││
│ │ Bob Smith│ bob@tp.com  │ Invoice  │ 2026-05-20    │ Invited      ││
│ └──────────┴─────────────┴──────────┴───────────────┴──────────────┘│
│                                                                      │
│ [Invite User] [Revoke Access] [View Activity Log]                    │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

# 13. SERVICES PROCUREMENT

## Industry Standard: Services ≠ Goods

### Service Procurement Workflow

```
┌──────────────────────────────────────────────────────────────────────┐
│ SERVICE ENTRY SHEET                                                  │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ Contract: CTR-004 — ConsultNet — ERP Implementation                 │
│                                                                      │
│ ┌──────────────┬────────────┬─────────┬───────────┬────────────────┐│
│ │ DATE         │ RESOURCE   │ HOURS   │ RATE      │ TOTAL          ││
│ ├──────────────┼────────────┼─────────┼───────────┼────────────────┤│
│ │ 2026-06-10   │ Sr. Cons.  │ 8       │ 2,500/hr  │ 20,000         ││
│ │ 2026-06-11   │ Sr. Cons.  │ 8       │ 2,500/hr  │ 20,000         ││
│ │ 2026-06-12   │ Jr. Cons.  │ 6       │ 1,500/hr  │ 9,000          ││
│ ├──────────────┼────────────┼─────────┼───────────┼────────────────┤│
│ │              │            │ 22      │           │ 49,000         ││
│ └──────────────┴────────────┴─────────┴───────────┴────────────────┘│
│                                                                      │
│ Service Receiver: [Department Manager ▾]                             │
│ Acceptance: ☑ Services performed per SOW §4.2                        │
│                                                                      │
│ [Submit for Invoice]  [Save Draft]  [Reject]                         │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### Service Procurement Rules

- Service POs use "service entry sheets" instead of goods receipts
- Service entry confirmed by receiver (acceptance) before invoice
- Time & Material vs Fixed Price milestones
- SOW (Statement of Work) attachment mandatory for > 100,000 ETB
- Milestone billing schedule configurable per contract
- No inventory update on service receipt

---

# 14. PROCUREMENT FRAUD DETECTION

## Industry Standard: 7 Fraud Detection Engines

| # | Rule Engine | Detection Logic | Alert Level |
|:-:|------------|----------------|:-----------:|
| 1 | **Duplicate PO** | Same supplier, same items, similar total (±5%), within N days | 🔴 Critical |
| 2 | **Split Purchase** | Multiple POs to same supplier totalling above threshold within 7 days | 🔴 Critical |
| 3 | **Price Variance** | PO price > 20% above last 3 purchase prices for same item | 🟡 Warning |
| 4 | **Same IP Buyer-Supplier** | PO creator and supplier user share IP address | 🔴 Critical |
| 5 | **Ghost Supplier** | New supplier (< 30 days) + rush PO + no contract + employee address match | 🔴 Critical |
| 6 | **Single Bidder** | RFQ with only 1 quotation received (no justification override) | 🟡 Warning |
| 7 | **Abnormal Pattern** | PO created after hours / weekend + high value + no attachment | 🟡 Warning |

### Fraud Alert Dashboard

```
┌──────────────────────────────────────────────────────────────────────┐
│ FRAUD DETECTION DASHBOARD                                  [Settings]│
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ⚠ Active Alerts: 5                          Resolved This Week: 2  │
│                                                                      │
│  ┌──────┬───────────┬────────────┬────────┬──────────┬─────────────┐│
│  │ALERT │ SUPPLIER  │ DESCRIPTION│ AMOUNT │ RISK     │ STATUS      ││
│  ├──────┼───────────┼────────────┼────────┼──────────┼─────────────┤│
│  │A-001 │ TechPro   │ Duplicate  │ 500,000│ 🔴 High  │ In Review   ││
│  │      │           │ PO-003 =   │        │          │             ││
│  │      │           │ PO-001     │        │          │             ││
│  │A-002 │ OfficeMax │ Split: 3   │ 180,000│ 🟠 Med   │ Investigating│
│  │      │           │ POs in 3d  │        │          │             ││
│  │A-003 │ QuickFix  │ Ghost supp │ 250,000│ 🔴 High  │ New         ││
│  │      │           │ + address  │        │          │             ││
│  │A-004 │ BuildCorp │ +20% price │ 50,000 │ 🟡 Low   │ Ignored     ││
│  │A-005 │ FreshSupp │ 1 bid RFQ  │ 2.0M   │ 🟠 Med   │ Override OK ││
│  └──────┴───────────┴────────────┴────────┴──────────┴─────────────┘│
│                                                                      │
│  [Investigate] [Resolve] [Escalate to Audit] [Configure Rules]      │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

# 15. PROCUREMENT ANALYTICS & KPIs

## Industry Standard: 12 Essential KPIs

| KPI | Formula | Benchmark | Refresh |
|-----|---------|:---------:|:-------:|
| **PO Cycle Time (days)** | AVG(approve_date - create_date) | 3–5 days world-class | Daily |
| **Maverick Spend %** | Non-contract spend / Total spend × 100 | <10% | Weekly |
| **Cost Savings** | Σ(Market_Price − Contract_Price) × Qty | 5–15% annual | Monthly |
| **Cost Avoidance** | Σ(Last_Price − Contract_Price) × Qty | N/A | Monthly |
| **Supplier Fill Rate %** | On-time complete deliveries / Total deliveries × 100 | >95% | Weekly |
| **Defect Rate (PPM)** | (Defective units / Total received) × 1,000,000 | <1,000 PPM | Monthly |
| **Invoice Error Rate %** | Blocked invoices / Total invoices × 100 | <3% | Monthly |
| **Procurement ROI** | Total savings / Procurement dept cost | 5:1–10:1 | Quarterly |
| **PO Approval SLA %** | POs approved within SLA / Total POs × 100 | >90% | Weekly |
| **Active RFQs** | Count of open RFQs | N/A (trend) | Real-time |
| **Supplier Diversity %** | Spend with diverse suppliers / Total spend | Varies per policy | Quarterly |
| **PO per Buyer** | Total POs / Active buyers | N/A (workload) | Monthly |

### Analytics Dashboard

```
┌──────────────────────────────────────────────────────────────────────┐
│ PROCUREMENT ANALYTICS                                      [Export] │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ Q2 2026 OVERVIEW                                                     │
│                                                                      │
│ ┌─────────────┬────────┐  ┌─────────────┬────────┐                  │
│ │ PO Cycle    │ 4.2 days│  │Maverick     │ 8.3%   │                  │
│ │ ⬇ 0.5 vs Q1│ ✅      │  │⬆ 1.2 vs Q1 │ ⚠      │                  │
│ └─────────────┴────────┘  └─────────────┴────────┘                  │
│ ┌─────────────┬────────┐  ┌─────────────┬────────┐                  │
│ │ Cost Savings│ 2.4M ETB│  │Fill Rate    │ 94.2%  │                  │
│ │ ⬆ vs target│ ✅      │  │⬇ 0.8 vs Q1 │ ⚠      │                  │
│ └─────────────┴────────┘  └─────────────┴────────┘                  │
│                                                                      │
│ ┌──────────────────────────────────────────────────────────────────┐ │
│ │ SPEND BY CATEGORY (Q2)                                            │ │
│ │ ┌────────────────────────────────────────────────────────┐       │ │
│ │ │ OPEX    ████████████████████████░░░░░░░░░  62%         │       │ │
│ │ │ CAPEX   ██████████░░░░░░░░░░░░░░░░░░░░░░░  25%         │       │ │
│ │ │ Services ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░  13%         │       │ │
│ │ └────────────────────────────────────────────────────────┘       │ │
│ └──────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│ [View All KPIs] [Drill Down by Dept] [Export to PDF] [Schedule]    │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

# 16. EMERGENCY & SPOT PROCUREMENT

## Industry Standard: Controlled Bypass

### Emergency Workflow

```
┌──────────────────────────────────────┐
│ EMERGENCY PURCHASE REQUEST           │
├──────────────────────────────────────┤
│                                      │
│ Justification: [________________]    │
│ Reason: [Equipment Failure ▾]        │
│ Impact if not approved: [________]   │
│ Authority: [On-Site Manager ▾]       │
│                                      │
│ ⚠ This will bypass normal approval  │
│   Must be ratified within 48 hours   │
│                                      │
│ [Submit Emergency PO] [Cancel]       │
└──────────────────────────────────────┘
```

### Rules

- Emergency flag available only to authorized roles (Plant Manager, Dept Head)
- Emergency POs bypass release strategy but require ratification within 48h
- Ratification = post-purchase approval by normal approver chain
- Ratification failure = personal liability of purchaser
- Emergency PO has yellow background / visual flag across all dashboards
- Report of all emergency POs generated monthly for audit

---

# 17. CONSIGNMENT, SUBCONTRACTING & STOCK TRANSFER

## Consignment Procurement

```
Supplier Stock at Buyer Location
    │
    ▼
┌─────────────────────────────────────────────┐
│ Consignment Stock: Supplier-owned            │
│ - Stored at buyer warehouse                  │
│ - Buyer pays only when stock consumed         │
│ - Consignment report sent to supplier weekly │
│ - Consumption triggers FI posting + liability │
│ - No invoice needed — auto-pay on consumption │
└─────────────────────────────────────────────┘
```

## Subcontracting

```
Buyer issues raw materials to supplier
    │
    ▼
┌─────────────────────────────────────────────┐
│ Components issued: BOM-based                │
│ Supplier manufactures                       │
│ Buyer receives finished goods               │
│ Components consumed deducted automatically  │
│ Scrap/waste tracked and billed back         │
└─────────────────────────────────────────────┘
```

## Stock Transfer (Internal Procurement)

```
Plant A → Plant B (same company)
    │
    ▼
┌─────────────────────────────────────────────┐
│ Stock Transport Order (STO)                 │
│ No supplier involved                        │
│ No invoice — auto-valuation at transfer price│
│ Both sending and receiving inventory updated │
└─────────────────────────────────────────────┘
```

---

# 18. PROCUREMENT AUDIT & COMPLIANCE

## Industry Standard: Immutable Audit Trail

### Audit Log Requirements

Every procurement action records:

| Field | Description | Example |
|-------|-------------|---------|
| **Event ID** | Auto-generated UUID | `evt_po_20260618_001` |
| **Timestamp** | UTC with milliseconds | `2026-06-18T09:45:12.345Z` |
| **User** | User ID + Full Name | `USR-045 (Alice Smith)` |
| **Role** | Role at time of action | `P4 — Finance Officer` |
| **IP Address** | Source IP | `10.0.0.45` |
| **Session ID** | Login session | `sess_abc123` |
| **Action** | Verb | `PO_CREATED`, `PO_APPROVED` |
| **Record Type** | Affected entity | `purchase_orders` |
| **Record ID** | Primary key | `PO-2026-00123` |
| **Old Status** | Previous state | `draft` |
| **New Status** | Current state | `pending` |
| **Old Values** | JSON of changed fields (before) | `{total_amount: 450000}` |
| **New Values** | JSON of changed fields (after) | `{total_amount: 485000}` |
| **Reason** | User-entered justification | `Price updated per supplier quote` |
| **Device Info** | Browser/device fingerprint | `Chrome/126, Windows 10` |

### Audit Dashboard

```
┌──────────────────────────────────────────────────────────────────────┐
│ PROCUREMENT AUDIT LOG                                      [Export] │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ ┌──────┬──────────┬──────────┬────────────┬───────────┬────────────┐│
│ │ TIME │ ACTION   │ PO #     │ USER       │ OLD→NEW   │ REASON     ││
│ ├──────┼──────────┼──────────┼────────────┼───────────┼────────────┤│
│ │09:45 │PO_CREATED│PO-00123 │Alice (P3)   │→draft     │Initial     ││
│ │09:46 │PO_UPDATE │PO-00123 │Alice (P3)   │draft→draft│Added item  ││
│ │09:47 │PO_SUBMIT │PO-00123 │Alice (P3)   │draft→pend │For approval││
│ │09:50 │PO_RELEASE│PO-00123 │Bob (P4)     │pend→release│Step 1/2   ││
│ │09:52 │PO_RELEASE│PO-00123 │Carol (P5)   │pend→release│Step 2/2 ⚠ ││
│ │09:52 │PO_APPROVE│PO-00123 │Carol (P5)   │pend→approved│✅ Full    ││
│ │09:53 │PO_ISSUE  │PO-00123 │Alice (P3)   │approved→issued│Sent     ││
│ │09:55 │PO_CONFIRM│PO-00123 │Supplier     │issued→confirmed│06/25   ││
│ │11:30 │GRN_POST  │PO-00123 │Dave (Store) │confirmed→partial│10/10 good│
│ │14:00 │INV_MATCH │PO-00123 │Eve (P4)     │partial→inv│3-way matched│
│ │14:01 │PAY_AUTH  │PO-00123 │Eve (P4)     │inv→pay    │Payment auth│
│ └──────┴──────────┴──────────┴────────────┴───────────┴────────────┘│
│                                                                      │
│ ⚠ Event "PO_RELEASE" by Carol (RC03 — CEO level) on PO < 500K ETB  │
│   — Exceeds normal delegation, flagged for audit review              │
│                                                                      │
│ [Apply Filter] [Detailed View] [Export as PDF] [Generate SOX Report]│
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### Compliance Standards Mapping

| Standard | Requirement | How Addressed |
|----------|-------------|---------------|
| **SOX §302 / §404** | Segregation of Duties, audit trail | SoD matrix (Section 1), immutable audit (Section 18) |
| **SOC 2** | Access control, change management | Release strategy (Section 7), approval workflow |
| **ISO 20400** | Sustainable procurement | Supplier ESG score (Section 5), diversity tracking (Section 15) |
| **COSO** | Control environment, risk assessment | Fraud detection (Section 14), budget control (Section 8) |
| **EU Procurement Directive** | Transparency, fair competition | RFQ process (Section 4), supplier evaluation (Section 5) |
| **IFRS / GAAP** | Proper accrual, cut-off | Three-phase budget (Section 8), three-way match (Section 10) |

---

# COMPLETE DASHBOARD LAYOUT RECOMMENDATION

## Main Procurement Dashboard — Suggested Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│ 🏠 PURCHASE & PROCUREMENT DASHBOARD                        [⚙ Config]│
├──────────┬───────────────────────────────────────────────────────────┤
│          │                                                           │
│  LEFT    │  MAIN CONTENT                                             │
│  SIDEBAR │                                                           │
│          │  ┌──────────┬──────────┬──────────┬──────────┬──────────┐│
│  📋       │  │PRs Pending│ POs Pending│ Goods to  │ Invoices  │Alerts   ││
│  Overview │  │ Approval │ Approval │ Receive   │ to Match  │         ││
│          │  │    5     │    3     │    8      │     12    │    2⚠   ││
│          │  └──────────┴──────────┴──────────┴──────────┴──────────┘│
│  📝       │                                                           │
│  PRs     │  ┌──────────────────────────────────────────────────────┐ │
│          │  │🟡 APPROVAL PIPELINE                                    │ │
│  📄       │  │PR-001 │ Alice │45,000│ ⬜⬜⬜⬜⬜  Dept Mgr (step 1/3)│ │
│  RFQs    │  │PR-002 │ Bob   │250,000│ ⬛⬜⬜⬜⬜ Fin (step 2/3) ⚠ due│ │
│          │  │PR-004 │ Dave  │500,000│ ⬛⬛⬜⬜⬜ CEO (step 3/3)       │ │
│  📦       │  └──────────────────────────────────────────────────────┘ │
│  Orders  │                                                           │
│          │  ┌──────────────┬──────────────┬─────────────────────────┐│
│  🚚       │  │📦 GOODS DUE THIS WEEK       │📈 TODAY'S KPIs         ││
│  Receiving│  │PO-101 │TechPro │06/18│  ⚡    │PO Cycle: 4.2d ✅      ││
│          │  │PO-102 │OfficeMax│06/19│  ⚡    │Savings: 1.2M ✅       ││
│  💰       │  │PO-103 │BuildCorp│06/20│  ⚠    │Maverick: 8.3% ⚠     ││
│  Invoices │  │PO-104 │ConsultNet│06/21│  ⚡   │Fraud Alerts: 2 🔴    ││
│          │  └──────────────┴──────────────┴─────────────────────────┘│
│  🤝       │                                                           │
│  Contracts│  ┌──────────────────────────────────────────────────────┐ │
│          │  │🔴 CRITICAL ALERTS                                      │ │
│  📊       │  │• CTR-003 "BuildCorp" expires in 14 days — renew?     │ │
│  Reports │  │• PO-002 price variance 10% — awaiting decision        │ │
│          │  │• A-001 Duplicate PO flag — investigation pending      │ │
│  ⚠        │  │• Q2 Access Review overdue (due 2026-06-20)           │ │
│  Alerts  │  └──────────────────────────────────────────────────────┘ │
│          │                                                           │
│  🛡️       │  [Create PR]  [Create PO]  [View All Orders]  [Reports] │
│  Audit   │                                                           │
│          └───────────────────────────────────────────────────────────┘
└──────────────────────────────────────────────────────────────────────┘
```

## Sidebar Navigation

```
🏠 Procurement Dashboard
├── 📝 Purchase Requisitions
│   ├── My PRs
│   ├── Pending My Approval
│   └── All PRs
├── 📄 RFQ Management
│   ├── Open RFQs
│   ├── Evaluation
│   └── Awarded
├── 📦 Purchase Orders
│   ├── All Orders
│   ├── Pending Approval
│   ├── Due for Delivery
│   └── Create PO
├── 🚚 Goods Receiving
│   ├── Pending Receipt
│   └── Receiving History
├── 💰 Invoices & Matching
│   ├── Pending Match
│   └── Blocked Invoices
├── 🤝 Contracts & Agreements
│   ├── Active Contracts
│   ├── Expiring
│   └── Create Contract
├── 🏢 Supplier Management
│   ├── Supplier List
│   ├── Scorecards
│   └── Portal Access
├── 📊 Reports & Analytics
│   ├── KPI Dashboard
│   ├── Spend Analysis
│   ├── Supplier Performance
│   └── Audit Log
├── ⚙️ Configuration
│   ├── Release Strategies
│   ├── Approval Thresholds
│   ├── Budget Control
│   └── Fraud Detection Rules
└── 🛡️ Audit & Compliance
    ├── Audit Log
    ├── Compliance Reports
    └── Fraud Alerts
```

---

# APPENDIX: EXISTING SRS MAPPING TO INDUSTRY STANDARD

## Gap Analysis: SRS v2.0 (FR-001 to FR-040) vs Industry Standard

| SRS FR | Description | Industry Dimension | Status | Gap / Action Needed |
|--------|-------------|:------------------:|:------:|---------------------|
| FR-001–FR-008 | Purchase Requisition Management | Dim 2 | ✅ Present | Expand statuses: add `Returned`, `Converted` |
| FR-009–FR-011 | Department Review | Dim 2 | ✅ Present | Add delegation, SLA enforcement |
| FR-012–FR-015 | Budget Verification | Dim 8 | ⚠️ Partial | Add commitment accounting (3-phase), override audit |
| FR-016–FR-020 | RFQ Management | Dim 4 | ✅ Present | Add e-auction, supplier portal integration |
| FR-021–FR-024 | Supplier Evaluation | Dim 5 | ⚠️ Partial | Add full scorecard (7 dimensions), trend analysis, ESG |
| FR-025–FR-030 | Purchase Order Management | Dim 5 | ✅ Present | Add `issued`, `confirmed`, `expired` statuses |
| FR-031–FR-039 | Approval Workflow | Dim 7 | ⚠️ Critical | FULL REWRITE — replace linear with release strategies (parallel, sequential, condition-based, release codes) |
| FR-040 | Procurement Audit Logging | Dim 18 | ✅ Present | Add before/after JSON capture, device fingerprint |
| **Missing** | Contract Management | Dim 3 | ❌ Missing | ADD — quantity/value/service contracts, compliance checks |
| **Missing** | Supplier Collaboration Portal | Dim 12 | ❌ Missing | ADD — PO confirmation, ASN, e-invoice, dispute |
| **Missing** | Services Procurement | Dim 13 | ❌ Missing | ADD — service entry, SOW, milestone billing |
| **Missing** | Quality Management | Dim 9 | ❌ Missing | ADD — inspection lots, quality hold, defect tracking |
| **Missing** | Fraud Detection | Dim 14 | ❌ Missing | ADD — 7 rule engines, fraud dashboard |
| **Missing** | Procurement Analytics | Dim 15 | ❌ Missing | ADD — 12 KPIs, spend cube, trend dashboards |
| **Missing** | Emergency Procurement | Dim 16 | ❌ Missing | ADD — emergency PO, ratification workflow |
| **Missing** | Consignment / Subcontracting | Dim 17 | ❌ Missing | ADD — consignment stock, subcontract BOM |
| **Missing** | ERS (Auto-Pay on GRN) | Dim 10 | ❌ Missing | ADD — evaluated receipt settlement |
| **Missing** | Release Strategy Designer | Dim 7 | ❌ Missing | ADD — configurable conditions, release codes, parallel routing |

### Domain Coverage Summary

| Domain | SRS Coverage | Industry Standard | Completion |
|--------|:------------:|:-----------------:|:----------:|
| PR Management | 8 FRs | 10 FRs | 80% |
| Sourcing & Contracts | 0 FRs | 8 FRs | 0% |
| RFQ & E-Sourcing | 5 FRs | 8 FRs | 60% |
| Supplier Evaluation | 4 FRs | 6 FRs | 65% |
| PO Management | 6 FRs | 10 FRs | 60% |
| Approval Release Strategy | 9 FRs (linear only) | 12 FRs (release codes) | 40% |
| Budget Control | 4 FRs | 6 FRs | 65% |
| Goods Receipt & QM | 0 FRs (in Finance SRS?) | 8 FRs | 0% |
| Invoice Matching | 0 FRs (implied) | 6 FRs | 20% |
| Payment Authorization | 0 FRs | 4 FRs | 0% |
| Supplier Portal | 0 FRs | 8 FRs | 0% |
| Services Procurement | 0 FRs | 6 FRs | 0% |
| Fraud Detection | 0 FRs | 8 FRs | 0% |
| Analytics & KPIs | 0 FRs | 8 FRs | 0% |
| Emergency Procurement | 0 FRs | 4 FRs | 0% |
| Consignment/Subcontract | 0 FRs | 6 FRs | 0% |
| Audit & Compliance | 1 FR | 4 FRs | 25% |

**Overall: SRS covers ~25% of industry-standard procurement domains. Current implementation covers ~35% of SRS-defined FRs.**

---

*Generated as reference for Sutana EMS Purchase & Procurement Module redesign — based on ERP industry standards from SAP S/4HANA MM, Oracle Fusion Cloud Procurement, Microsoft Dynamics 365 Supply Chain Management, IFS Applications, Gartner, SOX, SOC2, ISO 20400, COSO, and CIPFA.*
