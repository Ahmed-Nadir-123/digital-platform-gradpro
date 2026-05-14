# UTAS Digital Requests Portal — Complete System Logic Guide
> **This document is the single source of truth for building the backend, database, and frontend of the UTAS Digital Requests Portal. An AI code assistant must follow this guide exactly.**

---

## 0. System Overview

This is a unified web-based portal for the University of Technology and Applied Sciences (UTAS) that digitizes seven internal service requests across two categories:

### Module A — Multi-Level Approval Services
Requests pass through a sequential chain of approvers. Each approver must approve before the request advances to the next level. Rejection at any level stops the process.

| Service | Approval Chain |
|---|---|
| Purchase Request | Staff → HOD → Finance |
| Transportation Request | Staff → HOD → AVC → Public Relations |
| Food Request | Staff → HOD → AVC → Finance |
| Fund Request | HOD → Head Academic → Dean → Finance |

### Module B — Single-Level Handler Services
Requests are assigned directly to one handler. The handler processes and marks it complete. No chain.

| Service | Handler Role |
|---|---|
| Install Software | IT Staff |
| Printing | Print Officer |
| Risk Report | Safety Officer |

### Technology Stack
- **Backend:** Node.js + Express
- **Database:** MongoDB (with Mongoose ODM)
- **Frontend:** Web application (HTML/CSS/JS or React)
- **Authentication:** JWT (JSON Web Tokens)

---

## 1. Roles in the System

All roles are stored as strings inside the `roles` array of the `users` collection. One user can hold multiple roles.

| Role String | Description |
|---|---|
| `'staff'` | Regular university employee. Can submit all 7 services. |
| `'hod'` | Head of Department. First approver for Purchase, Transportation, Food. Initiator of Fund. |
| `'head_academic'` | Head of Academic Departments. First approver for Fund requests. |
| `'avc'` | Assistant Vice-Chancellor / Dean's Office. L2 approver for Transportation and Food. |
| `'dean'` | Dean. L2 approver for Fund requests. |
| `'finance'` | Finance Officer. Final approver for Purchase, Food, Fund. |
| `'public_relations'` | Public Relations. Final handler for Transportation (arranges vehicle/driver). |
| `'it_staff'` | IT Staff. Handles Install Software requests. |
| `'print_officer'` | Print Officer. Handles Printing requests. |
| `'safety_officer'` | Safety Officer. Handles Risk Report requests. |
| `'admin'` | System Administrator. Full access. Creates users, assigns roles, configures everything. |

---

## 2. Admin — The Master Controller

> **The Admin is the only user who can create accounts, assign roles, configure workflows, and manage the entire system. Nothing works without the admin setting it up first.**

### 2.1 What the Admin Does

1. **Creates all user accounts** — The admin creates every user in the system (staff, HODs, finance officers, IT staff, print officers, safety officers, etc.). Users cannot self-register.
2. **Assigns roles to users** — The admin sets the `roles` array for every user. A user with no role cannot do anything meaningful in the system.
3. **Creates and manages departments** — The admin creates department records and assigns the `headOfDepartment` (HOD) to each department.
4. **Configures workflow settings** — The admin defines the approval chain for all 7 services in the `workflowsettings` collection. This determines how many levels exist and which role approves at each level.
5. **Configures assignment rules** — The admin defines how single-level requests (Install Software, Printing, Risk Report) are automatically assigned to handlers (round-robin, least-load, by department, or manual).
6. **Views system-wide reports and statistics** — Request volumes, average approval times, department activity, handler workloads.
7. **Deactivates or reactivates users** — The admin sets `isActive: false` to disable accounts without deleting data.
8. **Modifies existing workflows** — The admin can change the number of approval levels, swap roles, or add thresholds (e.g., requests above OMR 1000 require Dean approval).

### 2.2 Admin Dashboard Pages

| Page | Purpose | Collections Affected |
|---|---|---|
| User Management | Create, edit, deactivate users and assign roles | `users` |
| Department Management | Create departments, assign HODs | `departments` |
| Workflow Configuration | Define approval levels per service type | `workflowsettings` |
| Assignment Rules | Configure routing for single-level services | `assignment_rules` |
| Reports & Statistics | View analytics and system health | All request collections |

### 2.3 Admin API Endpoints

```
POST   /api/admin/users                    — Create a new user (with roles)
GET    /api/admin/users                    — List all users
PUT    /api/admin/users/:id                — Edit user info or change roles
DELETE /api/admin/users/:id                — Deactivate user (set isActive: false)

POST   /api/admin/departments              — Create department
GET    /api/admin/departments              — List all departments
PUT    /api/admin/departments/:id          — Edit department / change HOD

GET    /api/admin/workflow-settings        — List all workflow configurations
POST   /api/admin/workflow-settings        — Create new workflow (for new service type)
PUT    /api/admin/workflow-settings/:id    — Edit approval levels

GET    /api/admin/assignment-rules         — List all assignment rules
POST   /api/admin/assignment-rules         — Create rule for a service type
PUT    /api/admin/assignment-rules/:id     — Edit assignment mode or target role

GET    /api/admin/reports/overview         — Request counts by type and status
GET    /api/admin/reports/approval-times   — Average time per approval level
GET    /api/admin/reports/by-department    — Volume per department
GET    /api/admin/reports/handler-load     — Pending load per handler
```

