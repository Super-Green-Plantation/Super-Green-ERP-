# Project Summary - Super-Green ERP

## User Role Privileges & Access Control

The system implements Role-Based Access Control (RBAC) to manage visibility and actions across different modules. Access is enforced both in the UI (Sidebar) and at the API level (Server Actions).

### Module Access Matrix

| Module                | ADMIN | HR     | DEV    | BM     | RM     | AGM     | EMPLOYEE 
| :---                  | :---: | :---:  | :---:  | :----: | :----: | :------:| :---: |
| **Dashboard**         | ✅    | ✅    | ✅    | ✅     | ✅     | ✅     | ✅    |
| **Branches**          | ✅    | ✅    | ✅    | ❌     | ✅     | ✅     | ❌    |
| **Employee**          | ✅    | ✅    | ✅    | ✅     | ✅     | ✅     | ❌    |
| **Clients**           | ✅    | ✅    | ✅    | ✅     | ✅     | ✅     | ✅    |
| **Investments**       | ✅    | ✅    | ✅    | ✅     | ✅     | ✅     | ❌    |
| **Financial Plans**   | ✅    | ✅    | ✅    | ✅     | ✅     | ✅     | ✅    |
| **Commissions**       | ✅    | ✅    | ✅    | ✅     | ❌     | ❌     | ❌    |
| **Calculations**      | ✅    | ✅    | ✅    | ✅     | ✅     | ✅     | ✅    |
| **Users**             | ✅    | ✅    | ✅    | ❌     | ❌     | ❌     | ❌    |
| **Profile**           | ✅    | ✅    | ✅    | ✅     | ✅     | ✅     | ✅    |

### Data Access Rules
- **ADMIN / HR / DEV**: Can view and manage all data across all branches.
- **BRANCH_MANAGER**: Can only view data (clients, employees) related to their assigned branch.
- **REGIONAL_MANAGER / AGM**: Can view data for multiple branches assigned to them via the `MemberBranch` junction.
- **EMPLOYEE**: Can only view their own assigned clients and personal dashboard/plans.

---

## Current Features

### 1. Core CRUD Operations
- **Branch Management**: Create, Read, Update, and delete branches.
- **Employee (Member) Management**: Full lifecycle management of employees, including position/rank, branch assignment, and role mapping.
- **Financial Plan Management**: Define investment plans with specific durations and interest rates.
- **Client Management**: Detailed client profiles including personal info, bank details, and legal documentation.
- **Investment Tracking**: Recording and tracking investments linked to clients and financial plans.

### 2. Client Onboarding & Document Management
- **Self-Service Onboarding**: Generate and send secure, token-based links to clients via email.
- **Digital Document Upload**: Clients can upload ID cards (Front/Back) and Payment Slips through a mobile-friendly interface.
- **Signature Pad Integration**: Supports digital signatures for application forms.

### 3. Financial & Yield Engine
- **Projection Calculator**: Real-time calculation of Monthly and Yearly yields for any investment amount based on selected financial plans.
- **Commission System**: Automated calculation of **Personal Commission** and **Upline (ORC) Commission** based on the organizational hierarchy.

### 4. Reporting & PDF Generation
The system generates professional PDF reports for various business needs:
- **Client Proposal/Application Forms**: Dynamic generation from UI data.
- **Investment Receipts**: Official receipts for clients with plan breakdowns.
- **Commission Statements**: Detailed earnings reports for employees.
- **Branch Network Summaries**: High-level reports on branch performance and staff.
- **Employee Lists**: Branch-specific staff reports.
- **Investment Portfolios**: Full record exports for audit and tracking.

### 5. System Administration
- **User Management**: Control system login access, assign roles, and perform password resets.
- **Activity Logging**: (Background) Tracking of CREATE, UPDATE, and DELETE actions for audit trails.
