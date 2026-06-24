# ERP Admin Privilege Management — Complete Industry Standard Reference
## 16 Dimensions for Admin Dashboard Design

**Compiled from:** SAP S/4HANA Authorization Model, Oracle Fusion Cloud ERP, Microsoft Dynamics 365, Delinea PAM, Gartner, SOX ITGC, SOC 2, NIST SP 800-53, ISO 27001, CrowdStrike, Obsidian Security

**Target:** Sutana Enterprise Management System — Admin Dashboard Redesign

---

# TABLE OF CONTENTS

1.  [Tiered Admin Role Model](#1-tiered-admin-role-model)
2.  [Privileged Access Management (PAM)](#2-privileged-access-management-pam)
3.  [Segregation of Duties (SoD)](#3-segregation-of-duties-sod)
4.  [Access Certification & Recertification](#4-access-certification--recertification)
5.  [Admin Session Recording & Monitoring](#5-admin-session-recording--monitoring)
6.  [Role Architecture (Single + Composite Roles)](#6-role-architecture-single--composite-roles)
7.  [Non-Human Identities / Service Accounts](#7-non-human-identities--service-accounts)
8.  [Field-Level Security (FLS)](#8-field-level-security-fls)
9.  [Row-Level Security / Data Isolation](#9-row-level-security--data-isolation)
10. [Delegated Administration](#10-delegated-administration)
11. [Multi-Tenant Admin Isolation](#11-multi-tenant-admin-isolation)
12. [Admin Attestation Evidence for Audits](#12-admin-attestation-evidence-for-audits)
13. [Third-Party / Vendor Admin Access](#13-third-party--vendor-admin-access)
14. [Admin Disaster Recovery & Business Continuity](#14-admin-disaster-recovery--business-continuity)
15. [Privilege Creep Detection & Prevention](#15-privilege-creep-detection--prevention)
16. [API-Level Admin Permissions](#16-api-level-admin-permissions)

---

# 1. TIERED ADMIN ROLE MODEL

## Dashboard Section: "Admin Role Management"

### Industry Standard: 4 Tiers of Admin

Every major ERP (SAP, Oracle, Microsoft) divides admin responsibilities into distinct tiers. This is the #1 requirement for SOX compliance.

### The 4 Admin Tiers

| Tier | Role Name | Scope | Functions | SOX Critical? |
|------|-----------|-------|-----------|---------------|
| **L1** | **System Administrator** | Infrastructure: servers, DB, transports, backups | Health monitoring, backup management, service availability, DR operations | Yes |
| **L2** | **Security Administrator** | Users, roles, permissions, auth policies | Create/edit/suspend/delete users, assign roles, password policies, 2FA config, session management | Yes |
| **L3** | **Functional Administrator** | Module configuration per department | Finance config, inventory config, sales config (NO user management) | Yes |
| **L4** | **Audit Administrator** | Read-only across all modules | View audit logs, export reports, generate compliance docs, view session recordings (NO modify) | Yes |

### Dashboard UI Requirements — Admin Role Management Screen

```
┌─────────────────────────────────────────────────────────────────────┐
│ ADMIN ROLE MANAGEMENT                                      [Export] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Current Admin Users: 12                                            │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────────┐│
│  │ ROLE                  │ USERS │ STATUS      │ LAST REVIEW       ││
│  ├──────────────────────────────────────────────────────────────────┤│
│  │ System Administrator  │   2   │ ✅ Satisfied │ 2026-06-01        ││
│  │ Security Administrator│   4   │ ✅ Satisfied │ 2026-06-01        ││
│  │ Functional Admin      │   5   │ ⚠️ Over       │ 2026-05-15        ││
│  │ Audit Administrator   │   1   │ ✅ Satisfied │ 2026-06-10        ││
│  └──────────────────────────────────────────────────────────────────┘│
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────────┐│
│  │ SoD Conflict: User "John" has Security Admin + Audit Admin      ││
│  │ [Resolve] [Ignore with Reason]                                  ││
│  └──────────────────────────────────────────────────────────────────┘│
│                                                                     │
│  [Invite New Admin]  [Revoke Admin]  [View History]                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Specific Dashboard Widgets Needed

| Widget | Description | Data Source | Refresh |
|--------|-------------|-------------|---------|
| Admin Count by Tier | Bar chart: L1, L2, L3, L4 counts | Admin DB table | Real-time |
| Admin Coverage Gap | Warnings if any admin tier has 0 users | Admin assignment table | Real-time |
| SoD Violations (Admin) | List of admins with conflicting role assignments | SoD conflict engine | Real-time |
| Last Admin Review Date | Date of most recent admin access certification | Certification log | Daily |

### New SRS Requirements to Add

```
FR-100 TIERED ADMIN CLASSIFICATION
Actor: System (automated)
Description: Administrators shall be classified into exactly one of four tiers:
  - L1: System Administrator (infrastructure, backup, health)
  - L2: Security Administrator (user lifecycle, roles, policies)
  - L3: Functional Administrator (module configuration only)
  - L4: Audit Administrator (read-only access)
Validation:
  - No admin may hold more than one tier simultaneously (SoD enforcement)
  - Each tier must have at least 1 assigned admin at all times
  - System shall alert if any tier has 0 admins

FR-101 ADMIN TIER TRANSITION
Actor: L1 System Administrator or CEO
Description: An Administrator's tier may be changed only with documented approval.
Workflow:
  - Initiator selects admin and new tier
  - System validates no SoD conflict with existing assignments
  - Approver (CEO or Security Officer) reviews and approves/rejects
  - Change takes effect at next login
  - Full audit trail recorded
```

---

# 2. PRIVILEGED ACCESS MANAGEMENT (PAM)

## Dashboard Section: "Privileged Access"

### Industry Standard: Four Pillars of PAM

1. **Zero Standing Privileges (ZSP)** — No permanent admin rights
2. **Just-In-Time (JIT) Elevation** — Elevate for specific task, auto-expire
3. **Break-Glass Emergency Access** — Emergency accounts with 2-person activation
4. **Credential Vaulting & Rotation** — Automated password/secret rotation

### JIT Elevation Workflow

```
User requests admin elevation
  → Selects role: [L1 System Admin | L2 Security Admin]
  → Selects duration: [30 min | 1 hr | 4 hr | 8 hr]
  → Provides reason/ticket: [Mandatory]
  → If duration > 1hr: Requires manager approval
  → Elevation granted: Admin access expires automatically
  → Session recorded: Full keystroke + screen recording
  → Audit event: PRIVILEGE_ELEVATION_GRANTED / EXPIRED
```

### Dashboard UI Requirements — PAM Dashboard

```
┌─────────────────────────────────────────────────────────────────────┐
│ PRIVILEGED ACCESS MANAGEMENT                                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐    │
│  │ Active     │  │ Pending    │  │ Expired    │  │ Break-Glass│    │
│  │ Elevations │  │ Approvals  │  │ Today      │  │ Used (MTD) │    │
│  │     3      │  │     2      │  │     14     │  │     1      │    │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘    │
│                                                                     │
│  Active Elevations:                                                  │
│  ┌──────────────────────────────────────────────────────────────────┐│
│  │ ADMIN    │ ROLE    │ DURATION │ REMAINING │ TICKET    │ STATUS  ││
│  ├──────────────────────────────────────────────────────────────────┤│
│  │ Alice    │ L2      │ 30 min   │ 12 min    │ TKT-1042  │ ⏳ Active│
│  │ Bob      │ L1      │ 4 hr     │ 2 hr 15m  │ TKT-1045  │ ⏳ Active│
│  │ Carol    │ L4      │ 1 hr     │ 45 min    │ AUD-2026  │ ⏳ Active│
│  └──────────────────────────────────────────────────────────────────┘│
│                                                                     │
│  [Request Elevation]  [View History]  [Configure Policies]          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Break-Glass Emergency Access

```
Condition: All admins unavailable OR system authentication down
Activation:
  1. CEO or Security Officer initiates break-glass
  2. Requires 2-person activation (e.g., CEO + another authorized person)
  3. Break-glass account activates with L1 System Admin privileges
  4. Auto-expires after 4 hours (configurable, hard max 8 hours)
  5. Every action is recorded with high-priority audit
  6. Post-event review mandatory: CEO must review all break-glass actions within 24 hours
  7. Credentials auto-rotated after each use
```

### New SRS Requirements

```
FR-200 JIT PRIVILEGE ELEVATION
Actor: Administrator
Description: Administrators shall request temporary elevation instead of having permanent admin rights.
Workflow:
  - Admin selects target role and duration (max 8 hours)
  - Provides mandatory ticket/reference number and reason
  - Duration > 1 hour requires manager approval
  - Elevation auto-expires; system forcibly logs out
  - Full session recording during elevation
  - Audit events: ELEVATION_REQUESTED, ELEVATION_GRANTED, ELEVATION_EXPIRED

FR-201 BREAK-GLASS EMERGENCY ACCESS
Actor: CEO or Security Officer
Description: Emergency access account for crisis scenarios.
Requirements:
  - Requires 2-person activation
  - Auto-expires after max 4 hours (hard-coded upper limit)
  - Every action keystroke-logged
  - Post-event review mandatory within 24 hours
  - Credentials rotated after each use
  - Audit event: BREAK_GLASS_ACTIVATED, BREAK_GLASS_DEACTIVATED, BREAK_GLASS_REVIEWED

FR-202 ZERO STANDING PRIVILEGES
Actor: System (enforced)
Description: No user shall have permanent admin privileges by default.
Rules:
  - Default admin access duration: 0 (none)
  - All admin access must be explicitly requested via JIT elevation
  - Exception: Maximum 2 named users may have standing L4 (Audit Admin) access
  - Standing access requires quarterly recertification
```

### Dashboard Detail Spec: JIT Elevation Request Form

```
┌──────────────────────────────────────────────────────────────────────┐
│ REQUEST PRIVILEGE ELEVATION                                  [X]     │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ Admin Account:         [Dropdown: list of admin users]               │
│ Target Admin Tier:     [Radio: L1 | L2 | L3 | L4]                    │
│ Duration:              [Dropdown: 30 min | 1 hr | 4 hr | 8 hr]      │
│ Reason:                [Text area - mandatory, min 20 chars]         │
│ Ticket Reference:      [Text field - mandatory]                      │
│ Manager Approval:      [Auto-filled if duration > 1hr]              │
│                        Approver: [Dropdown]                          │
│                                                                      │
│ [SUBMIT]  [CANCEL]                                                   │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

# 3. SEGREGATION OF DUTIES (SoD)

## Dashboard Section: "SoD Compliance"

### Industry Standard: 177+ SoD Rules (SAP GRC Reference)

SoD ensures no single user can complete an entire risky process end-to-end.

### Core SoD Rules for Admin Functions

| ID | Conflicting Functions A | Conflicting Functions B | Risk |
|----|------------------------|------------------------|------|
| SOD-001 | Create User (L2) | Assign Admin Roles (L2) | Admin could create backdoor accounts |
| SOD-002 | Modify Security Policy (L1) | Audit Log Access (L4) | Admin could alter audit trail |
| SOD-003 | Approve Config Changes (CEO) | Request Config Change (L1/L2) | Single person controls config lifecycle |
| SOD-004 | Execute Backup (L1) | Approve Restore (CEO) | Restore to manipulate data |
| SOD-005 | Manage Roles (L2) | Audit Role Assignments (L4) | Self-audit is invalid |
| SOD-006 | Password Reset (L2) | Same user's own account | Privilege escalation via self-service |
| SOD-007 | Bulk Import Users (L2) | Bulk Assign Roles (L2) | Mass privilege grant without oversight |
| SOD-008 | Configure Alert Thresholds (L1) | Acknowledge Alerts (L2) | Suppress alerts then ignore |

### Dashboard UI Requirements — SoD Dashboard

```
┌─────────────────────────────────────────────────────────────────────┐
│ SEGREGATION OF DUTIES                                       [Export]│
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  SoD Compliance Score: 96%  ████████████████░░  (4% at risk)       │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────────┐│
│  │ SEVERITY │ RULE ID │ CONFLICT                      │ USERS     ││
│  ├──────────────────────────────────────────────────────────────────┤│
│  │ 🔴 CRIT │ SOD-001 │ Create User + Assign Admin Role │ 1         ││
│  │ 🟡 HIGH │ SOD-004 │ Execute Backup + Approve Restore│ 0         ││
│  │ 🟡 HIGH │ SOD-003 │ Config Change Req + Approval    │ 2         ││
│  │ 🟢 LOW  │ SOD-008 │ Configure + Acknowledge Alert   │ 3         ││
│  └──────────────────────────────────────────────────────────────────┘│
│                                                                     │
│  SOD Violation Details:                                              │
│  ┌──────────────────────────────────────────────────────────────────┐│
│  │ User: John Doe                                                   ││
│  │ Conflict: SOD-001 — Has L2 (Security Admin) AND can create users││
│  │ Remediation: [Remove Role] [Mitigate with Control] [Accept Risk]││
│  │                                                       [Exclude] ││
│  └──────────────────────────────────────────────────────────────────┘│
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### SoD Check Points

```
Design-Time Check:  Before a role is created → validate no built-in conflicts
Assignment-Time:    Before role assigned to user → simulate conflict detection
Runtime Check:      Periodic scan (daily) → detect new conflicts from accumulated roles
```

### New SRS Requirements

```
FR-300 SOD CONFLICT DETECTION ENGINE
Actor: System (automated)
Description: System shall detect and report segregation of duties conflicts.
Requirements:
  - Maintain a configurable SoD rule matrix (minimum 10 rules, expandable)
  - Check for conflicts at role design time
  - Check for conflicts at role assignment time
  - Run daily automated scan for accumulated conflicts
  - Severity levels: CRITICAL, HIGH, MEDIUM, LOW
  - Generate alert for CRITICAL and HIGH conflicts

FR-301 SOD REMEDIATION WORKFLOW
Actor: L1 System Administrator or CEO
Description: Workflow to resolve SoD conflicts.
Options:
  1. Remove conflicting role from user
  2. Implement compensating control (documented manual review process)
  3. Accept risk with written business justification (CEO approval required for CRITICAL)
All actions audited.

FR-302 SOD RULE CONFIGURATION
Actor: L1 System Administrator
Description: Authorized administrators may configure SoD rule matrix.
Capabilities:
  - View existing rules
  - Add new conflict pairs (Function A + Function B)
  - Modify severity levels
  - Disable/re-enable rules (change audited)
Restriction: Cannot disable rules affecting their own role tier.
```

---

# 4. ACCESS CERTIFICATION & RECERTIFICATION

## Dashboard Section: "Access Reviews"

### Industry Standard: Mandatory Periodic Review Cycles

| Certification Type | Frequency | Who Performs | Dashboard Metric |
|-------------------|-----------|-------------|------------------|
| User Access Review | Quarterly (high-risk) / Annual (low-risk) | Department Manager | % users reviewed |
| Admin Privilege Review | Monthly | Security Officer | % admins reviewed |
| Role Entitlement Review | Annual | Process Owner | % roles reviewed |
| SoD Conflict Review | Quarterly | Compliance / Audit | # open conflicts |
| Dormant Account Review | Monthly | Automated + Security Admin | # dormant accounts |
| Service Account Review | Quarterly | System Owner | % service accounts reviewed |

### Dashboard UI Requirements — Access Certification

```
┌─────────────────────────────────────────────────────────────────────┐
│ ACCESS CERTIFICATION                                        [Export]│
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  UPCOMING REVIEWS:                                                   │
│  ┌──────────────────────────────────────────────────────────────────┐│
│  │ REVIEW TYPE             │ DUE       │ OWNER      │ STATUS       ││
│  ├──────────────────────────────────────────────────────────────────┤│
│  │ 🔴 User Access Review   │ 2026-06-30 │ Dept Mgrs  │ 45% Complete ││
│  │ 🟡 Admin Privilege      │ 2026-07-01 │ Sec Officer│ Not Started  ││
│  │ 🟢 Service Account      │ 2026-08-15 │ System Owr │ Complete     ││
│  └──────────────────────────────────────────────────────────────────┘│
│                                                                     │
│  COMPLETION RATES (Last 4 Quarters):                                │
│  Q3: 82%  ████████████░░░░  Q4: 91%  ██████████████░               │
│  Q1: 95%  ███████████████░  Q2: 87%  █████████████░░               │
│                                                                     │
│  OVERALL COMPLIANCE: 89% — Target: 95%                              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Certification Workflow

```
Certification Due
  → System sends notification to reviewer
  → Reviewer logs into dashboard
  → Shows user list with: Name, Role, Department, Last Login, Assigned Permissions, SoD Flags
  → Reviewer actions per user: [Confirm] [Modify Access] [Revoke Access] [Flag for Review]
  → If no action within 14 days: Escalation to reviewer's manager
  → If no action within 21 days: Auto-flag as reviewed (needs documented policy)
  → All actions recorded in audit log
  → Evidence package generated: CERTIFICATION_Q2_2026.pdf
```

### New SRS Requirements

```
FR-400 ACCESS CERTIFICATION WORKFLOW
Actor: Department Manager, Security Officer, Process Owner
Description: Periodic review and recertification of user access.
Requirements:
  - Configurable review cadence per review type (monthly/quarterly/annual)
  - Automated notifications at 30, 14, 7, and 1 day before due date
  - Dashboard showing: user, role, last login, assigned permissions, SoD flags
  - Reviewer actions: Confirm, Modify, Revoke, Flag
  - Escalation if no action within 14 days
  - Evidence report generated upon completion
  - Audit event: CERTIFICATION_COMPLETED, CERTIFICATION_ESCALATED

FR-401 DORMANT ACCOUNT DETECTION
Actor: System (automated)
Description: Detect and flag user accounts with no activity.
Rules:
  - Threshold: 90 days inactivity = warning; 180 days = auto-disable
  - Service account threshold: 180 days = warning; 365 days = auto-disable
  - Notify manager before auto-disable (14 days grace)
  - Audit event: DORMANT_ACCOUNT_WARNING, DORMANT_ACCOUNT_DISABLED

FR-402 CERTIFICATION EVIDENCE PACKAGE
Actor: L4 Audit Administrator
Description: Generate compliance-ready evidence package.
Contents:
  - All user access review sign-offs (digitally signed)
  - SoD violation report for the period
  - Remediation actions taken
  - Dormant account report
  - Privileged access list
  - Exception/acceptance documentation
Formats: PDF, Excel
Retention: Minimum 7 years (SOX requirement)
```

---

# 5. ADMIN SESSION RECORDING & MONITORING

## Dashboard Section: "Session Monitoring"

### Industry Standard: Full Session Visibility

| Monitoring Level | What's Captured | Industry Leaders |
|-----------------|----------------|-----------------|
| **Level 1: Event Logging** | Login/logout, action type, timestamp, IP | All ERPs |
| **Level 2: Change Tracking** | Before/after values of all modifications | SAP, Oracle |
| **Level 3: Screen Recording** | Video of admin's entire session | Delinea, CyberArk |
| **Level 4: Keystroke Recording** | Every command typed, every field modified | SAP, Oracle GRC |
| **Level 5: Behavioral Analytics** | AI-driven anomaly detection on admin behavior | Oracle, CrowdStrike |

### Dashboard UI Requirements — Session Monitoring

```
┌─────────────────────────────────────────────────────────────────────┐
│ ACTIVE ADMIN SESSIONS                                        [3]    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────────┐│
│  │ ADMIN    │ TIER   │ LOGIN TIME     │ DUR │ ACTIVITY      │ FLAG ││
│  ├──────────────────────────────────────────────────────────────────┤│
│  │ Alice    │ L2     │ 2026-06-16 09:00│ 45m │ Creating User  │ ✅   ││
│  │ Bob      │ L1     │ 2026-06-16 08:30│ 75m │ Config Backup  │ ✅   ││
│  │ Charlie  │ L4     │ 2026-06-16 10:00│ 5m  │ Exporting Audit│ ⚠️   ││
│  └──────────────────────────────────────────────────────────────────┘│
│                                                                     │
│  RECENTLY ENDED:                                                     │
│  ┌──────────────────────────────────────────────────────────────────┐│
│  │ ADMIN    │ START          │ END            │ RECORDING │ ACTIONS││
│  ├──────────────────────────────────────────────────────────────────┤│
│  │ Dave     │ 2026-06-15 22:00│ 2026-06-15 22:30│ ▶ Play    │ 12    ││
│  │ Eve      │ 2026-06-15 14:00│ 2026-06-15 15:00│ ▶ Play    │ 8     ││
│  └──────────────────────────────────────────────────────────────────┘│
│                                                                     │
│  ⚡ ANOMALY DETECTED: Admin session at 02:00 AM — User: Dave       │
│  [Investigate] [Dismiss]                                            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Session Detail View

```
┌─────────────────────────────────────────────────────────────────────┐
│ SESSION DETAIL — Admin: Alice Smith                          [Back] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ Session ID:      SES-20260616-001                                   │
│ Admin:           Alice Smith (L2 Security Admin)                    │
│ IP Address:      10.0.1.45 (Corporate Network)                      │
│ Login Time:      2026-06-16 09:00:15 UTC                            │
│ Logout Time:     2026-06-16 09:45:22 UTC                            │
│ Duration:        45 min 7 sec                                        │
│ Elevation:       JIT (30 min × 1 renewal)                           │
│                                                                     │
│ ┌─────────────── AUDIT TRAIL — 6 EVENTS ──────────────────────────┐ │
│ │ TIME      │ ACTION              │ DETAILS                       │ │
│ ├─────────────────────────────────────────────────────────────────┤ │
│ │ 09:01:05  │ USER_CREATED        │ USR-004512 (Jane Doe)         │ │
│ │ 09:05:22  │ ROLE_ASSIGNED       │ Jane: Sales Rep               │ │
│ │ 09:12:44  │ PASSWORD_RESET      │ USR-004512 (token sent)       │ │
│ │ 09:20:01  │ USER_SEARCH         │ Filter: Department=Sales      │ │
│ │ 09:35:10  │ USER_MODIFIED       │ USR-004511 (Role changed)     │ │
│ │ 09:42:50  │ USER_EXPORT         │ Export: 25 users (Excel)      │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ [Play Session Recording]  [Export Audit Trail]  [Flag for Review]   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### New SRS Requirements

```
FR-500 ADMIN SESSION RECORDING
Actor: System (automated)
Description: All admin sessions shall be recorded.
Requirements:
  - Recording starts at login, ends at logout (or force-terminated)
  - Screen recording (video) + keystroke log captured
  - Recordings stored in tamper-proof storage
  - Retention: Minimum 1 year (SOX: 7 years for financial systems)
  - Playback capability with timestamp navigation
  - Searches by: admin name, date range, action type, flag status
  - Audit event: ADMIN_SESSION_STARTED, ADMIN_SESSION_ENDED

FR-501 ADMIN SESSION ANOMALY DETECTION
Actor: System (automated)
Description: Detect anomalous patterns in admin sessions.
Triggers:
  - Admin login outside business hours (configurable: e.g., 22:00–06:00)
  - Admin login from unusual IP / geolocation
  - Admin performing action outside their typical pattern
  - Multiple high-risk actions in short time window
  - Session duration exceeding normal pattern
Response: Generate CRITICAL alert, notify Security Officer

FR-502 FORCE TERMINATE SESSION
Actor: L1 System Administrator or CEO
Description: Terminate any active admin session.
Requirements:
  - One-click terminate with mandatory reason
  - Terminated admin notified immediately
  - Audit event: ADMIN_SESSION_TERMINATED
Restriction: Cannot terminate own session (must request peer)
```

---

# 6. ROLE ARCHITECTURE (Single + Composite Roles)

## Dashboard Section: "Role Designer"

### Industry Standard: Granular Role Composition

**Wrong (monolithic):**
```
Z_ADMIN_ALL  →  Contains: user create, user delete, config, audit, backup, security policy
```

**Correct (granular):**
```
Single Roles:            Composite Roles:
  Z_SEC_USER_CREATE        Z_C_SEC_ADMIN_FULL
  Z_SEC_USER_DELETE      = Z_SEC_USER_CREATE
  Z_SEC_ROLE_ASSIGN        + Z_SEC_USER_DELETE
  Z_SEC_CONFIG_VIEW        + Z_SEC_ROLE_ASSIGN
  Z_SEC_CONFIG_MODIFY      + Z_SEC_CONFIG_VIEW
  Z_SEC_AUDIT_VIEW         + Z_SEC_CONFIG_MODIFY
  Z_SEC_AUDIT_EXPORT       + Z_SEC_AUDIT_VIEW
                           + Z_SEC_AUDIT_EXPORT
```

### Role Naming Convention (SAP/Oracle Standard)

```
Pattern: Z_<MODULE>_<FUNCTION>_<SCOPE>
Example: Z_SEC_USER_CREATE_GLOBAL

Components:
  Prefix:   Z_ (customer), SAP_ (standard)
  Module:   SEC, FIN, SCM, HCM, AUD
  Function: USER_CREATE, ROLE_ASSIGN, CONFIG_VIEW, AUDIT_EXPORT
  Scope:    GLOBAL, REGION_EMEA, DEPT_SALES
```

### Dashboard UI Requirements — Role Designer

```
┌─────────────────────────────────────────────────────────────────────┐
│ ROLE DESIGNER                                               [New]   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ Role Name:   [Z_SEC_USER_ADMIN_GLOBAL          ] [Validate Name]   │
│ Description: [Security admin for user lifecycle                    ]│
│ Type:        ○ Single  ● Composite                                  │
│                                                                     │
│ Available Single Roles:                 Assigned to Composite:      │
│ ┌───────────────────────┐              ┌──────────────────────────┐ │
│ │ Z_SEC_USER_CREATE     │  [Add >>]    │ ✓ Z_SEC_USER_CREATE      │ │
│ │ Z_SEC_USER_DELETE     │              │ ✓ Z_SEC_USER_DELETE      │ │
│ │ Z_SEC_ROLE_ASSIGN     │  [<< Remove] │ ✓ Z_SEC_PASSWORD_RESET   │ │
│ │ Z_SEC_CONFIG_VIEW     │              │                          │ │
│ │ Z_SEC_CONFIG_MODIFY   │              │                          │ │
│ │ Z_SEC_AUDIT_VIEW      │              │                          │ │
│ └───────────────────────┘              └──────────────────────────┘ │
│                                                                     │
│ ⚠ SoD Check: No conflicts found                                     │
│                                                                     │
│ [Save]  [Save & Assign]  [Cancel]  [Test Role]                      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Permission Matrix View

```
┌─────────────────────────────────────────────────────────────────────┐
│ PERMISSION MATRIX                                           [Export]│
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ ROLES →            │ L1 SysAdmin │ L2 SecAdmin │ L3 FuncAdmin │ ...│
│ PERMISSIONS ↓       │             │             │              │     │
├─────────────────────┼─────────────┼─────────────┼──────────────┤     │
│ User Create         │     ❌      │     ✅      │     ❌       │     │
│ User Delete         │     ❌      │     ✅      │     ❌       │     │
│ Config Modify       │     ✅      │     ❌      │     ⚠️ Scope  │     │
│ Audit View          │     ❌      │     ❌      │     ❌       │     │
│ Backup Execute      │     ✅      │     ❌      │     ❌       │     │
│ Role Assign         │     ❌      │     ✅      │     ❌       │     │
│ ...                 │             │             │              │     │
└─────────────────────────────────────────────────────────────────────┘
```

### New SRS Requirements

```
FR-600 SINGLE ROLE MANAGEMENT
Actor: L2 Security Administrator
Description: Create and manage single (atomic) roles.
Rules:
  - Each single role represents ONE job function
  - Naming convention enforced: Z_<MODULE>_<FUNCTION>_<SCOPE>
  - Single roles contain actual authorization data
  - Cannot be directly assigned to users (only via composite roles)

FR-601 COMPOSITE ROLE MANAGEMENT
Actor: L2 Security Administrator
Description: Bundle single roles into composite roles for user assignment.
Rules:
  - Composite roles contain NO authorization data (only references to single roles)
  - SoD check runs automatically when adding single roles to composite
  - Users assigned to composite roles, NOT single roles
  - Composite roles represent complete job profiles

FR-602 PERMISSION MATRIX VIEW
Actor: L4 Audit Administrator
Description: Display and export complete permission-to-role mapping.
View:
  - Rows: All permissions
  - Columns: All roles
  - Cells: ✅ Allowed, ❌ Denied, ⚠️ Conditional
Export: PDF, Excel
Audit event: PERMISSION_MATRIX_EXPORTED
```

---

# 7. NON-HUMAN IDENTITIES / SERVICE ACCOUNTS

## Dashboard Section: "Service Accounts"

### Industry Standard: NHI Outnumber Humans 25-50x

Non-human identities (NHIs) include: service accounts, API keys, OAuth tokens, bot accounts, integration accounts, CI/CD accounts, system accounts.

### Service Account vs Human Account

| Human Admin | Service Account |
|------------|----------------|
| Named individual (John Doe) | Named function (ERP-INTEGRATION-SAP) |
| MFA required | No MFA → compensated by IP restriction |
| Session recording | Action logging only |
| 8-hour shifts | 24/7 operation |
| Password + 2FA | Token-based auth |
| Access reviewed quarterly | Access reviewed semi-annually |
| Goes through HR lifecycle | Has system-driven lifecycle |

### Dashboard UI Requirements — Service Accounts

```
┌─────────────────────────────────────────────────────────────────────┐
│ SERVICE ACCOUNTS & NON-HUMAN IDENTITIES                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Total Service Accounts: 47   (outnumber human admins 4:1)          │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────────┐│
│  │ ACCOUNT NAME          │ TYPE     │ SCOPE      │ LAST ROTATION  ││
│  ├──────────────────────────────────────────────────────────────────┤│
│  │ svc-ERP-INTEGRATION   │ API Key  │ Finance    │ 2026-06-01 ✅  ││
│  │ svc-DB-BACKUP         │ System   │ Database   │ 2026-05-15 ⚠️  ││
│  │ svc-CI-DEPLOY         │ CI/CD    │ App Deploy │ 2026-06-10 ✅  ││
│  │ svc-EMAIL-NOTIFY      │ OAuth    │ Email Svc  │ 2026-04-01 🔴  ││
│  └──────────────────────────────────────────────────────────────────┘│
│                                                                     │
│  ⚠ 12 service accounts have not had secret rotation in >90 days     │
│  ⚠ 3 service accounts unused for >180 days (candidates for removal) │
│                                                                     │
│  [Create Service Account]  [Rotate Secrets]  [Review Access]        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### New SRS Requirements

```
FR-700 SERVICE ACCOUNT MANAGEMENT
Actor: L1 System Administrator
Description: Create and manage non-human identities.
Fields:
  - Account Name (must be prefixed: svc-, bot-, api-)
  - Account Type: API Key, System Account, OAuth Client, CI/CD, Bot
  - Scope: Module(s) accessible
  - Owner (named person responsible)
  - Expiration Date
  - IP Whitelist (optional)
Requirements:
  - Secrets auto-rotated every 90 days (configurable)
  - Inactive >180 days → auto-disabled
  - No MFA → must have compensating control (IP restriction, TLS cert)
  - All actions audited and attributed to service account name (not shared)
  - Quarterly access review required

FR-701 SERVICE ACCOUNT LIFECYCLE
Actor: L1 System Administrator
Description: Automate service account lifecycle.
Workflow:
  - Request: Manager requests, specifies scope + duration
  - Approval: Security Officer approves
  - Provision: Account created, secret generated and vaulted
  - Usage: Monitored for anomalies (unusual hours, unusual IPs)
  - Rotation: Automated secret rotation every 90 days
  - Deprovision: Account disabled at expiration, removed after 30-day grace
```

---

# 8. FIELD-LEVEL SECURITY (FLS)

## Dashboard Section: "Field Security Configuration"

### Industry Standard: Control Down to the Individual Field

Not just "can admin view user record" — but "can admin view the salary field within the user record."

### Field Sensitivity Levels

| Level | Label | Admin Access | Masking | Example Fields |
|-------|-------|-------------|---------|---------------|
| L0 | Public | Full view | None | Name, Department |
| L1 | Internal | Full view | None | Email, Phone |
| L2 | Confidential | View only in UI | Masked in export/external | Role, Status |
| L3 | Restricted | View with reason | Masked everywhere except authorized view | Salary, Bank Account, Tax ID |
| L4 | Critical | Special approval required | Never visible; stored encrypted | Passwords, 2FA Recovery Codes, Session Tokens |
| L5 | System | No one can view | Not accessible via any interface | User IDs in audit references, internal timestamps |

### Dashboard UI Requirements — Field Security Config

```
┌─────────────────────────────────────────────────────────────────────┐
│ FIELD-LEVEL SECURITY CONFIG                                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ Module: [User Management ─]                                         │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────────┐│
│  │ FIELD NAME        │ SENSITIVITY │ MASK RULE    │ ADMIN VIEW     ││
│  ├──────────────────────────────────────────────────────────────────┤│
│  │ user.full_name    │ L0 Public   │ None         │ ✅ Full        ││
│  │ user.email        │ L1 Internal │ Mask@        │ ✅ Full        ││
│  │ user.phone        │ L1 Internal │ Mask middle  │ ✅ Full        ││
│  │ user.salary       │ L3 Restricted │ ██████     │ ⚠️ With Reason ││
│  │ user.bank_account │ L3 Restricted │ ██████     │ ❌ Denied      ││
│  │ user.role         │ L1 Internal │ None         │ ✅ Full        ││
│  │ user.password     │ L4 Critical  │ ██████     │ ❌ Denied      ││
│  │ user.2fa_recovery │ L4 Critical  │ ██████     │ ❌ Denied      ││
│  └──────────────────────────────────────────────────────────────────┘│
│                                                                     │
│  [Edit Sensitivity]  [Apply to All Modules]  [Export Config]        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Masking Rules for Audit Logs

| Data Type | Masking Rule | Example |
|-----------|-------------|---------|
| Email | Show first char + domain | `j***@example.com` |
| Phone | Show last 4 digits | `*******8901` |
| SSN/Tax ID | Show last 4 digits | `***-**-1234` |
| Bank Account | Show last 4 digits | `*****6789` |
| IP Address | Mask last octet | `10.0.1.***` |
| Full Name | Show first + last initial | `John S***` |

### New SRS Requirements

```
FR-800 FIELD SENSITIVITY CLASSIFICATION
Actor: L1 System Administrator
Description: Configure sensitivity level for each field in the system.
Requirements:
  - 6 sensitivity levels: Public, Internal, Confidential, Restricted, Critical, System
  - Per-field configuration
  - Masking rules configurable per sensitivity level
  - Admin view restrictions enforced at database + API + UI layers
  - Changes audited: FIELD_SENSITIVITY_MODIFIED

FR-801 SENSITIVE FIELD ACCESS LOG
Actor: System (automated)
Description: All access to Restricted+ fields shall be logged.
Logged data:
  - Who accessed
  - Which field
  - Which record
  - Timestamp
  - Reason (if required)
  - Session ID
Retention: 7 years
```

---

# 9. ROW-LEVEL SECURITY / DATA ISOLATION

## Dashboard Section: "Data Access Scopes"

### Industry Standard: Admin Scope Limitation

Even within the same role, admins should see only the data they are authorized to see based on organizational scope.

### RLS Dimensions

| Dimension | How It Works | Example |
|-----------|-------------|---------|
| **Organizational** | Admin scope = Department/BU | EMEA Admin sees only EMEA users |
| **Geographic** | Admin scope = Region | EU Admin cannot manage US users (GDPR) |
| **Hierarchical** | Junior vs Senior scope | Dept Admin vs Global Admin |
| **Temporal** | Time-bound visibility | Audit admin sees logs in date range only |
| **Contextual** | Conditional access | Admin can view user data but NOT financial data |

### Dashboard UI Requirements — Data Scopes

```
┌─────────────────────────────────────────────────────────────────────┐
│ DATA ACCESS SCOPE CONFIG                                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ Admin: [Alice Smith ─]                                              │
│                                                                     │
│ Current Scope:                                                      │
│   Geographic:  EMEA Only                                            │
│   Department:  Sales, Support                                       │
│   Data Level:  Standard (no financial, no HR)                       │
│   Max Sensitivity: L2 (Confidential)                                │
│                                                                     │
│ ┌──────────────────────────────────────────────────────────────────┐│
│ │ SCOPE DIMENSION    │ CURRENT VALUE         │ [EDIT]              ││
│ ├──────────────────────────────────────────────────────────────────┤│
│ │ Geographic         │ EMEA                   │ [Change Region]    ││
│ │ Department         │ Sales, Support         │ [Add/Remove Dept]  ││
│ │ Data Category      │ User, Config           │ [Add Data Type]    ││
│ │ Sensitivity Limit  │ L2 (Confidential)      │ [Upgrade]          ││
│ │ Time Restriction   │ Business Hours Only    │ [Change Schedule]  ││
│ └──────────────────────────────────────────────────────────────────┘│
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### RLS Enforcement Points

```
Database Layer:  WHERE tenant_id = CURRENT_ADMIN_TENANT_ID
API Layer:       Authorization filter applied before query
UI Layer:        Data not rendered if outside admin scope
Export Layer:    Filtered at source; scope cannot be bypassed via export
```

### New SRS Requirements

```
FR-900 ROW-LEVEL ADMIN SCOPE
Actor: L1 System Administrator
Description: Define data access scope for each administrator.
Scope dimensions:
  - Geographic region
  - Department / Business Unit
  - Data category (user, config, finance, audit)
  - Sensitivity level limit
  - Time restriction (business hours only, or 24/7)
Enforcement:
  - Scope applied at DB query level
  - Cannot be bypassed via API or export
  - Scope changes require dual approval (self + Security Officer)
```

---

# 10. DELEGATED ADMINISTRATION

## Dashboard Section: "Delegated Admin Tree"

### Industry Standard: Sub-Admins with Limited Scope

Large organizations need regional/departmental admins who can manage a subset of users but not the whole system.

### Delegated Admin Hierarchy

```
Global Admin (L1) — FULL SYSTEM
├── Regional Admin: EMEA
│   ├── Dept Admin: EMEA/Sales
│   ├── Dept Admin: EMEA/Support
│   └── Dept Admin: EMEA/Finance
├── Regional Admin: APAC
│   ├── Dept Admin: APAC/Sales
│   └── Dept Admin: APAC/Logistics
└── Regional Admin: AMERICAS
    └── Read-Only Admin: AMERICAS (audit only)
```

### Delegated Admin Permissions

| Capability | Global | Regional | Dept | Read-Only |
|-----------|--------|----------|------|-----------|
| Create users (own scope) | ✅ | ✅ | ✅ | ❌ |
| Reset passwords (own scope) | ✅ | ✅ | ✅ | ❌ |
| Assign roles (own scope, non-admin) | ✅ | ✅ | ✅ | ❌ |
| Assign admin roles | ✅ | ❌ | ❌ | ❌ |
| Configure system settings | ✅ | ⚠️ Regional only | ❌ | ❌ |
| View audit logs (own scope) | ✅ | ✅ | ✅ | ✅ |
| Export audit logs | ✅ | ❌ | ❌ | ✅ |
| Manage backups | ✅ | ❌ | ❌ | ❌ |
| Approve config changes | ✅ | ❌ | ❌ | ❌ |
| Escalate to Global Admin | ✅ | ✅ | ✅ | ✅ |

### Dashboard UI Requirements — Delegation Tree

```
┌─────────────────────────────────────────────────────────────────────┐
│ DELEGATED ADMIN TREE                                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  🌐 GLOBAL (2 Admins)                                               │
│  ├── 🌍 EMEA (1 Regional Admin)                                    │
│  │   ├── 🏢 Sales (1 Dept Admin)                                   │
│  │   ├── 🏢 Support (0 Dept Admin) ⚠️ Unassigned                   │
│  │   └── 🏢 Finance (1 Dept Admin)                                 │
│  ├── 🌍 APAC (1 Regional Admin)                                    │
│  │   ├── 🏢 Sales (1 Dept Admin)                                   │
│  │   └── 🏢 Logistics (0 Dept Admin) ⚠️ Unassigned                │
│  └── 🌍 AMERICAS (0 Regional Admin) 🔴 UNASSIGNED                  │
│      └── Read-Only scope assigned to Auditor (L4)                  │
│                                                                     │
│  [Add Admin to Node]  [Move Admin]  [View Scope Summary]           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### New SRS Requirements

```
FR-1000 DELEGATED ADMIN NODES
Actor: L1 System Administrator
Description: Create organizational nodes for delegated administration.
Structure:
  - Hierarchical tree: Global → Region → Department
  - Each node can have assigned admins with defined scope
  - Admin at parent node inherits scope of child nodes (optional config)
  - Minimum 1 admin per node recommended; alert if 0
Audit: NODE_CREATED, NODE_DELETED, ADMIN_ASSIGNED_TO_NODE

FR-1001 DELEGATED ADMIN SCOPING
Actor: L1 System Administrator
Description: Define what a delegated admin can do within their node.
Configurable per node:
  - Geographic scope (region, country)
  - User scope (department, role, status)
  - Module access (which modules visible)
  - Admin capability level (full, user-only, read-only)
  - Max sensitivity tier visible
```

---

# 11. MULTI-TENANT ADMIN ISOLATION

## Dashboard Section: "Tenant Management"

### Industry Standard: Tenant Isolation Architecture

For SaaS ERP deployments where one instance serves multiple companies/organizations.

### Isolation Levels

| Level | Architecture | Security | Cost | When to Use |
|-------|-------------|----------|------|-------------|
| **Logical** | Shared DB + Tenant_ID column | Moderate | Low | Low-risk, cost-sensitive |
| **Schema** | Separate schema per tenant | High | Medium | Mid-market |
| **Database** | Separate DB per tenant | Very High | High | Enterprise, regulated |
| **Instance** | Separate app instance per tenant | Maximum | Very High | Government, finance |

### Dashboard UI Requirements — Tenant Isolation

```
┌─────────────────────────────────────────────────────────────────────┐
│ TENANT MANAGEMENT                                           [Add]   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────────┐│
│  │ TENANT     │ USERS │ ISOLATION  │ STATUS   │ LAST BACKUP      ││
│  ├──────────────────────────────────────────────────────────────────┤│
│  │ Acme Corp  │ 1,245  │ Database   │ ✅ Active │ 2026-06-15       ││
│  │ Globex Inc │ 543    │ Database   │ ✅ Active │ 2026-06-15       ││
│  │ Initech    │ 89     │ Schema     │ ✅ Active │ 2026-06-14       ││
│  │ Hooli      │ 12     │ Logical    │ ⚠️ Trial  │ Never            ││
│  └──────────────────────────────────────────────────────────────────┘│
│                                                                     │
│  Cross-Tenant Admin Access:                                         │
│  ┌──────────────────────────────────────────────────────────────────┐│
│  │ ADMIN    │ CAN ACCESS TENANTS    │ LAST CROSS-TENANT ACTION     ││
│  ├──────────────────────────────────────────────────────────────────┤│
│  │ Alice    │ All                   │ 2026-06-15 (Tenant: Acme)    ││
│  │ Bob      │ Acme, Globex          │ 2026-06-10 (Tenant: Globex)  ││
│  └──────────────────────────────────────────────────────────────────┘│
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Cross-Tenant Admin Controls

```
Global Admin can access any tenant BUT:
  - Every cross-tenant action attributed to global admin + tenant ID
  - Tenant admin is notified when global admin accesses their tenant
  - Cross-tenant data copy/migration requires explicit audit
  - Tenant isolation tested during CI/CD pipeline (regression tests)
```

### New SRS Requirements

```
FR-1100 TENANT ISOLATION ENFORCEMENT
Actor: System (architectural)
Description: Enforce complete data isolation between tenants.
Requirements:
  - Tenant ID on every data record
  - All queries filtered by tenant_id (application-level + DB-level)
  - Cross-tenant queries blocked unless explicitly authorized
  - Tenant isolation test suite runs with every deployment
  - Isolation level configurable per tenant

FR-1101 CROSS-TENANT ADMIN AUDIT
Actor: L1 System Administrator
Description: Log and control cross-tenant admin access.
Requirements:
  - Cross-tenant action attributed to admin identity + source tenant
  - Target tenant admin notified of cross-tenant activity
  - Cross-tenant session marked differently in audit trail
  - Report available: all cross-tenant actions in past 90 days
```

---

# 12. ADMIN ATTESTATION EVIDENCE FOR AUDITS

## Dashboard Section: "Compliance & Audit Evidence"

### Industry Standard: Proactive Evidence Collection

Not just *doing* access reviews — but *proving* you did them with verifiable evidence artifacts.

### Evidence Requirements by Framework

| Framework | Required Evidence | Retention |
|-----------|------------------|-----------|
| **SOX §404** | User access review sign-offs, SoD violation reports, change approval records | 7 years |
| **SOC 2** | Access request/provision/deprovision logs, periodic review evidence, exception documentation | 2+ years |
| **ISO 27001 A.9** | Access control policy, user registration/deregistration records, privileged access logs | 3+ years |
| **PCI-DSS 7.2** | Access control list for privileged IDs, review log showing last review date | 3+ years |
| **NIST AC-6(9)** | Audit of privileged function use, review records | Organization policy |

### Dashboard UI Requirements — Compliance Evidence

```
┌─────────────────────────────────────────────────────────────────────┐
│ COMPLIANCE & AUDIT EVIDENCE                                [Export]│
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ AUDIT READINESS: 92%                                                │
│                                                                     │
│ ┌───────────────────────────────────────────────────────────────────┐│
│ │ EVIDENCE ITEM               │ STATUS    │ LAST GENERATED        ││
│ ├───────────────────────────────────────────────────────────────────┤│
│ │ User Access Reviews (Q2)    │ ✅ Complete│ 2026-06-15            ││
│ │ SoD Violation Report        │ ✅ Complete│ 2026-06-16            ││
│ │ Admin Privilege List        │ ✅ Complete│ 2026-06-16            ││
│ │ Change Approval Log         │ ✅ Complete│ 2026-06-16            ││
│ │ Session Recording Audit     │ ❌ Missing │ —                     ││
│ │ Dormant Account Report      │ ✅ Complete│ 2026-06-14            ││
│ └───────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  [Generate Evidence Package]  [Schedule Automatic Generation]       │
│  [View Past Packages]  [Send to Auditor]                             │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Evidence Package Structure

```
Evidence_Package_Q2_2026/
├── 01_User_Access_Reviews/
│   ├── Q2_Access_Review_Report.pdf          (Signed by all managers)
│   ├── Q2_Access_Review_Details.xlsx        (Raw data)
│   └── Q2_Review_Completion_Certificate.pdf (System-generated)
├── 02_SoD/
│   ├── Q2_SoD_Violation_Report.pdf          (All conflicts detected)
│   ├── Q2_SoD_Remediation_Log.pdf           (Resolved conflicts)
│   └── Q2_SoD_Exceptions.pdf                (Accepted risks with sign-off)
├── 03_Privileged_Access/
│   ├── Q2_Admin_List.pdf                    (All privileged users)
│   ├── Q2_Privileged_Access_Review.pdf      (Reviewed by Security Officer)
│   └── Q2_Break_Glass_Usage_Report.pdf      (Any emergency access)
├── 04_Change_Management/
│   ├── Q2_Role_Changes.xlsx                 (All role modifications)
│   ├── Q2_Config_Changes.xlsx               (System configuration changes)
│   └── Q2_Approval_Workflow_Log.xlsx        (Approval history)
└── 05_Additional/
    ├── Q2_Dormant_Accounts.pdf              (Accounts >90 days inactive)
    ├── Q2_Session_Recording_Summary.pdf     (Admin sessions summary)
    └── Q2_Incident_Response_Log.pdf         (Security events)
```

### New SRS Requirements

```
FR-1200 COMPLIANCE EVIDENCE PACKAGE GENERATION
Actor: L4 Audit Administrator
Description: Generate complete compliance evidence package.
Requirements:
  - One-click generation of full evidence package
  - Package includes: access reviews, SoD reports, admin list, change log, dormant accounts
  - Digital signatures on all sign-off documents
  - Tamper-evident packaging (hash chain)
  - Schedule automatic generation (quarterly)
  - Formats: PDF (for signing), Excel (for auditor analysis)
  - Retention: Minimum 7 years

FR-1201 AUDIT LOG EXPORT WITH EVIDENCE
Actor: L4 Audit Administrator
Description: Export audit logs with compliance-ready metadata.
Included:
  - All audit records within date range
  - System configuration snapshot at time of export
  - User-to-role mapping at time of export
  - SoD rule set version at time of export
  - Digital signature for integrity verification
```

---

# 13. THIRD-PARTY / VENDOR ADMIN ACCESS

## Dashboard Section: "External Access"

### Industry Standard: Strict Vendor Admin Controls

External consultants, implementation partners, and support vendors frequently require admin-level access but must be tightly controlled.

### Vendor Admin Controls

| Control | Requirement | Dashboard Indicator |
|---------|-------------|-------------------|
| Time-bound | Max 90 days, must be renewed | Countdown timer on every vendor account |
| Scope-limited | Only specific functions | Visible scope restrictions |
| No permanent access | Must be created per-engagement | No standing vendor access |
| Currently monitored | All sessions flagged | ⚠ Tag on active vendor sessions |
| MFA enforced | If vendor can use MFA, it is required | MFA status column |
| No shared credentials | Each vendor individual has unique account | Never "consultant" shared account |

### Dashboard UI Requirements — Vendor Access

```
┌─────────────────────────────────────────────────────────────────────┐
│ VENDOR / EXTERNAL ADMIN ACCESS                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────────┐│
│  │ VENDOR      │ ADMIN    │ SCOPE       │ EXPIRES   │ SESSIONS    ││
│  ├──────────────────────────────────────────────────────────────────┤│
│  │ Acme Cons   │ John C   │ Finance     │ 2026-07-15│ 23 (🟢)    ││
│  │ Acme Cons   │ Sarah L  │ Config Only │ 2026-07-15│ 5 (🟢)     ││
│  │ ERP Fix Ltd │ Mike R   │ Full System │ 2026-06-30│ 12 (⚠️)    ││
│  └──────────────────────────────────────────────────────────────────┘│
│                                                                     │
│  ⚠ Vendor "Mike R" has FULL SYSTEM access — 14 days remaining       │
│  ⚠ Vendor "ERP Fix Ltd" engagement ends in 14 days — offboarding?  │
│                                                                     │
│  [Onboard Vendor]  [Extend Access]  [Revoke Access]                │
│  [Vendor Access Report]                                             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Vendor Onboarding Form

```
┌──────────────────────────────────────────────────────────────────────┐
│ ONBOARD VENDOR ADMIN                                         [X]    │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ Vendor Company:    [________________________]                        │
│ Contact Name:     [________________________]                        │
│ Contact Email:    [________________________]                        │
│ Engagement Ref:   [________________________]  (Link to contract)    │
│ Scope:            [Dropdown: Full | Module | Config Only | Audit]  │
│ Duration:         [Start: ____]  [End: ____]  (Max 90 days)        │
│ Justification:    [Text area - mandatory]                           │
│ Supervising Admin: [Dropdown - internal admin responsible]          │
│                                                                      │
│  Compensating Controls:                                              │
│  ☑ Session recording enabled                                         │
│  ☑ All actions flagged for review                                   │
│  ☑ Manager notified of vendor activity weekly                       │
│                                                                      │
│  Approvals Required:                                                 │
│  [ ] Department Manager                                              │
│  [ ] Security Officer                                                │
│  [ ] CEO (if scope = Full System)                                    │
│                                                                      │
│ [SUBMIT]  [CANCEL]                                                   │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### New SRS Requirements

```
FR-1300 VENDOR ADMIN ONBOARDING
Actor: L1 System Administrator, Security Officer
Description: Onboard external vendor/contractor with admin access.
Requirements:
  - Vendor admin type distinct from employee admin type
  - Mandatory end date (hard max 90 days; requires CEO approval to extend)
  - Scope limited to minimum required functions
  - Supervising internal admin assigned
  - Session recording mandatory
  - Two approval workflow: Dept Manager + Security Officer
  - CEO approval required for "Full System" scope

FR-1301 VENDOR ADMIN OFFBOARDING
Actor: System (automated)
Requirements:
  - Account auto-disabled at end date
  - Supervising admin notified 14, 7, and 1 day before expiration
  - Access removal verification report sent to Security Officer
  - All vendor sessions reviewed before account cleanup
  - System checks: no active sessions, no pending approvals, no linked data
  - Account anonymized (not deleted) for audit trail preservation
```

---

# 14. ADMIN DISASTER RECOVERY & BUSINESS CONTINUITY

## Dashboard Section: "Disaster Recovery"

### Industry Standard: Admin Access During Crisis

What happens to admin access when everything is broken? The system must define and test this.

### Admin DR Scenarios

| Scenario | Industry Solution | Dashboard Control |
|----------|------------------|-------------------|
| Admin unavailable (sick/quit) | Co-admin with same privileges exists | "Coverage" indicator per admin tier |
| System recovery needs admin | Break-glass account with safeguarded credentials | Break-glass activation log |
| Auth service down | Local fallback authentication for L1 admins | Emergency auth mode toggle |
| Data center outage | Cross-region admin access | DR status indicator |
| Admin credentials compromised | Immediate revocation + failover to co-admin | Emergency lockout button |

### Admin DR Requirements

```
NORMAL OPERATIONS:
  Admin A (primary) + Admin B (co-admin) per tier
  Both have individual credentials, both trained
  Monthly DR test: can Admin B take over?

CRISIS - Admin A unavailable:
  → Admin B activates within 15 minutes
  → Admin B assumes all responsibilities
  → System notifies CEO of admin change

CRISIS - Both admins unavailable:
  → Break-Glass account activated by CEO
  → 2-person activation (CEO + another authorized)
  → Auto-expires after 4 hours
  → Post-event mandatory review

CRISIS - Authentication service is down:
  → Emergency local auth mode for L1 admins
  → Requires hardware token (YubiKey, smart card)
  → Circumvents normal 2FA but logs all actions
  → Auto-disables when auth service recovers
```

### Dashboard UI Requirements — DR Dashboard

```
┌─────────────────────────────────────────────────────────────────────┐
│ DISASTER RECOVERY — ADMIN ACCESS                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ADMIN TIER COVERAGE:                                               │
│  L1 System Admin:   Admin A (✅ Available)  Admin B (✅ Available) │
│  L2 Security Admin:  Admin C (✅)           Admin D (❌ Sick Leave)│
│  L3 Functional:      Admin E (✅)           Admin F (✅)           │
│  L4 Audit:           Admin G (✅)                                   │
│                                                                     │
│  BREAK-GLASS STATUS:                                                │
│  🔐 Last used: 2026-04-12  (64 days ago)                            │
│  🔐 Password last rotated: 2026-06-01                              │
│  🔐 Sealed envelope: ✅ Verified (quarterly check)                 │
│                                                                     │
│  DR TEST RESULTS:                                                   │
│  Last DR test: 2026-05-30 — ✅ Passed (Admin B took over in 8 min) │
│  Next DR test: 2026-08-30 — Scheduled                              │
│                                                                     │
│  [Initiate DR Test]  [Activate Break-Glass]  [Emergency Lockout]   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### New SRS Requirements

```
FR-1400 ADMIN COVERAGE REQUIREMENT
Actor: System (enforced)
Description: Each admin tier must have at least 2 assigned administrators.
Rules:
  - Minimum 2 admins per tier (primary + co-admin)
  - System alerts if any tier drops to 1 admin
  - If any tier reaches 0 admins → CRITICAL alert + break-glass eligibility
  - Co-admin must have same training/certification as primary

FR-1401 EMERGENCY LOCAL AUTHENTICATION
Actor: L1 System Administrator (emergency only)
Description: Fallback authentication when normal auth service is unavailable.
Requirements:
  - Only available when primary authentication is confirmed down
  - Requires hardware security key (not just password)
  - All actions during emergency mode tagged with special audit flag
  - Maximum duration: 4 hours (auto-locks after)
  - Mode auto-disables when primary auth service recovers
  - Full report generated after emergency mode ends

FR-1402 DR TEST REQUIREMENT
Actor: L1 System Administrator
Description: Regular testing of admin disaster recovery.
Requirements:
  - Quarterly DR test: co-admin takes over for 24 hours
  - Annual full DR test: simulate total admin unavailability
  - Test results documented and retained for audit
  - Remediation plan for any failures found during testing
```

---

# 15. PRIVILEGE CREEP DETECTION & PREVENTION

## Dashboard Section: "Privilege Health"

### Industry Standard: Detect Accumulated Unnecessary Permissions

Privilege creep — the gradual accumulation of permissions over time — is the #1 insider threat vector.

### Detection Methods

| Method | Frequency | Description | Dashboard Widget |
|--------|-----------|-------------|-----------------|
| **Did-Do Analysis** | Quarterly | Compare assigned vs. actually used privileges | Did-Do Score |
| **Dormant Role Detection** | Monthly | Roles unused for >90 days → flag | Dormant Role Count |
| **Role Accumulation** | Monthly | Users with 4+ roles → risk of overlap | Accumulation Alerts |
| **Permission Explosion** | Quarterly | Roles granting >X auth objects → review | Explosion Alerts |
| **Cross-Module Accumulation** | Quarterly | Finance + Procurement + User Admin user | High-Risk Users |
| **Temporal Anomaly** | Weekly | Admin actions at unusual hours | Anomaly Count |

### Dashboard UI Requirements — Privilege Health

```
┌─────────────────────────────────────────────────────────────────────┐
│ PRIVILEGE HEALTH SCORE                                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  OVERALL SCORE: 78/100  ████████████████░░░░  (Trend: 📉 -3 pts)   │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────────┐│
│  │ METRIC                   │ VALUE    │ THRESHOLD │ STATUS       ││
│  ├──────────────────────────────────────────────────────────────────┤│
│  │ Did-Do Match Rate        │ 72%      │ >80%      │ ⚠️ Attention ││
│  │ Dormant Roles (>90 days) │ 14       │ <10       │ ⚠️ Attention ││
│  │ Users with 4+ Roles     │ 8        │ <5        │ 🔴 Critical  ││
│  │ Privilege Creep Score    │ 0.28     │ <0.30     │ 🟢 Good      ││
│  │ High-Risk Users          │ 3        │ <2        │ 🔴 Critical  ││
│  └──────────────────────────────────────────────────────────────────┘│
│                                                                     │
│  DID-DO ANALYSIS — Users with Largest Gaps:                         │
│  ┌──────────────────────────────────────────────────────────────────┐│
│  │ USER    │ ASSIGNED ROLES │ ROLES USED (90d) │ GAP    │ ACTIONS ││
│  ├──────────────────────────────────────────────────────────────────┤│
│  │ John    │ 5             │ 2               │ 3 unused│ [Review]││
│  │ Jane    │ 4             │ 1               │ 3 unused│ [Review]││
│  │ Bob     │ 6             │ 4               │ 2 unused│ [Review]││
│  └──────────────────────────────────────────────────────────────────┘│
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Privilege Creep Score Formula

```
Privilege_Creep_Score = (Current_Privileges - Required_Privileges) / Baseline

Where:
  - Current_Privileges = Sum of all authorization values assigned
  - Required_Privileges = Sum of privileges actually executed in 90 days
  - Baseline = Normalized per role type

Score < 0.20 = GOOD
Score 0.20–0.30 = WARNING (review recommended)
Score 0.30–0.50 = HIGH RISK (flag for immediate review)
Score > 0.50 = CRITICAL (immediate remediation required)
```

### New SRS Requirements

```
FR-1500 DID-DO ANALYSIS ENGINE
Actor: System (automated)
Description: Compare assigned privileges vs. actually used privileges.
Requirements:
  - Tracks all authorization executions (which permission was used, by whom, when)
  - Generates quarterly report: assigned vs. used per user
  - Flags users where < 80% of assigned privileges were used
  - Flags roles where < 60% of role's permissions were used
  - Automated remediation suggestion: create leaner role based on actual usage
  - Audit event: DID_DO_ANALYSIS_COMPLETED

FR-1501 ROLE ACCUMULATION ALERT
Actor: System (automated)
Description: Alert when user accumulates excessive roles.
Rules:
  - Alert at 4 roles per user (configurable threshold)
  - Alert at 3 cross-module roles per user
  - Alert when accumulated roles create new SoD conflict
  - Auto-suggest role consolidation

FR-1502 PRIVILEGE CREEP SCORE DASHBOARD
Actor: L4 Audit Administrator
Description: Display and trend privilege creep metrics.
Metrics:
  - Overall privilege creep score (organization)
  - Per-user privilege creep score
  - Trend over last 4 quarters
  - Top 10 users with highest creep scores
  - Roles with largest permission-to-usage gaps
```

---

# 16. API-LEVEL ADMIN PERMISSIONS

## Dashboard Section: "API Access Control"

### Industry Standard: Admin via API ≠ Admin via UI

Modern ERPs expose admin functions via REST APIs. These need separate, independently controlled permissions.

### API Admin Permission Model

| API Category | API Scope | Requires Separate Auth? | Rate Limit | Audit Level |
|-------------|-----------|------------------------|------------|-------------|
| User Management | `users.write`, `users.read` | Yes — separate API key | 100 req/min | Full (before/after) |
| Role Assignment | `roles.write` | Yes — elevated API key | 30 req/min | Full + Dual Approval |
| Audit Log Read | `audit.read` | Yes — read-only API key | 200 req/min | Event log only |
| Config Write | `config.write` | Yes — separate key + IP locked | 10 req/min | Full + Approval |
| Backup | `backup.write` | Yes — break-glass key | 5 req/min | Full + CEO notify |
| Health Read | `health.read` | No auth required OR basic key | None | None |

### API Key vs. Session Admin

```
┌──────────────────────────────────────────────────────────────────────┐
│ SESSION ADMIN                │ API KEY ADMIN                        │
│──────────────────────────────┼──────────────────────────────────────│
│ Interactive (UI)             │ Automated (script/CI/CD)             │
│ MFA enforced                  │ No MFA (compensated by IP restrict)    │
│ Session recording             │ Action logging only                    │
│ 8-hour session expiry         │ JWT with max 15-min TTL               │
│ Human attribution             │ Service account attribution            │
│ Reduced scope compared to     │ MUST have reduced scope vs session    │
│ full admin                    │ admin                                  │
└──────────────────────────────────────────────────────────────────────┘
```

### Dashboard UI Requirements — API Access

```
┌─────────────────────────────────────────────────────────────────────┐
│ API ACCESS CONTROL                                         [New Key]│
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Active API Keys: 24                 Revoked This Month: 3          │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────────┐│
│  │ KEY NAME             │ SCOPES        │ EXPIRES    │  LAST USED ││
│  ├──────────────────────────────────────────────────────────────────┤│
│  │ deploy-key           │ users.read    │ 2026-12-31 │ 2 min ago  ││
│  │ hr-integration       │ users.read    │ 2026-09-30 │ 15 min ago ││
│  │                      │ users.write   │            │            ││
│  │ audit-export         │ audit.read    │ 2026-08-15 │ 1 hour ago ││
│  │ backup-script        │ backup.write  │ 2026-07-01 │ 3 days ago ││
│  └──────────────────────────────────────────────────────────────────┘│
│                                                                     │
│  ⚠ Key "backup-script" has backup.write but is NOT IP-restricted    │
│  ⚠ Key "legacy-integration" has full access and expires never      │
│                                                                     │
│  [Create API Key]  [Revoke]  [Rotate]  [View Usage Logs]           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### API Key Creation Form

```
┌──────────────────────────────────────────────────────────────────────┐
│ CREATE API KEY                                               [X]    │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ Key Name:       [________________________]                          │
│ Description:    [________________________]                          │
│ Scopes:         ☐ users.read   ☐ users.write                       │
│                 ☐ roles.read   ☐ roles.write                       │
│                 ☐ audit.read   ☐ audit.write (❌ never allowed)    │
│                 ☐ config.read  ☐ config.write                      │
│                 ☐ backup.read  ☐ backup.write                      │
│                 ☐ health.read                                      │
│                                                                      │
│ IP Restriction:  [CIDR: 10.0.0.0/8            ]  (Optional)        │
│ Expiration:      [________________________]  (Max 1 year)          │
│ Rate Limit:      [100]  requests per minute                         │
│                                                                      │
│ ⚠ WARNING: API keys bypass MFA and session recording.               │
│   Grant minimum scopes. Never use "full access" keys.               │
│                                                                      │
│ [GENERATE KEY]  [CANCEL]                                             │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### New SRS Requirements

```
FR-1600 API ACCESS KEY MANAGEMENT
Actor: L1 System Administrator
Description: Create and manage API access keys for programmatic admin access.
Requirements:
  - Granular scopes per key (never "full access")
  - Per-key rate limiting
  - Optional IP whitelist (CIDR notation)
  - Mandatory expiration date (max 1 year)
  - Auto-rotation option (90 days)
  - Instant revocation capability
  - Usage logging: every API call attributed to key name
  - Cannot create keys with audit.write scope (audit is append-only)

FR-1601 API ADMIN PERMISSION HIERARCHY
Actor: System (enforced)
Description: API keys must have equal or lower privileges than the creating admin.
Rules:
  - API key inherits scope from creating admin's role tier
  - API key scope can be subset but never superset of creator's scope
  - L2 Security Admin creating API key → key cannot have L1 (System) scopes
  - Audit event: API_KEY_CREATED, API_KEY_REVOKED, API_KEY_EXPIRED

FR-1602 API AUDIT LOG
Actor: System (automated)
Description: Log all API-based admin actions.
Logged fields:
  - API Key name (not the key itself)
  - Action performed
  - Resource affected
  - Timestamp
  - Source IP
  - Request/response (size-limited)
  - Status (success/failure)
```

---

# COMPLETE DASHBOARD LAYOUT RECOMMENDATION

## Main Admin Dashboard — Suggested Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ 🏠 ADMIN DASHBOARD                                       [⚙ Config]│
├──────────┬──────────────────────────────────────────────────────────┤
│          │                                                        │
│  LEFT    │  MAIN CONTENT                                           │
│  SIDEBAR │                                                        │
│          │  ┌──────┬──────┬──────┬──────┬──────┐                  │
│  📊       │  │L1    │L2    │L3    │L4    │Total │                  │
│  Overview │  │Admin │Admin │Admin │Admin │Admin │                  │
│          │  │  2   │  4   │  5   │  1   │  12  │                  │
│  👥       │  └──────┴──────┴──────┴──────┴──────┘                  │
│  Users   │                                                        │
│          │  ┌──────────────┐  ┌──────────────┐                   │
│  🔐       │  │SoD Violations│  │Pending       │                   │
│  Roles   │  │      3       │  │Certifications│                   │
│          │  └──────────────┘  │      2       │                   │
│  🛡️       │                    └──────────────┘                   │
│  PAM     │                                                        │
│          │  ┌──────────────────────────────────────────────────┐  │
│  📋       │  │🔴 CRITICAL ALERTS                               │  │
│  Access  │  │• Admin "Bob" has SoD violation (Create + Audit) │  │
│  Reviews │  │• 12 service accounts need secret rotation       │  │
│          │  │• Q2 Access Review overdue (due 2026-06-10)      │  │
│  🤖       │  └──────────────────────────────────────────────────┘  │
│  Service │                                                        │
│  Accts   │  ┌──────────────────────────────────────────────────┐  │
│          │  │📈 PRIVILEGE HEALTH SCORE: 78/100                  │  │
│  🏢       │  │  Privilege Creep │ ████████████░░░░░ 0.28      │  │
│  Tenants │  │  Did-Do Match     │ █████████████░░░░ 72%      │  │
│          │  │  Dormant Roles    │ ██████░░░░░░░░░░   14      │  │
│  📄       │  └──────────────────────────────────────────────────┘  │
│  Audit   │                                                        │
│          │  ┌─────────────┬─────────────┬──────────────────────┐  │
│  🔄       │  │RECENT ACTIVITY                                  │  │
│  DR      │  ├─────────────┼─────────────┼──────────────────────┤  │
│          │  │ TIME  │ADMIN  │ ACTION      │ DETAILS            │  │
│  🔑       │  │09:45  │Alice  │ JIT Elevate  │ L2 Admin (30 min) │  │
│  API     │  │09:42  │Bob    │ User Create  │ USR-004513        │  │
│          │  │09:30  │Carol  │ Config Change │ Backup Schedule   │  │
│          │  └─────────────┴─────────────┴──────────────────────┘  │
│          │                                                        │
│          │  [View All Activity]  [Export Dashboard]               │
│          │                                                        │
└──────────┴──────────────────────────────────────────────────────────┘
```

## Sidebar Navigation

```
🏠 Dashboard
├── 👥 User Management
├── 🔐 Role Designer
├── 🛡️ Privileged Access (PAM)
├── 📋 Access Reviews
├── 🤖 Service Accounts
├── 🏢 Tenant Management
├── 📄 Audit Logs & Evidence
├── 🔄 Disaster Recovery
├── 🔑 API Access Control
├── ⚙️ System Settings
└── 📊 Reports
```

---

# APPENDIX: MAPPING TO SUTANA EXISTING SRS

## Which Existing FRs Map to Which Dimensions

| Existing SRS FR | Dimension | Status | Upgrade Needed? |
|----------------|-----------|--------|-----------------|
| FR-001 to FR-015 (User Management) | Dim 1 (Tiered Admin) + Dim 10 (Delegated) | ⚠️ Partial | Add delegated scope, tier validation |
| FR-016 to FR-020 (Role Management) | Dim 6 (Role Architecture) | ⚠️ Partial | Add single/composite split, naming convention |
| FR-021 to FR-025 (System Config) | Dim 1 (L1 Admin) | ⚠️ Partial | Add dual approval for critical config |
| FR-026 to FR-035 (Backup) | Dim 1 (L1 Admin) + Dim 3 (SoD) | ⚠️ Partial | Add SoD: backup exec ≠ restore approval |
| FR-036 to FR-050 (Audit Logging) | Dim 5 (Session Recording) + Dim 12 (Evidence) | ⚠️ Partial | Add session recording, evidence packaging |
| FR-051 to FR-060 (Alert Management) | Dim 2 (PAM) | ⚠️ Partial | Add JIT elevation alerts |
| FR-061 to FR-066 (Health Monitoring) | Dim 14 (DR) | ⚠️ Partial | Add admin coverage, DR test tracking |
| **Missing** | Dim 2 (PAM) | ❌ | Add JIT, ZSP, Break-Glass |
| **Missing** | Dim 4 (Certification) | ❌ | Add quarterly/annual review workflow |
| **Missing** | Dim 7 (Service Accounts) | ❌ | Add NHI lifecycle |
| **Missing** | Dim 8 (Field Security) | ❌ | Add field sensitivity levels |
| **Missing** | Dim 9 (Row Security) | ❌ | Add data access scopes |
| **Missing** | Dim 11 (Multi-Tenant) | ❌ | Add tenant isolation |
| **Missing** | Dim 13 (Vendor Access) | ❌ | Add vendor onboarding workflow |
| **Missing** | Dim 15 (Privilege Creep) | ❌ | Add did-do analysis engine |
| **Missing** | Dim 16 (API Admin) | ❌ | Add API key management |

---

*Generated as reference for Sutana EMS Admin Dashboard redesign — based on ERP industry standards from SAP, Oracle, Microsoft, Delinea, Gartner, SOX, SOC2, ISO 27001, NIST, CrowdStrike, and Obsidian Security.*