---

## 3. Database Collections (11 Total)

### 3.1 `users` — Unified User Collection

**All system users are stored here. One document per person. Roles array controls what they can do.**

```json
{
  "_id": "ObjectId (auto)",
  "email": "String (unique, required) — used for login",
  "password": "String (hashed with bcrypt, required)",
  "fullName": "String (required)",
  "initials": "String",
  "manpowerId": "String (unique, required) — internal employee ID",
  "nationalId": "String (unique, optional)",
  "mobileNumber": "String",
  "officeContactNumber": "String",
  "office": "String — office room/location",
  "department": "ObjectId (ref: departments)",
  "specialization": "String",
  "academicQualification": "String",
  "countryOfIssue": "String",
  "yearOfIssue": "Number",
  "imageUrl": "String — profile photo URL",
  "roles": ["String — e.g. 'staff', 'hod', 'finance', 'it_staff', 'admin'"],
  "isActive": "Boolean (default: true)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

**Key logic:**
- Created exclusively by the Admin
- `email` is used for login (not manpowerId)
- `password` must be hashed (bcrypt) before storing
- `roles` is an array — one user can be `['staff', 'hod']` or `['staff', 'it_staff']`
- `isActive: false` disables login without deleting the account or their request history
- `department` references the `departments` collection — this links which HOD approves their multi-level requests

---

### 3.2 `departments` — Organizational Units

```json
{
  "_id": "ObjectId (auto)",
  "departmentCode": "String (unique, required) — e.g. 'IT', 'CS', 'ADMIN'",
  "departmentName": "String (required) — e.g. 'Information Technology'",
  "description": "String",
  "headOfDepartment": "ObjectId (ref: users) — the HOD of this department",
  "isActive": "Boolean (default: true)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

**Key logic:**
- Created by Admin
- The `headOfDepartment` field is critical — when a staff member submits a Purchase/Transportation/Food request, the system automatically finds the HOD by looking at `departments.headOfDepartment` for the requester's department
- For Fund requests, the HOD is the requester, not the first approver

---

### 3.3 `workflowsettings` — Approval Chain Configuration

**Defines how many approval levels exist for each of the 7 services and which role approves at each level. Configured by Admin. Drives the multi-level routing engine.**

```json
{
  "_id": "ObjectId (auto)",
  "requestType": "String — 'purchase' | 'transportation' | 'food' | 'fund' | 'install_software' | 'printing' | 'risk_report'",
  "workflowName": "String (required) — e.g. 'Purchase Approval Workflow'",
  "isActive": "Boolean (default: true)",
  "approvalLevels": [
    {
      "level": "Number — 1, 2, 3...",
      "roleName": "String — 'hod' | 'finance' | 'avc' | 'dean' | 'head_academic' | 'public_relations' | 'it_staff' | 'print_officer' | 'safety_officer'",
      "isRequired": "Boolean",
      "timeoutDays": "Number — days before overdue notification",
      "minAmount": "Number (optional) — conditional threshold",
      "maxAmount": "Number (optional) — conditional threshold"
    }
  ],
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

**The 7 workflow configurations Admin must create:**

```
Purchase:        [{level:1, roleName:'hod'}, {level:2, roleName:'finance'}]
Transportation:  [{level:1, roleName:'hod'}, {level:2, roleName:'avc'}, {level:3, roleName:'public_relations'}]
Food:            [{level:1, roleName:'hod'}, {level:2, roleName:'avc'}, {level:3, roleName:'finance'}]
Fund:            [{level:1, roleName:'head_academic'}, {level:2, roleName:'dean'}, {level:3, roleName:'finance'}]
Install Software:[{level:1, roleName:'it_staff'}]
Printing:        [{level:1, roleName:'print_officer'}]
Risk Report:     [{level:1, roleName:'safety_officer'}]
```

---

### 3.4 `assignment_rules` — Single-Level Handler Routing

**Defines HOW single-level requests are automatically assigned to handlers. Configured by Admin.**

```json
{
  "_id": "ObjectId (auto)",
  "serviceType": "String — 'install_software' | 'printing' | 'risk_report'",
  "targetRole": "String — 'it_staff' | 'print_officer' | 'safety_officer'",
  "assignmentMode": "String — 'round_robin' | 'least_load' | 'department' | 'manual'",
  "description": "String",
  "isActive": "Boolean (default: true)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

**Assignment mode logic:**
- `round_robin` — Rotate through available handlers in order
- `least_load` — Assign to the handler with the fewest pending requests
- `department` — Assign to a handler in the same department as the requester
- `manual` — Set `assignedTo = null`, admin assigns later

**The 3 rules Admin must create:**
```
{ serviceType: 'install_software', targetRole: 'it_staff',       assignmentMode: 'round_robin' }
{ serviceType: 'printing',         targetRole: 'print_officer',  assignmentMode: 'least_load'  }
{ serviceType: 'risk_report',      targetRole: 'safety_officer', assignmentMode: 'department'  }
```

---

### 3.5 Universal ApprovalRecord (Embedded in All Request Collections)

**Every action taken on any request is recorded as an ApprovalRecord embedded inside the `approvalHistory` array. This is NOT a separate collection — it lives inside each request document.**

```json
{
  "level": "Number — which workflow level this action occurred at",
  "approverId": "ObjectId (ref: users)",
  "approverName": "String — denormalized name for display",
  "approverRole": "String — role at time of action",
  "action": "String — 'approved' | 'rejected' | 'in_progress' | 'completed' | 'resolved' | 'requested_more_info'",
  "comments": "String — free text from approver/handler",
  "timestamp": "Date"
}
```

---

### 3.6 Core Fields — Present in ALL 7 Request Collections

Every request collection contains these exact fields in addition to its own service-specific fields:

```json
{
  "_id": "ObjectId (auto)",
  "requestNumber": "String (unique, auto-generated) — e.g. BUY00001, TRN00001, INS00001",
  "requesterId": "ObjectId (ref: users, required)",
  "requesterName": "String — denormalized from users for display",
  "department": "ObjectId (ref: departments)",
  "status": "String — see per-service status values below",
  "currentApprovalLevel": "Number (default: 1)",
  "approvalHistory": "[Array of ApprovalRecord objects — see Section 3.5]",
  "assignedTo": "ObjectId (ref: users) — current approver or handler",
  "priority": "String — 'low' | 'medium' | 'high'",
  "attachments": ["String (file URLs)"],
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

---

### 3.7 `purchaserequests` Collection

**Service-specific fields (added on top of core fields):**

```json
{
  "itemDescription": "String (required)",
  "quantity": "Number (required)",
  "estimatedCost": "Number (required)",
  "justification": "String (required)",
  "urgency": "String — 'low' | 'medium' | 'high'",
  "expectedDeliveryDate": "Date — filled by final approver (Manager L3)"
}
```

**Status values:** `'pending'`, `'approved'`, `'rejected'`, `'completed'`

**Workflow:** Staff → HOD (L1) → Finance (L2). Final status = `'approved'` (or `'completed'` after delivery).

**requestNumber prefix:** `BUY`

---

### 3.8 `transportationrequests` Collection

**Service-specific fields:**

```json
{
  "tripPurpose": "String (required)",
  "destination": "String (required)",
  "departureDate": "Date (required)",
  "returnDate": "Date",
  "numberOfPassengers": "Number (required)",
  "vehicleType": "String — 'sedan' | 'suv' | 'bus' | 'van'",
  "assignedVehicle": "String — filled by Public Relations after final approval",
  "assignedDriver": "String — filled by Public Relations after final approval"
}
```

**Status values:** `'pending'`, `'approved'`, `'rejected'`, `'completed'`

**Workflow:** Staff → HOD (L1) → AVC (L2) → Public Relations (L3). Public Relations arranges vehicle/driver after being assigned.

**requestNumber prefix:** `TRN`

---

### 3.9 `foodrequests` Collection

**Service-specific fields:**

```json
{
  "eventName": "String (required)",
  "eventDate": "Date (required)",
  "eventLocation": "String (required)",
  "numberOfAttendees": "Number (required)",
  "mealType": "String — 'breakfast' | 'lunch' | 'dinner' | 'snacks'",
  "dietaryRequirements": "String",
  "estimatedBudget": "Number (required)",
  "cateringVendor": "String — filled after Finance approval"
}
```

**Status values:** `'pending'`, `'approved'`, `'rejected'`, `'completed'`

**Workflow:** Staff → HOD (L1) → AVC (L2) → Finance (L3).

**requestNumber prefix:** `FOOD`

---

### 3.10 `fundrequests` Collection

**Note: This request is initiated by HOD, not regular staff.**

**Service-specific fields:**

```json
{
  "fundPurpose": "String (required)",
  "requestedAmount": "Number (required)",
  "currency": "String (default: 'OMR')",
  "justification": "String (required)",
  "budgetCode": "String",
  "paymentMethod": "String — 'bank_transfer' | 'cheque' | 'cash'",
  "beneficiaryName": "String",
  "beneficiaryAccount": "String",
  "disbursementDate": "Date — filled after Finance final approval"
}
```

**Status values:** `'pending'`, `'approved'`, `'rejected'`, `'disbursed'`

**Workflow:** HOD → Head Academic (L1) → Dean (L2) → Finance (L3).

**requestNumber prefix:** `FUND`

---

### 3.11 `installsoftware_requests` Collection

**Service-specific fields:**

```json
{
  "softwareName": "String (required)",
  "softwareVersion": "String",
  "licenseType": "String — e.g. 'site' | 'single-user' | 'open-source'",
  "installationLocation": "String (required) — e.g. 'Lab 3'",
  "machineIdentifier": "String — PC name or asset number",
  "operatingSystem": "String",
  "requestedDate": "Date",
  "preferredInstallationDate": "Date",
  "description": "String",
  "handlerNotes": "String — filled by IT Staff",
  "installationCompletedAt": "Date — filled when status becomes 'completed'"
}
```

**Status values:** `'pending'`, `'in_progress'`, `'completed'`, `'rejected'`

**Routing:** Uses `assignment_rules` — system finds IT Staff user and sets `assignedTo`.

**requestNumber prefix:** `INS`

---

### 3.12 `printing_requests` Collection

**Service-specific fields:**

```json
{
  "type": "String (required) — 'exam' | 'certificate'",
  "requestedDate": "Date",
  "requiredDate": "Date — when printing must be done by",
  "courseName": "String",
  "courseCode": "String",
  "examTitle": "String",
  "orientation": "String — 'single' | 'double'",
  "color": "String — 'black_white' | 'color'",
  "stapling": "String — 'yes' | 'no'",
  "paperSize": "String — 'A4' | 'A3' | 'Letter' | 'Other'",
  "pagesPerExam": "Number",
  "setsCount": "Number",
  "totalPages": "Number",
  "numberOfCertificates": "Number",
  "certificateType": "String",
  "eventName": "String",
  "recipientsListUrl": "String — uploaded file URL",
  "examFileUrl": "String — uploaded exam file URL",
  "certificateFileUrl": "String — uploaded certificate template URL",
  "additionalFiles": ["String (file URLs)"],
  "handlerNotes": "String — filled by Print Officer",
  "printingCompletedAt": "Date — filled when status becomes 'completed'"
}
```

**Status values:** `'pending'`, `'in_progress'`, `'completed'`, `'rejected'`

**Routing:** Uses `assignment_rules` — system finds Print Officer and sets `assignedTo`.

**requestNumber prefix:** `PRT`

---

### 3.13 `risk_reports` Collection

**Service-specific fields:**

```json
{
  "location": "String (required) — where the risk/hazard is",
  "category": "String — 'safety' | 'facility' | 'compliance' | 'other'",
  "riskType": "String — e.g. 'fire hazard' | 'water leak' | 'electrical fault'",
  "description": "String (required)",
  "severity": "String — 'low' | 'medium' | 'high' | 'critical'",
  "likelihood": "String — 'rare' | 'possible' | 'likely'",
  "reportedAt": "Date",
  "incidentDate": "Date",
  "evidenceFileUrl": "String — uploaded photo/document URL",
  "riskAssessment": "String — filled by Safety Officer",
  "mitigationActions": "String — filled by Safety Officer",
  "resolvedBy": "ObjectId (ref: users) — Safety Officer who resolved it",
  "resolvedAt": "Date",
  "resolutionNotes": "String"
}
```

**Status values:** `'pending'`, `'in_progress'`, `'resolved'`, `'rejected'`

**Routing:** Uses `assignment_rules` — system finds Safety Officer and sets `assignedTo`.

**requestNumber prefix:** `RSK`

---

### 3.14 `notifications` Collection

**Stores in-app notifications for all users.**

```json
{
  "_id": "ObjectId (auto)",
  "userId": "ObjectId (ref: users) — the recipient",
  "requestId": "ObjectId — the related request ID",
  "requestType": "String — which collection the request is in",
  "requestNumber": "String — e.g. BUY00001",
  "message": "String — notification text",
  "isRead": "Boolean (default: false)",
  "createdAt": "Date"
}
```

---

## 4. Request Lifecycle / Status Flows

### 4.1 Multi-Level Services (Purchase, Transportation, Food, Fund)

```
[PENDING] ──approve──> [PENDING at L2] ──approve──> [PENDING at L3] ──approve──> [APPROVED / COMPLETED / DISBURSED]
    │                      │                              │
  reject                 reject                         reject
    │                      │                              │
    └──────────────────> [REJECTED] <────────────────────┘
```

**Step-by-step:**
1. User creates request → `status = 'pending'`, `currentApprovalLevel = 1`
2. System finds L1 approver:
   - Purchase/Transportation/Food: HOD = `departments.headOfDepartment` where `department = requester.department`
   - Fund: find user with role `'head_academic'`
3. Set `assignedTo = approver._id`, notify approver
4. Approver logs in, sees request in "Pending Approvals"
5. Approver **Approves**:
   - Append ApprovalRecord: `{level, approverId, approverRole, action:'approved', comments, timestamp}`
   - Check workflow for next level
   - **If next level exists:** `currentApprovalLevel++`, find next approver by role, set `assignedTo`, notify next approver
   - **If no next level:** `status = 'approved'` (or `'completed'`/`'disbursed'`), notify requester
6. Approver **Rejects**:
   - Append ApprovalRecord: `{action:'rejected', comments}`
   - `status = 'rejected'`
   - Notify requester with reason

### 4.2 Single-Level Services (Install Software, Printing, Risk Report)

```
[PENDING] ──start──> [IN_PROGRESS] ──complete──> [COMPLETED / RESOLVED]
    │                                   │
  reject                              reject
    └──────────> [REJECTED] <──────────┘
```

**Step-by-step:**
1. Staff creates request → `status = 'pending'`, `currentApprovalLevel = 1`
2. System queries `assignment_rules` by `serviceType`
3. Gets `targetRole`, applies `assignmentMode` to select handler from `users`
4. Sets `assignedTo = handler._id`, notify handler
5. Handler **Starts**: `status = 'in_progress'`, append ApprovalRecord
6. Handler **Completes**:
   - Install Software / Printing: `status = 'completed'`
   - Risk Report: `status = 'resolved'`
   - Append ApprovalRecord with `handlerNotes`
   - Set completion date field (`installationCompletedAt`, `printingCompletedAt`, `resolvedAt`)
   - Notify requester
7. Handler **Rejects**: `status = 'rejected'`, append ApprovalRecord with reason, notify requester

---

## 5. Backend API Endpoints (All Routes)

### 5.1 Authentication
```
POST   /api/auth/login       — {email, password} → returns JWT token + user object (with roles array)
GET    /api/auth/me           — returns current user from JWT (for frontend role check)
```

### 5.2 Purchase Requests
```
POST   /api/purchase                          — Create (Staff only)
GET    /api/purchase/user/:userId             — My requests (requester)
GET    /api/purchase/pending/:approverId      — Assigned for approval (HOD or Finance)
GET    /api/purchase/:id                      — Full request details + approval history
PUT    /api/purchase/:id/status               — Approve / Reject (approver)
```

### 5.3 Transportation Requests
```
POST   /api/transportation
GET    /api/transportation/user/:userId
GET    /api/transportation/pending/:approverId
GET    /api/transportation/:id
PUT    /api/transportation/:id/status
```

### 5.4 Food Requests
```
POST   /api/food
GET    /api/food/user/:userId
GET    /api/food/pending/:approverId
GET    /api/food/:id
PUT    /api/food/:id/status
```

### 5.5 Fund Requests
```
POST   /api/fund                              — Create (HOD only — check role before allowing)
GET    /api/fund/user/:userId
GET    /api/fund/pending/:approverId
GET    /api/fund/:id
PUT    /api/fund/:id/status
```

### 5.6 Install Software Requests
```
POST   /api/install-software
GET    /api/install-software/user/:userId
GET    /api/install-software/assigned/:handlerId
GET    /api/install-software/:id
PUT    /api/install-software/:id/status
```

### 5.7 Printing Requests
```
POST   /api/printing
GET    /api/printing/user/:userId
GET    /api/printing/assigned/:handlerId
GET    /api/printing/:id
PUT    /api/printing/:id/status
```

### 5.8 Risk Reports
```
POST   /api/risk-reports
GET    /api/risk-reports/user/:userId
GET    /api/risk-reports/assigned/:handlerId
GET    /api/risk-reports/:id
PUT    /api/risk-reports/:id/status
```

### 5.9 Admin Routes
```
POST   /api/admin/users
GET    /api/admin/users
PUT    /api/admin/users/:id
DELETE /api/admin/users/:id                   — Sets isActive: false (do not delete)

POST   /api/admin/departments
GET    /api/admin/departments
PUT    /api/admin/departments/:id

GET    /api/admin/workflow-settings
POST   /api/admin/workflow-settings
PUT    /api/admin/workflow-settings/:id

GET    /api/admin/assignment-rules
POST   /api/admin/assignment-rules
PUT    /api/admin/assignment-rules/:id

GET    /api/admin/reports/overview
GET    /api/admin/reports/approval-times
GET    /api/admin/reports/by-department
GET    /api/admin/reports/handler-load
```

### 5.10 Notifications
```
GET    /api/notifications/:userId             — Get all notifications for user
PUT    /api/notifications/:id/read            — Mark as read
PUT    /api/notifications/read-all/:userId    — Mark all as read
```

---

## 6. Backend Logic (Pseudocode)

### 6.1 createRequest (Unified Logic for All 7 Services)
```
function createRequest(serviceType, requesterId, body):
  1. Verify JWT token — get requesterId
  2. Validate body fields for this serviceType
  3. Look up requester in users → get requesterName and department
  4. Generate requestNumber (format: PREFIX + auto-increment padded to 5 digits)
  5. Determine routing mode:
     IF serviceType IN ['purchase', 'transportation', 'food', 'fund']:
       — Multi-level routing
       workflow = workflowsettings.findOne({ requestType: serviceType, isActive: true })
       level1Role = workflow.approvalLevels[0].roleName
       IF level1Role == 'hod':
         dept = departments.findOne({ _id: requester.department })
         assignedTo = dept.headOfDepartment
       ELSE:
         assignedTo = users.findOne({ roles: { $in: [level1Role] }, isActive: true })._id
     ELSE:
       — Single-level routing
       rule = assignment_rules.findOne({ serviceType: serviceType, isActive: true })
       candidates = users.find({ roles: { $in: [rule.targetRole] }, isActive: true })
       assignedTo = applyAssignmentMode(rule.assignmentMode, candidates, requester.department)
  6. Create request document:
     { ...body, requesterId, requesterName, department: requester.department,
       requestNumber, status: 'pending', currentApprovalLevel: 1,
       approvalHistory: [], assignedTo }
  7. Save to correct collection
  8. Create notification for assignedTo user
  9. Return saved request
```

### 6.2 approveRequest (Multi-Level Only)
```
function approveRequest(serviceType, requestId, approverId, comments):
  1. Load request from collection
  2. Verify request.assignedTo == approverId
  3. Verify approver has the correct role for request.currentApprovalLevel
  4. Append to approvalHistory:
     { level: currentApprovalLevel, approverId, approverName, approverRole, action:'approved', comments, timestamp: now }
  5. Load workflow for this serviceType
  6. nextLevel = workflow.approvalLevels.find(l => l.level == currentApprovalLevel + 1)
  7. IF nextLevel exists:
       currentApprovalLevel++
       IF nextLevel.roleName == 'hod':
         nextApprover = departments.headOfDepartment (for requester's department)
       ELSE:
         nextApprover = users.findOne({ roles: { $in: [nextLevel.roleName] }, isActive: true })
       request.assignedTo = nextApprover._id
       Save request
       Create notification for nextApprover
  8. ELSE (no next level — this is the final approval):
       request.status = (serviceType == 'fund') ? 'disbursed' : 'approved'
       request.assignedTo = null
       Save request
       Create notification for requesterId ("Your request has been fully approved")
```

### 6.3 rejectRequest (Multi-Level and Single-Level)
```
function rejectRequest(requestId, actorId, reason):
  1. Load request
  2. Verify request.assignedTo == actorId
  3. Append to approvalHistory:
     { level: currentApprovalLevel, approverId: actorId, action:'rejected', comments: reason, timestamp: now }
  4. request.status = 'rejected'
  5. Save request
  6. Create notification for requesterId with rejection reason
```

### 6.4 updateHandlerStatus (Single-Level Only)
```
function updateHandlerStatus(requestId, handlerId, newStatus, notes):
  1. Load request
  2. Verify request.assignedTo == handlerId
  3. Append to approvalHistory:
     { level: 1, approverId: handlerId, approverRole: handler's role, action: newStatus, comments: notes, timestamp: now }
  4. request.status = newStatus
  5. IF newStatus == 'completed':
       Set installationCompletedAt or printingCompletedAt = now
  6. IF newStatus == 'resolved':
       resolvedBy = handlerId, resolvedAt = now
  7. Save request
  8. Create notification for requesterId
```

### 6.5 Assignment Mode Logic (Single-Level)
```
function applyAssignmentMode(mode, candidates, requesterDeptId):
  IF mode == 'round_robin':
    return getNextInRotation(candidates, serviceType)
    — Track last assigned index per serviceType in DB or cache
  IF mode == 'least_load':
    for each candidate: load = count(pending requests where assignedTo == candidate._id)
    return candidate with minimum load
  IF mode == 'department':
    return candidates.find(c => c.department == requesterDeptId)
    — Fallback to round_robin if none found in same dept
  IF mode == 'manual':
    return null  — Admin assigns manually
```

---

## 7. Frontend Pages & Role-Based Routing

### 7.1 Login Page (Public — No Auth Required)
- Fields: `email`, `password`
- On submit: POST to `/api/auth/login`
- On success: Store JWT in localStorage, store user object (especially `roles`)
- Redirect based on roles:
  - Has `'admin'` → Admin Dashboard
  - Has `'it_staff'` → IT Handler Dashboard (also shows Staff menu if has `'staff'`)
  - Has `'print_officer'` → Print Handler Dashboard
  - Has `'safety_officer'` → Safety Handler Dashboard
  - Has `'hod'` → HOD Dashboard (also shows Staff menu)
  - Has `'head_academic'` → Head Academic Dashboard
  - Has `'avc'` → AVC Dashboard
  - Has `'dean'` → Dean Dashboard
  - Has `'finance'` → Finance Dashboard
  - Has `'public_relations'` → PR Dashboard
  - Has `'staff'` only → Staff Dashboard
- **Important:** A user with multiple roles sees combined navigation with access to all relevant sections

### 7.2 Staff Dashboard (Role: `staff`)
- Header with user profile info (name, initials, department, photo)
- 7 service cards/buttons: Purchase, Transportation, Food, Fund, Install Software, Printing, Risk Report
  - Fund card is only clickable if user also has `'hod'` role
- "My Requests" table showing all requests from all 7 collections:
  - Columns: Request Number | Service Type | Status (color-coded) | Date | Current Assignee | Action
  - Status colors: Orange = pending/in_progress, Green = approved/completed/resolved, Red = rejected
- "Track" button per row → opens modal with full details + approval history timeline

### 7.3 Request Submission Forms
- **Purchase Form:** itemDescription, quantity, estimatedCost, justification, urgency, attachments
- **Transportation Form:** tripPurpose, destination, departureDate, returnDate, numberOfPassengers, vehicleType
- **Food Form:** eventName, eventDate, eventLocation, numberOfAttendees, mealType, dietaryRequirements, estimatedBudget
- **Fund Form:** fundPurpose, requestedAmount, currency, justification, budgetCode, paymentMethod, beneficiaryName, beneficiaryAccount, attachments
- **Install Software Form:** softwareName, softwareVersion, licenseType, installationLocation, machineIdentifier, operatingSystem, requestedDate, preferredInstallationDate, description, attachments
- **Printing Form:** type (exam/certificate), conditionally show exam fields or certificate fields, formatting options (orientation, color, stapling, paperSize), quantities, requiredDate, file uploads
- **Risk Report Form:** location, category, riskType, severity, likelihood, description, incidentDate, evidenceFileUrl

**After submission:** Show confirmation modal with:
- Generated Request Number
- Status: Pending
- Assigned to: [handler/approver name]

### 7.4 Multi-Level Approver Dashboards (HOD, Head Academic, AVC, Dean, Finance, PR)
Each role sees:
- Table of requests where `assignedTo = currentUser._id` AND `status = 'pending'`
- Columns: Request Number | Service Type | Requester | Department | Date | Priority | Action
- "View Details" button → Modal:
  - Full request information
  - Approval history (if level > 1, shows previous approvers' decisions)
  - Approve button (green) + comment field
  - Reject button (red) + reason field
  - Two-step confirmation before submitting action
- After action: Success notification, request disappears from pending list

### 7.5 Single-Level Handler Dashboards

**IT Handler (Role: `it_staff`):**
- Table of `installsoftware_requests` where `assignedTo = me`
- Filter tabs: All | Pending | In Progress | Completed | Rejected
- "View Details" → Full request info
- Action buttons: Start (→ in_progress) | Complete (→ completed, with notes) | Reject (→ rejected, with reason)

**Print Officer (Role: `print_officer`):**
- Table of `printing_requests` where `assignedTo = me`
- Same layout and actions as IT Handler

**Safety Officer (Role: `safety_officer`):**
- Table of `risk_reports` where `assignedTo = me`
- Complete action becomes "Resolve" (→ resolved) instead of "Complete"
- Extra fields on resolve: riskAssessment, mitigationActions, resolutionNotes

### 7.6 Admin Dashboard (Role: `admin`)

**Users Page:**
- Table of all users with: Name, Email, ManpowerID, Department, Roles (badges), Active Status
- "Add User" button → form with all user fields + roles multi-select
- "Edit" → edit any field, add/remove roles
- "Deactivate" → sets `isActive: false` (does NOT delete)
- Cannot delete users (preserve audit trail)

**Departments Page:**
- Table: Code, Name, Head of Department, Active
- "Add Department" form
- "Edit" → change name, description, or HOD assignment

**Workflow Settings Page:**
- Cards for each of the 7 services
- Each card shows current approval levels as a visual chain
- "Edit" → Add/remove levels, change role at each level, set timeout days, set amount thresholds

**Assignment Rules Page:**
- Table: Service Type, Target Role, Assignment Mode
- "Edit" → Change assignmentMode for a service

**Reports Page:**
- Overview: Total requests by service type (bar chart)
- Status breakdown: Pending vs Completed vs Rejected (pie chart)
- Average approval time per service (bar chart)
- Requests per department (bar chart)
- Handler workload: Pending + In-Progress count per handler (table)

---

## 8. Quick Reference: Complete Service Matrix

| # | Service | Collection | Initiator | Routing | Approval Chain | Status Values | Prefix |
|---|---------|------------|-----------|---------|----------------|---------------|--------|
| 1 | Purchase | `purchaserequests` | Staff | Multi-level | HOD → Finance | pending, approved, rejected, completed | BUY |
| 2 | Transportation | `transportationrequests` | Staff | Multi-level | HOD → AVC → Public Relations | pending, approved, rejected, completed | TRN |
| 3 | Food | `foodrequests` | Staff | Multi-level | HOD → AVC → Finance | pending, approved, rejected, completed | FOOD |
| 4 | Fund | `fundrequests` | HOD only | Multi-level | Head Academic → Dean → Finance | pending, approved, rejected, disbursed | FUND |
| 5 | Install Software | `installsoftware_requests` | Staff | Single-level (assignment_rules) | IT Staff | pending, in_progress, completed, rejected | INS |
| 6 | Printing | `printing_requests` | Staff | Single-level (assignment_rules) | Print Officer | pending, in_progress, completed, rejected | PRT |
| 7 | Risk Report | `risk_reports` | Staff | Single-level (assignment_rules) | Safety Officer | pending, in_progress, resolved, rejected | RSK |

---

## 9. Key Design Rules (Must Follow)

1. **Admin creates all users.** No self-registration. The Admin is the only one with access to create user accounts and assign roles.
2. **Unified users collection.** No separate collections for staff, managers, or IT. One `users` collection with a `roles` array.
3. **approvalHistory is embedded** inside each request document — NOT a separate collection. This allows fetching full request + history in one query.
4. **References, not copies.** `requesterId`, `assignedTo`, `department` are ObjectId references to other collections. Never copy the full user or department object into a request.
5. **Workflows are configuration, not code.** The approval chain is defined in `workflowsettings` in the database. Changing the workflow does NOT require code changes.
6. **Assignment is configuration, not code.** Which handler gets assigned for single-level services is defined in `assignment_rules`. The Admin can change the mode without code changes.
7. **Rejection is terminal.** When a request is rejected at any level, `status = 'rejected'`. It cannot be re-submitted or resumed. The requester must create a new request.
8. **Deactivating users.** Never delete users from the database. Set `isActive: false`. This preserves all approval history and audit trails.
9. **requestNumber is unique per collection and auto-generated.** Format: `PREFIX + 5-digit padded number` (e.g., BUY00001, INS00003).
10. **Fund requests can only be created by users with the `'hod'` role.** The backend must verify this before creating the request.
11. **All approver/handler actions must be verified on the backend.** Never trust the frontend. Always confirm: (a) the actor's JWT is valid, (b) `request.assignedTo == actor._id`, and (c) the actor has the correct role for that action.

---

## 10. Example Complete Flows

### Flow A: Purchase Request (Multi-Level, 2 Levels)
```
1. Staff Jana (roles: ['staff']) → POST /api/purchase
   Body: { itemDescription: 'Laptop', quantity: 2, estimatedCost: 800, justification: '...' }

2. Backend:
   - Creates purchaserequests doc, requestNumber: BUY00005
   - Loads workflowsettings for 'purchase': [{level:1, roleName:'hod'}, {level:2, roleName:'finance'}]
   - Finds Jana's department → headOfDepartment = Dr. Ahmed (hod)
   - Sets assignedTo = DrAhmed._id, status = 'pending', currentApprovalLevel = 1
   - Saves. Notifies Dr. Ahmed.

3. Dr. Ahmed (roles: ['staff','hod']) logs in → GET /api/purchase/pending/DrAhmed._id
   Sees BUY00005. Opens details. Approves.

4. Backend PUT /api/purchase/BUY00005id/status { action:'approved', comments:'Needed for dept.' }
   - Appends ApprovalRecord {level:1, action:'approved', approverRole:'hod'}
   - Next level = {level:2, roleName:'finance'} → find Finance Officer Salim
   - Sets assignedTo = Salim._id, currentApprovalLevel = 2
   - Notifies Salim.

5. Salim (roles: ['finance']) logs in → GET /api/purchase/pending/Salim._id
   Sees BUY00005 with L1 approval history. Approves with expected delivery date.

6. Backend:
   - Appends ApprovalRecord {level:2, action:'approved', approverRole:'finance'}
   - No more levels → status = 'approved'
   - Notifies Jana. Request is complete.
```

### Flow B: Install Software (Single-Level)
```
1. Staff Jana → POST /api/install-software
   Body: { softwareName: 'Photoshop', installationLocation: 'Lab 3', operatingSystem: 'Windows 10' }

2. Backend:
   - Creates installsoftware_requests doc, requestNumber: INS00012
   - Loads assignment_rules for 'install_software': { targetRole:'it_staff', assignmentMode:'round_robin' }
   - Finds IT Staff users, applies round_robin → selects Khalid
   - Sets assignedTo = Khalid._id, status = 'pending', currentApprovalLevel = 1
   - Saves. Notifies Khalid.

3. Khalid (roles: ['it_staff']) logs in → GET /api/install-software/assigned/Khalid._id
   Sees INS00012. Clicks Start.

4. PUT /api/install-software/INS00012id/status { newStatus:'in_progress' }
   - Appends ApprovalRecord {action:'in_progress'}
   - status = 'in_progress'
   - Notifies Jana.

5. Khalid installs software, clicks Complete, adds notes.

6. PUT /api/install-software/INS00012id/status { newStatus:'completed', notes:'Installed successfully on PC Lab3-07' }
   - Appends ApprovalRecord {action:'completed', comments:'Installed successfully on PC Lab3-07'}
   - status = 'completed', installationCompletedAt = now
   - Notifies Jana. Done.
```

### Flow C: Fund Request (Multi-Level, HOD Initiates)
```
1. HOD Dr. Ahmed (roles: ['staff','hod']) → POST /api/fund
   Backend verifies requester has 'hod' role. Allowed.
   Body: { fundPurpose: 'Department Conference', requestedAmount: 2000, currency: 'OMR', ... }

2. Backend:
   - Creates fundrequests doc, requestNumber: FUND00003
   - Loads workflowsettings for 'fund': [{level:1, roleName:'head_academic'}, {level:2, roleName:'dean'}, {level:3, roleName:'finance'}]
   - Finds user with role 'head_academic' → Prof. Khalid
   - Sets assignedTo = Khalid._id, status = 'pending', currentApprovalLevel = 1

3. Prof. Khalid approves → Next: Dean (level 2)
4. Dean approves → Next: Finance (level 3)
5. Finance approves → No more levels → status = 'disbursed', notify Dr. Ahmed.
```

---

*End of System Logic Guide. This document covers all 11 collections, all 7 services, both routing engines (multi-level and single-level), all API endpoints, all frontend pages, admin responsibilities, and key design rules.*