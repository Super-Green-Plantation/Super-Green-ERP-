# Project Summary - Super-Green ERP

## User Role Privileges & Access Control

The system implements Role-Based Access Control (RBAC) to manage visibility and actions across different modules. Access is enforced both in the UI (Sidebar) and at the API level (Server Actions).

### Module Access Matrix

| Module                | ADMIN | HR     | DEV    | BM     | RM     | ZM     | AGM     | EMPLOYEE 
| :---                  | :---: | :---:  | :---:  | :----: | :----: | :----: | :----:  | :---: |
| **Dashboard**         |     |     |     |      |      |      |      |     |
| **Branches**          |     |     |     | ❌     |      |      |      | ❌    |
| **Employee**          |     |     |     |      |      |      |      | ❌    |
| **Clients**           |     |     |     |      |      |      |      |     |
| **Investments**       |     |     |     |      |      |      |      | ❌    |
| **Financial Plans**   |     |     |     |      |      |      |      |     |
| **Commissions**       |     |     |     |      | ❌     | ❌     | ❌     | ❌    |
| **Profit Tracking**   |     |     |     | ❌     | ❌     | ❌     | ❌     | ❌    |
| **HR & Payroll**      |     |     |     | ❌     | ❌     | ❌     | ❌     | ❌    |
| **Calculations**      |     |     |     |      |      |      |      |     |
| **Users**             |     |     |     | ❌     | ❌     | ❌     | ❌     | ❌    |
| **Profile**           |     |     |     |      |      |      |      |     |

### Data Access Rules
- **ADMIN / HR / DEV**: Full visibility and management autonomy across all system branches.
- **BRANCH_MANAGER**: Restricted to data (clients, employees) within their assigned branch.
- **REGIONAL_MANAGER / ZONAL_MANAGER / AGM**: Access to multiple branches assigned via the `MemberBranch` junction.
- **EMPLOYEE**: Restricted to personal dashboard and self-assigned client portfolios.

---

## Current Features

### 1. Core CRUD Operations
- **Branch Management**: Centralized control over branch lifecycle, including status (Active/Inactive) and location tracking.
- **Employee (Member) Management**: Advanced profile management with position/rank hierarchies, probabilistic branch assignments, and historical record tracking.
- **Financial Plan Management**: Flexible definition of investment durations, interest rates, and return frequencies (Monthly, Half-Yearly, Yearly).
- **Client Management**: Deep profiles including KYC documentation (NIC, DL, Passport), employment details, and unique identifiers.

### 2. Client Onboarding & Document Management
- **Token-Based Self-Service**: secure, time-limited upload links sent directly to clients for remote documentation submission.
- **KYC & Legal Documents**: Automated handling of ID Front/Back images, payment slips, and signed proposals/agreements.
- **Sign-Pad Integration**: Digital signature capture for legally binding enrollment forms.
- **Beneficiary & Nominee Tracking**: Comprehensive capture of legal successors, including relationship types and bank account details for settlement.

### 3. Financial & Yield Engine
- **Projection Calculator**: Dynamic simulation of yields based on Principal amount and selected Tenure.
- **Commission System**: Tiered **Personal Commission** and **Upline (ORC) Commission** calculated automatically using organizational hierarchy and achievement thresholds.
- **Profit Tracking Engine**: Real-time calculation of Net Profit per investment by deducting commission payouts from investment capital.

### 4. HR, Payroll & Performance
- **Evaluation Framework**: Monthly evaluation system for both Probation and Permanent staff. Includes auto-promotion logic after 6 months.
- **Automated Payroll**: Monthly payroll processing including Basic Salary, Incentive Hits (Performance bonuses), Allowance Hits (75% threshold), and total Commission earnings.
- **EPF/ETF Calculations**: Automatic calculation of Employee (8%) and Employer (12% EPF + 3% ETF) statutory contributions.
- **Target Tracking**: Configurable monthly targets per position with excess bonus rates for over-achievement.

### 5. Reporting & PDF Generation
- **Client Artifacts**: Dynamic generation of Life Insurance Proposals, Application Forms, and Investment Receipts.
- **Operational Reports**: Branch network summaries, salary sheets, and commission statements.
- **Audit Tools**: Exportable investment portfolios and employee registries for compliance and auditing.

### 6. System Administration
- **User RBAC Management**: Granular control over system logins, role assignments, and branch linkages.
- **Activity Logging**: Event-driven audit trails for CREATE, UPDATE, DELETE, and APPROVAL/REJECTION actions with metadata capture.

