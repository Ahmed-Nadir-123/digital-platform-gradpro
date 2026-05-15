# UTAS Digital Platform — Complete Architecture & Reference

> **Scope**: The complete, authoritative reference for the UTAS Employee Digital Services Portal. Covers every part of the system: architecture, authentication, database models, all 7 request types, all API endpoints, all frontend components, state management, internationalization, admin features, workflow configuration, notifications, file uploads, deployment, and seed data. A developer reading only this file can understand and rebuild the entire system.

---

## 1. System Overview

The UTAS (University of Technology and Applied Sciences) Digital Platform is a MERN-stack employee services portal. Employees submit 7 types of service requests, approvers/handlers process them, and admins configure the approval routing and manage users.

**Technology Stack**:

| Layer | Technology | Version |
|---|---|---|
| Backend Runtime | Node.js (ESM modules) | 18+ |
| Web Framework | Express | 5.1.x |
| ODM | Mongoose | 9.x |
| Database | MongoDB Atlas | latest |
| Password Hashing | bcrypt | 6.x |
| Authentication | jsonwebtoken | 9.x |
| File Uploads | multer | 2.x |
| Rate Limiting | express-rate-limit | 8.x |
| Environment | dotenv | 16.x |
| Dev Server | nodemon | 3.x |
| Frontend Framework | React | 19.x |
| State Management | Redux Toolkit | 2.x |
| Router | React Router | 7.x |
| HTTP Client | Axios | 1.x |
| Form Handling | React Hook Form + Yup | 7.x / 1.x |
| CSS Framework | Tailwind CSS | 3.x |
| Icons | lucide-react | 0.577+ |
| Toasts | react-hot-toast | 2.x |

---

## 2. Project Structure

```
project-root/
├── .github/
│   ├── agents/code-reviewer.agent.md
│   └── copilot-instructions.md
├── server/
│   ├── index.js                    ← All Express routes and business logic (~1750 lines)
│   ├── package.json                ← type: "module" (ESM)
│   ├── seedUsers.js                ← Seeds test users
│   └── Models/
│       ├── User.js
│       ├── Department.js
│       ├── PurchaseRequest.js
│       ├── TransportRequest.js
│       ├── FoodRequest.js
│       ├── FundRequest.js
│       ├── InstallSoftwareRequest.js
│       ├── PrintingRequest.js
│       ├── RiskReport.js
│       ├── WorkflowSettings.js
│       ├── AssignmentRule.js
│       ├── RequestCounter.js
│       ├── Notification.js
│       ├── RoleConfig.js
│       └── (ItStaff.js, Manager.js — legacy, unused)
├── client/
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── src/
│       ├── App.js                  ← Routes: /, /dashboard, /track-request, /digital-requests
│       ├── index.js
│       ├── index.css
│       ├── Store/Store.js
│       ├── Features/
│       │   ├── UserSlice.js
│       │   ├── DigitalRequestSlice.js
│       │   ├── AdminSlice.js
│       │   └── NotificationSlice.js
│       ├── hooks/
│       │   └── useAdminDashboard.js
│       ├── lib/
│       │   ├── api.js              ← Axios instance with JWT interceptor
│       │   ├── LanguageContext.js  ← ar/en toggle + RTL + dark/light theme
│       │   └── utils.js           ← cn() helper for Tailwind
│       ├── Validations/
│       │   └── DigitalRequestValidation.js
│       ├── components/
│       │   ├── auth/AuthPage.js
│       │   ├── layout/Home.js      ← Sidebar shell + profile + dashboard routing
│       │   ├── admin/
│       │   │   ├── AdminDashboard.js
│       │   │   ├── OverviewTab.js
│       │   │   ├── RequestsTab.js
│       │   │   ├── UsersTab.js
│       │   │   ├── WorkflowDashboard.js
│       │   │   ├── adminHelpers.js
│       │   │   └── adminTranslations.js
│       │   ├── employee/
│       │   │   ├── DigitalRequests.js
│       │   │   ├── DigitalRequests.translations.js
│       │   │   └── PrintRequestForm.js
│       │   ├── handler/
│       │   │   └── HandlerDashboard.js
│       │   └── shared/
│       │       ├── HelpDesk.js
│       │       ├── TrackRequest.js
│       │       └── NotificationBell.js
│       └── components/ui/         ← shadcn-style components (do not modify)
│           ├── avatar.js, badge.js, button.js, card.js
│           ├── dialog.js, input.js, label.js, select.js
│           ├── separator.js, sidebar.js, table.js, textarea.js
```

---

## 3. Environment Configuration

### Server `.env` (located at `server/.env`)

```env
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/<dbname>
JWT_SECRET=your_secret_key_here
PORT=8080
```

### Client environment

```env
# src/.env or process.env.REACT_APP_API_URL
REACT_APP_API_URL=http://localhost:8080
```

---

## 4. Run Commands

```bash
# Server (port 8080)
cd server
npm install
npm start          # nodemon index.js

# Client (port 3000)
cd client
npm install
npm start          # react-scripts start
```

---

## 5. Authentication & Authorization

### 5.1 Login Flow

1. Client posts `POST /api/auth/login` with `{ email, password }`
2. Server: `bcrypt.compare(password, user.password)` — 10 salt rounds
3. On success: `jwt.sign({ id: user._id, roles: user.roles }, JWT_SECRET, { expiresIn: "8h" })`
4. Response: `{ token, user: { ...user without password } }`
5. Client stores `token` in `localStorage.token`, `user` in `localStorage.user`

**Rate limiting**: `express-rate-limit` — 10 attempts per 15 minutes per IP.

**Email validation**: Must match `/@utas\.edu\.om$/i` (enforced on user creation, not login).

### 5.2 `requireAuth` Middleware

```javascript
const requireAuth = async (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.replace(/^Bearer\s+/, "");
  if (!token) return res.status(401).json({ message: "No token provided." });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id)
      .populate({ path: "departmentRef", populate: { path: "headOfDepartment" } })
      .select("-password");
    if (!user) return res.status(401).json({ message: "User not found." });
    
    req.user = user;
    req.userRoles = normalizeRoles(user.roles);  // lowercased, alias-mapped
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token." });
  }
};
```

### 5.3 `requireAdmin` Middleware

```javascript
const requireAdmin = (req, res, next) => {
  if (!req.userRoles.includes("admin")) {
    return res.status(403).json({ message: "Admin access required." });
  }
  next();
};
```

### 5.4 Client-side: Axios Interceptor

**File**: `client/src/lib/api.js`

```javascript
// Request interceptor: attach JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor: handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      if (window.location.pathname !== "/") window.location.assign("/");
    }
    return Promise.reject(error);
  }
);
```

**Base URL**: `http://localhost:8080/api`

### 5.5 JWT Payload Structure

```javascript
{
  id: "MongoDB ObjectId string",
  roles: ["staff", "hod"],  // array
  iat: 1234567890,
  exp: 1234596690
}
```

---

## 6. Role System

### 6.1 Built-in Roles

| Role | Description | System |
|---|---|---|
| `admin` | Full platform access | Yes |
| `staff` | Regular employee (submits requests) | Yes |
| `hod` | Head of Department (can submit fund requests, is auto-approver for dept) | No |
| `it_hod` | IT Head of Department | No |
| `it_staff` | IT support (handles install_software) | No |
| `head_academic` | Academic head role | No |
| `avc` | Assistant Vice Chancellor | No |
| `dean` | Dean of a college | No |
| `finance` | Finance officer | No |
| `public_relations` | Public relations officer | No |
| `print_officer` | Printing room staff | No |
| `safety_officer` | Campus safety officer | No |

Roles are seeded on server startup from `DEFAULT_ROLES` array and stored in `RoleConfig` collection.

### 6.2 Role Storage

Roles are stored as a **string array** in `User.roles: [String]`. A user can have multiple roles:
```javascript
{ roles: ["staff", "hod"] }   // HOD who is also a staff member
{ roles: ["admin"] }           // Admin only
{ roles: ["it_staff"] }        // IT handler only
```

### 6.3 Role Aliases

```javascript
const ROLE_ALIASES = {
  "it staff":        "it_staff",
  "it hod":          "it_hod",
  "hoa":             "head_academic",
  "financial":       "finance",
  "public relations":"public_relations",
};
```

### 6.4 Frontend Role Detection (Home.js)

```javascript
const HANDLER_ROLES = ["it_staff", "print_officer", "safety_officer", "head_academic",
                       "hod", "it_hod", "avc", "dean", "finance", "public_relations"];
const isAdmin   = roles.includes("admin");
const isHandler = !isAdmin && roles.some(r => HANDLER_ROLES.includes(r));
const isEmployee = !isAdmin && roles.includes("staff");
```

**Dashboard routing based on role:**
- `isAdmin` → shows AdminDashboard + WorkflowDashboard
- `isHandler` → shows HandlerDashboard
- `isEmployee` → shows DigitalRequests (forms)

---

## 7. Database Schemas (All Models)

### 7.1 User — `users` collection

```javascript
{
  email: String,             // unique, required, @utas.edu.om only
  password: String,          // bcrypt hash, select: false (never returned by default)
  fullName: String,
  initials: String,
  staffId: String,           // employee ID
  manpowerId: String,        // alternate ID
  nationalId: String,
  mobileNumber: String,
  officeContactNumber: String,
  office: String,
  departmentRef: ObjectId → departments,  // populated with headOfDepartment
  specialization: String,
  academicQualification: String,
  countryOfIssue: String,
  yearOfIssue: Number,
  photoUrl: String,          // relative path under uploads/profiles/
  roles: [String],           // array of role names
  isActive: Boolean,         // default true
  createdAt, updatedAt
}
```

### 7.2 Department — `departments` collection

```javascript
{
  departmentCode: String,    // unique, e.g. "IT", "CS", "ENG"
  departmentName: String,
  description: String,
  headOfDepartment: ObjectId → users,  // the HOD user
  isActive: Boolean,
  createdAt, updatedAt
}
```

### 7.3 RequestCounter — `requestCounters` collection

```javascript
{
  key: String,    // unique, e.g. "BUY", "TRN", "FOOD"
  value: Number,  // current counter, incremented atomically
  createdAt, updatedAt
}
```

Used for auto-incrementing request numbers. Atomic operation:
```javascript
RequestCounter.findOneAndUpdate(
  { key: prefix },
  { $inc: { value: 1 } },
  { new: true, upsert: true, setDefaultsOnInsert: true }
)
```

### 7.4 RoleConfig — `roles_config` collection

```javascript
{
  name: String,      // unique lowercase, e.g. "print_officer"
  label: String,     // display label
  isSystem: Boolean, // true for admin/staff
  createdAt, updatedAt
}
```

### 7.5 WorkflowSettings — `workflowsettings` collection

```javascript
{
  requestType: String,  // unique: "purchase"|"transportation"|"food"|"fund"|"install_software"|"printing"|"risk_report"
  workflowName: String,
  isActive: Boolean,
  workflowType: String, // "chain" (only used value currently)
  approvalLevels: [{
    level: Number,
    roleName: String,         // e.g. "hod", "avc", "print_officer"
    approverId: ObjectId,     // null = auto-pick by role, ObjectId = pinned to specific user
    isRequired: Boolean,
    timeoutDays: Number,
    minAmount: Number,
    maxAmount: Number,
    departmentScope: String   // department code for scoped HOD resolution
  }],
  handlerGroup: [{
    handlerId: ObjectId,
    handlerName: String,
    handlerRole: String
  }],
  createdAt, updatedAt
}
```

### 7.6 AssignmentRule — `assignment_rules` collection

```javascript
{
  serviceType: String,       // "install_software"
  targetRole: String,        // "it_staff"
  assignmentMode: String,    // "round_robin" | "least_load" | "department" | "manual"
  description: String,
  isActive: Boolean,
  roundRobinIndex: Number,   // auto-incremented for round_robin mode
  createdAt, updatedAt
}
```

### 7.7 Notification — `notifications` collection

```javascript
{
  userId: ObjectId → users,
  requestId: ObjectId,
  requestType: String,
  requestNumber: String,
  message: String,
  messageAr: String,
  isRead: Boolean,    // default false
  createdAt, updatedAt
}
```

### 7.8 Shared Request Sub-Schemas

All 7 request models use these sub-schemas:

**`approvalHistorySchema`**:
```javascript
{
  level: Number,
  approverId: ObjectId → users,
  approverName: String,
  approverRole: String,
  action: String,
  comments: String,
  timestamp: Date
}
```

**`approvalFlowSchema`**:
```javascript
{
  approverId: ObjectId → users,
  role: String,
  action: String,     // "Pending" | "approved" | "rejected"
  comment: String,
  timestamp: Date,
  currentApprover: String   // name snapshot
}
```

**Common fields on all 7 request models**:
```javascript
requestNumber: String,        // unique, e.g. "BUY00001"
requestId: String,            // same as requestNumber (legacy alias), unique sparse
requesterId: ObjectId → users,
requesterName: String,
departmentRef: ObjectId → departments,
department: String,
status: String,               // default "pending"
currentApprovalLevel: Number, // default 1
approvalHistory: [approvalHistorySchema],
assignedTo: ObjectId → users, // current handler/approver
priority: "low"|"medium"|"high",
attachments: [String],
approvalFlow: [approvalFlowSchema],  // NOT on InstallSoftwareRequest
currentStep: Number,          // default 1, NOT on InstallSoftwareRequest
assignedHandler: ObjectId → users,  // same as assignedTo
createdAt, updatedAt
```

---

## 8. The 7 Request Types — Complete Reference

### 8.1 Request Type Summary

| Type | Model | Collection | Prefix | Workflow System | Final Status |
|---|---|---|---|---|---|
| Purchase | `PurchaseRequest` | `purchaserequests` | `BUY` | WorkflowSettings (multi-level) | approved |
| Transportation | `TransportRequest` | `transportationrequests` | `TRN` | WorkflowSettings (multi-level) | approved |
| Food | `FoodRequest` | `foodrequests` | `FOOD` | WorkflowSettings (multi-level) | approved |
| Fund | `FundRequest` | `fundrequests` | `FUND` | WorkflowSettings (multi-level) | **disbursed** |
| Install Software | `InstallSoftwareRequest` | `installsoftware_requests` | `INS` | AssignmentRule (legacy single) | completed |
| Printing | `PrintingRequest` | `printing_requests` | `PRT` | WorkflowSettings (single-level) | completed |
| Risk Report | `RiskReport` | `risk_reports` | `RSK` | WorkflowSettings (single-level) | **resolved** |

### 8.2 Type-Specific Fields

**Purchase Request** extra fields:
```
itemDescription, quantity, estimatedCost, justification, urgency, requestCategory
```

**Transportation Request** extra fields:
```
tripPurpose (required), destination (required), departureDate (required),
returnDate, numberOfPassengers (required), vehicleType, additionalNotes
```

**Food Request** extra fields:
```
eventName (required), eventDate (required), eventLocation (required),
numberOfAttendees (required), mealType (required),
dietaryRequirements, estimatedBudget, additionalNotes
```

**Fund Request** extra fields:
```
fundPurpose (required), requestedAmount (required), currency (default "OMR"),
justification (required), budgetCode, paymentMethod,
beneficiaryName, beneficiaryAccount, expectedDateNeeded, disbursementDate
```

**Install Software** extra fields (also lacks `approvalFlow`/`currentStep`):
```
softwareName (required), installationLocation (required), softwareVersion,
licenseType, machineIdentifier, operatingSystem,
preferredInstallationDate, description, handlerNotes, installationCompletedAt
```

**Printing Request** extra fields:
```
type, requestedDate, requiredDate, courseName, courseCode, examTitle,
orientation, color, stapling, paperSize, pagesPerExam, setsCount, totalPages,
numberOfCertificates, certificateType, eventName, recipientName,
recipientsListUrl, examFileUrl, certificateFileUrl,
handlerNotes, printingCompletedAt
```

**Risk Report** extra fields:
```
location (required), riskType (required), description (required),
severity, likelihood, reportedAt, incidentDate, evidenceFileUrl,
riskAssessment, mitigationActions, resolvedBy, resolvedAt, resolutionNotes
```

---

## 9. Server Core Functions

### 9.1 `generateRequestNumber(prefix)`

```javascript
const generateRequestNumber = async (prefix) => {
  const counter = await RequestCounter.findOneAndUpdate(
    { key: prefix },
    { $inc: { value: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return `${prefix}${String(counter.value).padStart(5, "0")}`;
};
```

### 9.2 `normalizeRole(role)` and `normalizeRoles(roles)`

```javascript
const normalizeRole = (role) => {
  const lower = (role || "").trim().toLowerCase();
  return ROLE_ALIASES[lower] || lower;
};

const normalizeRoles = (roles) => (roles || []).map(normalizeRole);
```

### 9.3 `resolveRequesterData(userId, departmentRefOverride)`

Loads full user with populated department (including HOD):
```javascript
const user = await User.findById(userId)
  .populate({ path: "departmentRef", populate: { path: "headOfDepartment" } })
  .select("-password");
```

### 9.4 `resolveApproverForRole({ roleName, requester, departmentRef, departmentScope })`

Resolves the actual user for a given role name. Special logic for "hod":
- `departmentScope` → HOD of that specific department
- `roleName === "hod"` → HOD of requester's department (from `Department.headOfDepartment`)
- Other roles → `User.findOne({ roles: normalizedRole, isActive: true })`

### 9.5 `buildApprovalFlow(levels, requester, departmentRef, departmentName)`

Converts `approvalLevels[]` from WorkflowSettings into the resolved `approvalFlow[]` array for a request document. For each level:
1. If `level.approverId` is set and user is active → use that pinned user
2. Else → call `resolveApproverForRole`
3. Throws if no approver found

### 9.6 `createMultiLevelRequest({ Model, requestType, prefix, requesterId, payload })`

Shared factory for Purchase, Transportation, Food, Fund. Steps:
1. Resolve requester + department
2. Load WorkflowSettings
3. Build approvalFlow (throws if config missing)
4. Generate request number
5. Find first approver
6. Create DB document
7. Notify first approver

### 9.7 `approveMultiLevelRequest({ Model, requestId, approver, action, comments, requestType })`

Handles step advancement. Steps:
1. Find request
2. Auth check: `request.assignedTo === approver._id`
3. Role check: approver's role must match current step's roleName
4. Push to approvalHistory
5. Update approvalFlow entry
6. If `rejected` → terminate
7. If last step + approved → final status (`"approved"` or `"disbursed"`)
8. If not last step → advance `currentStep`, assign next approver, notify them
9. On final status → notify requester

### 9.8 `applyAssignmentRule({ serviceType, requester, departmentRef, Model })`

Legacy handler for install_software:
1. Find active `AssignmentRule` for serviceType
2. Find all active users with `targetRole`
3. Select handler by `assignmentMode` (round_robin/least_load/department/manual)
4. Return `{ handler }` (or `null` for manual mode)

### 9.9 `handleSingleLevelStatus({ Model, requestId, handler, newStatus, notes, requestType })`

Shared handler update for Printing, Install Software, Risk Report:
1. Find request
2. Auth check: `request.assignedTo === handler._id`
3. Push to approvalHistory
4. Update status
5. If final → clear `assignedTo` / `assignedHandler`
6. Set completion timestamps (`installationCompletedAt`, `printingCompletedAt`, `resolvedAt`)
7. Notify requester

### 9.10 `createNotification(userId, requestDoc, requestType, message, messageAr)`

```javascript
await Notification.create({
  userId,
  requestId: requestDoc._id,
  requestType,
  requestNumber: requestDoc.requestNumber || requestDoc.requestId,
  message,
  messageAr: messageAr || "",
  isRead: false,
});
```

### 9.11 `findRequestById(Model, id)`

Tries to find a request by:
1. `requestNumber` (primary)
2. `requestId` (alias)
3. MongoDB `_id` (fallback if 24-char hex)

Always populates `requesterId`, `departmentRef`, `assignedTo`.

### 9.12 `mapRequesterName(user)`

Returns `user.fullName || user.personal_name || user.email || "Unknown"`.

---

## 10. All API Endpoints

### Authentication

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | None | Login with email+password |
| GET | `/api/auth/me` | Bearer | Get own profile |

### File Upload

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/upload/profile/:userId` | Bearer | Upload profile photo (5MB, images only) |

### Admin — Users

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/users` | Bearer + Admin | List all users |
| POST | `/api/admin/users` | Bearer + Admin | Create user |
| PUT | `/api/admin/users/:id` | Bearer + Admin | Update user |
| DELETE | `/api/admin/users/:id` | Bearer + Admin | Delete user |

POST/PUT validation: email must be `@utas.edu.om`, `staffId` required.

### Admin — Departments

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/departments` | Bearer + Admin | List all departments |
| POST | `/api/admin/departments` | Bearer + Admin | Create department |
| PUT | `/api/admin/departments/:id` | Bearer + Admin | Update department |

### Admin — Workflow Settings

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/workflow-settings` | Bearer + Admin | Get all workflow configs |
| POST | `/api/admin/workflow-settings` | Bearer + Admin | Create new config |
| PUT | `/api/admin/workflow-settings/:id` | Bearer + Admin | Update existing config |

`PUT` uses `requestType` as unique key (`findOneAndUpdate` upsert on `requestType`).

### Admin — Assignment Rules

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/assignment-rules` | Bearer + Admin | List assignment rules |
| POST | `/api/admin/assignment-rules` | Bearer + Admin | Create rule |
| PUT | `/api/admin/assignment-rules/:id` | Bearer + Admin | Update rule |

### Admin — Roles

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/roles` | Bearer + Admin | List all roles |
| POST | `/api/admin/roles` | Bearer + Admin | Create custom role |
| DELETE | `/api/admin/roles/:id` | Bearer + Admin | Delete non-system role |

### Admin — Stats & Reports

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/stats` | Bearer + Admin | Dashboard stats (all types+statuses, role breakdown, recent) |
| GET | `/api/admin/requests` | Bearer + Admin | All requests from all 7 models |
| DELETE | `/api/admin/requests/:requestId/:requestType` | Bearer + Admin | Delete any request |
| GET | `/api/admin/reports/approval-times` | Bearer + Admin | Avg approval duration (multi-level) |
| GET | `/api/admin/reports/by-department` | Bearer + Admin | Counts by department |
| GET | `/api/admin/reports/handler-load` | Bearer + Admin | Pending counts per handler |

### Purchase Request

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/purchase` | Bearer | Create (multi-level, any employee) |
| GET | `/api/purchase/user/:userId` | Bearer | My requests |
| GET | `/api/purchase/pending/:approverId` | Bearer | Pending approvals for user |
| GET | `/api/purchase/:id` | Bearer | Get by number or _id |
| PUT | `/api/purchase/:id/status` | Bearer | Approve/reject |

### Transportation Request

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/transportation` | Bearer | Create |
| GET | `/api/transportation/user/:userId` | Bearer | My requests |
| GET | `/api/transportation/pending/:approverId` | Bearer | Pending for approver |
| GET | `/api/transportation/:id` | Bearer | Get single |
| PUT | `/api/transportation/:id/status` | Bearer | Approve/reject |

### Food Request

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/food` | Bearer | Create |
| GET | `/api/food/user/:userId` | Bearer | My requests |
| GET | `/api/food/pending/:approverId` | Bearer | Pending for approver |
| GET | `/api/food/:id` | Bearer | Get single |
| PUT | `/api/food/:id/status` | Bearer | Approve/reject |

### Fund Request

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/fund` | Bearer + HOD role | Create (HOD only) |
| GET | `/api/fund/user/:userId` | Bearer | My requests |
| GET | `/api/fund/pending/:approverId` | Bearer | Pending for approver |
| GET | `/api/fund/:id` | Bearer | Get single |
| PUT | `/api/fund/:id/status` | Bearer | Approve/reject |

### Install Software

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/install-software` | Bearer | Create (AssignmentRule routing) |
| GET | `/api/install-software/user/:userId` | Bearer | My requests |
| GET | `/api/install-software/assigned/:handlerId` | Bearer | Assigned to handler |
| GET | `/api/install-software/:id` | Bearer | Get single |
| PUT | `/api/install-software/:id/status` | Bearer | Handler status update |

`PUT` body: `{ newStatus: "in_progress"|"completed"|"rejected", notes }`

### Printing Request

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/printing` | Bearer | Create (multipart/form-data, WorkflowSettings routing) |
| GET | `/api/printing/user/:userId` | Bearer | My requests |
| GET | `/api/printing/assigned/:handlerId` | Bearer | Assigned to handler |
| GET | `/api/printing/:id` | Bearer | Get single |
| PUT | `/api/printing/:id/status` | Bearer | Handler status update |

`PUT` body: `{ newStatus: "in_progress"|"completed"|"rejected", notes }`

### Risk Report

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/risk-reports` | Bearer | Create (WorkflowSettings routing) |
| GET | `/api/risk-reports/user/:userId` | Bearer | My reports |
| GET | `/api/risk-reports/assigned/:handlerId` | Bearer | Assigned to handler |
| GET | `/api/risk-reports/:id` | Bearer | Get single |
| PUT | `/api/risk-reports/:id/status` | Bearer | Handler status update |

`PUT` body: `{ newStatus: "in_progress"|"resolved"|"rejected", notes }`

### Notifications

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/notifications/:userId` | Bearer | Get notifications (last 50) + unread count |
| PUT | `/api/notifications/:id/read` | Bearer | Mark single as read |
| PUT | `/api/notifications/read-all/:userId` | Bearer | Mark all as read |

---

## 11. Frontend — Component Reference

### 11.1 App.js — Route Map

```javascript
<Route path="/"                 element={<AuthPage />} />
<Route path="/dashboard"        element={<Home />} />
<Route path="/track-request"    element={<TrackRequest />} />
<Route path="/digital-requests" element={<DigitalRequests />} />
<Route path="*"                 element={<Navigate to="/" />} />
```

### 11.2 AuthPage.js — Login

`client/src/components/auth/AuthPage.js`
- Simple email + password form
- Dispatches `login({ email, password })` → `UserSlice.login` thunk → `POST /api/auth/login`
- On success: saves `token` + `user` to localStorage, `navigate("/dashboard")`
- Supports ar/en via `useLanguage()`

### 11.3 Home.js — Main Shell

`client/src/components/layout/Home.js`
- Reads `user`, `roles`, `isSuccess` from Redux
- Redirects to `/` if not authenticated
- Detects `isAdmin`, `isHandler`, `isEmployee`
- Sets initial `activeSection`:
  - Handler → `"handler-dashboard"`
  - Admin → `"admin-dashboard"`
  - Employee → `"employee"`
- Renders:
  - **Sidebar** with profile card, navigation links, stats
  - **Header** with language toggle, theme toggle, notification bell, logout
  - **Main content** based on `activeSection`:
    - `"employee"` → `<DigitalRequests />`
    - `"handler-dashboard"` → `<HandlerDashboard />`
    - `"admin-dashboard"` → `<AdminDashboard />`
    - `"workflow-dashboard"` → `<WorkflowDashboard />`
    - `"track-request"` → `<TrackRequest />`
    - `"help-desk"` → `<HelpDesk />`
- Profile card shows: photo, name, staffId, email, department, specialization, HOD name
- Notification clicks: `handleNotifClick` → routes to handler-dashboard (if "New...") or track-request

**Profile photo**: served from `http://localhost:8080/uploads/profiles/<photoUrl>` or defaults to `default_avatar.png`.

**Dark/Light theme**: `useLanguage().theme` toggles `"dark"` class on `document.documentElement`, persisted in `localStorage.theme`.

### 11.4 DigitalRequests.js — Employee Forms

`client/src/components/employee/DigitalRequests.js`

Main form routing component. Uses `activeForm` state to show one of 7 form UIs:
- Purchase Request form
- Transportation Request form
- Food Request form
- Fund Request form (only visible to HOD)
- Software Installation form
- Printing form (delegates to `PrintRequestForm.js`)
- Risk Report form

All forms: React Hook Form + Yup validation from `DigitalRequestValidation.js`.

Translations: `DigitalRequests.translations.js` — both `"en"` and `"ar"` keys.

### 11.5 PrintRequestForm.js

`client/src/components/employee/PrintRequestForm.js`

Handles the more complex printing form with:
- Tabs for printing type (Exam/Certificate/General)
- File upload: `document` field (PDF/DOC/DOCX)
- File upload: `recipientsList` field (lists file)
- Sends `multipart/form-data` via Axios

### 11.6 HandlerDashboard.js

`client/src/components/handler/HandlerDashboard.js`

Displays pending assignments for any handler role.

**Data**: `state.digitalRequests.pendingApprovals` — all requests currently `assignedTo` this user across all 7 types.

**Table columns**: Type badge | Request# | Requester | Date | Status | Actions

**Action modal** with 3 states:
- Single-level type (`installsoftwarerequest`, `printingrequest`, `riskreport`): In Progress, Complete/Resolve, Reject
- Multi-level type: Approve, Reject (requires comment)

**Auto-opens** from notification: `highlightId` prop → matches `requestNumber` → auto-opens modal.

### 11.7 AdminDashboard.js

`client/src/components/admin/AdminDashboard.js`

Tabbed admin interface with:
- **Overview Tab** (`OverviewTab.js`): stats cards, charts, role breakdown
- **Requests Tab** (`RequestsTab.js`): all requests from all 7 types with filter/delete
- **Users Tab** (`UsersTab.js`): user CRUD with photo upload

Data fetched via `useAdminDashboard.js` hook → dispatches `AdminSlice` thunks.

### 11.8 WorkflowDashboard.js

`client/src/components/admin/WorkflowDashboard.js`

Admin routing configuration page. Shows 7 cards (one per type).

**TYPE_META** (one entry per type):
```javascript
{ key: "purchase", label: "Purchase Request", icon: ShoppingCart, color, bg, ... }
{ key: "transportation", ... }
{ key: "food", ... }
{ key: "fund", ... }
{ key: "install_software", ... }
{ key: "printing", ... }
{ key: "risk_report", ... }
```

**Single-level types**: `["printing", "install_software", "risk_report"]` — limited to 1 step.

**WorkflowConfigModal** state:
- `steps[]` — array of `{ id, userId, role }` objects
- `saving` boolean

**Step row** (2-row card design):
1. Row 1: reorder ↑↓ buttons | "Step N" badge | role text input (datalist autocomplete) | Pinned/Auto badge | delete
2. Row 2 (indented): "Pin to person" dropdown filtered by typed role

**Role datalist**: `["hod","avc","finance","dean","head_academic","it_staff","it_hod","public_relations","safety_officer","print_officer","admin"]`

**User dropdown filtering**: users whose `roles[]` contains the typed role (case-insensitive); if role is empty, shows all non-staff users.

**Badges**:
- No userId → "Auto by role" (blue)
- userId set → "Pinned" (amber) + person name shown

**handleSave** constructs `approvalLevels[]` with `approverId` field and calls `saveAdminWorkflow`.

**Live preview** on right side of modal: shows role chips in sequence with arrows.

### 11.9 TrackRequest.js

`client/src/components/shared/TrackRequest.js`

Search by request number. Shows full request details:
- Type-specific fields
- Approval chain / approval flow visualization
- approvalHistory timeline
- Status badge
- Handler notes (single-level)

### 11.10 NotificationBell.js

`client/src/components/shared/NotificationBell.js`

Polling or on-demand fetch of `GET /api/notifications/:userId`. Shows unread badge count. Clicking a notification calls `onNotifClick` (wired in Home.js → routes to appropriate section).

---

## 12. State Management (Redux)

### 12.1 Store Configuration

`client/src/Store/Store.js`
```javascript
configureStore({
  reducer: {
    users: userReducer,          // UserSlice
    digitalRequests: digitalRequestsReducer,  // DigitalRequestSlice
    admin: adminReducer,         // AdminSlice
    notifications: notificationReducer,  // NotificationSlice
  }
})
```

### 12.2 UserSlice — `state.users`

```javascript
{
  user: {},         // loaded from localStorage on startup
  token: "",        // loaded from localStorage
  isLoading: false,
  isSuccess: false, // true when logged in
  isError: false,
  message: ""
}
```

**Thunks**:
- `login({ email, password })` → POST `/api/auth/login` → saves token+user to localStorage
- `logout()` → clears localStorage
- `fetchUserProfile()` → GET `/api/auth/me` → updates user data
- `setUser(payload)` → manual update (used after admin edits)

**Persistence**: Initial state reads from `localStorage.getItem("user")` and `localStorage.getItem("token")`.

### 12.3 DigitalRequestSlice — `state.digitalRequests`

```javascript
{
  pendingApprovals: [],   // for handler: all assigned requests
  myRequests: [],         // for employee: own requests across all types
  currentRequest: null,
  isLoading, isSuccess, isError, message
}
```

**Thunks**:
- `createPurchaseRequest(data)` → POST `/api/purchase`
- `createTransportRequest(data)` → POST `/api/transportation`
- `createFoodRequest(data)` → POST `/api/food`
- `createFundRequest(data)` → POST `/api/fund`
- `createInstallSoftwareRequest(data)` → POST `/api/install-software`
- `createPrintingRequest(data)` → POST `/api/printing` (multipart)
- `createRiskRequest(data)` → POST `/api/risk-reports`
- `fetchMyRequests(userId)` → GET all 7 `/user/:userId` endpoints, merged+sorted
- `fetchPendingApprovals(userId)` → multi-level: `/pending/:userId`; single-level: `/assigned/:userId`
- `processApproval({ requestId, requestType, approvalData })` → PUT status endpoint (auto-detects multi vs single)
- `fetchRequestDetails({ requestId, requestType })` → GET single request

**TYPE_ENDPOINTS map**:
```javascript
{
  purchase:          { create, user, pending, details, approval },
  transportation:    { create, user, pending, details, approval },
  food:              { create, user, pending, details, approval },
  fund:              { create, user, pending, details, approval },
  install_software:  { create, user, assigned, details, approval },
  printing:          { create, user, assigned, details, approval },
  risk_report:       { create, user, assigned, details, approval }
}
```

**`MULTI_LEVEL_TYPES`**:
```javascript
["purchase","PurchaseRequest","transportation","TransportRequest","food","FoodRequest","fund","FundRequest"]
```
Used to determine approval body shape (`action`+`comments` vs `newStatus`+`notes`).

### 12.4 AdminSlice — `state.admin`

Thunks:
- `fetchAdminStats()` → GET `/api/admin/stats`
- `fetchAdminUsers()` → GET `/api/admin/users`
- `createAdminUser(data)` → POST `/api/admin/users`
- `updateAdminUser({ id, data })` → PUT `/api/admin/users/:id`
- `deleteAdminUser(id)` → DELETE `/api/admin/users/:id`
- `uploadAdminUserPhoto({ userId, formData })` → POST `/api/upload/profile/:userId`
- `fetchAdminRequests()` → GET `/api/admin/requests`
- `deleteAdminRequest({ requestId, requestType })` → DELETE `/api/admin/requests/:requestId/:requestType`
- `fetchAdminWorkflows()` → GET `/api/admin/workflow-settings`
- `saveAdminWorkflow(config)` → PUT `/api/admin/workflow-settings/:id` or POST
- `fetchAdminRoles()` → GET `/api/admin/roles`
- `createAdminRole(name)` → POST `/api/admin/roles`
- `deleteAdminRole(id)` → DELETE `/api/admin/roles/:id`
- `fetchAdminDepartments()` → GET `/api/admin/departments`

---

## 13. Internationalization (i18n)

### 13.1 Language Context

`client/src/lib/LanguageContext.js`

```javascript
const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState("ar");  // default Arabic
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";  // RTL/LTR
  }, [lang]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);
};
```

**Default language**: Arabic (`"ar"`) with RTL layout.

**Toggling**: `toggleLang()` switches between `"ar"` and `"en"`. Updates `document.dir`.

**Usage in components**:
```javascript
const { lang } = useLanguage();
const t = (key) => getTranslation(lang, key);
```

### 13.2 Translation Files

- `DigitalRequests.translations.js` — used by most components via `getTranslation(lang, key)`
- `adminTranslations.js` — admin-specific strings
- `WorkflowDashboard.js` — inline `WF_T` object with `en` and `ar` keys
- Each component may have its own local `translations = { en: {...}, ar: {...} }` object

---

## 14. File Uploads (Multer)

### 14.1 Profile Photos

```javascript
storage: diskStorage → server/uploads/profiles/
filename: profile_<userId>_<timestamp>.<ext>
maxFileSize: 5 MB
fileFilter: images only (image/*)
```

Endpoint: `POST /api/upload/profile/:userId`
Returns: `{ photoUrl: "uploads/profiles/filename.jpg" }`
Stored in `User.photoUrl`.
Served at: `http://localhost:8080/uploads/profiles/<filename>`

### 14.2 Printing Documents

```javascript
storage: diskStorage → server/uploads/printing/
filename: printing_<timestamp>.<ext>
maxFileSize: 10 MB per file
fields: [{ name: "document", maxCount: 1 }, { name: "recipientsList", maxCount: 1 }]
fileFilter document: .pdf, .doc, .docx
fileFilter recipientsList: .csv, .xlsx, .xls, .txt, .pdf, .doc, .docx
```

Files stored as paths in `PrintingRequest.examFileUrl`, `PrintingRequest.certificateFileUrl`, `PrintingRequest.recipientsListUrl`.
Served at: `http://localhost:8080/uploads/printing/<filename>`

### 14.3 Static File Serving

```javascript
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
```

---

## 15. Admin Dashboard — Feature Details

### 15.1 Stats Endpoint

`GET /api/admin/stats` returns:
```javascript
{
  userCount: Number,
  requestCounts: {
    purchase: { total, pending, approved, rejected },
    transportation: { ... },
    food: { ... },
    fund: { ... },
    install_software: { ... },
    printing: { ... },
    risk_report: { ... }
  },
  roleBreakdown: [{ _id: "role_name", count: N }],  // aggregate over users.roles
  recentRequests: [...]  // last 10 across all types
}
```

### 15.2 Admin Request Management

`GET /api/admin/requests` — queries all 7 models with `.populate("requesterId")`.

`DELETE /api/admin/requests/:requestId/:requestType` — `requestType` param maps to model:
```javascript
{ purchase: PurchaseRequest, transportation: TransportRequest, ... }
```

### 15.3 Reports

- `GET /api/admin/reports/approval-times` — average time from `createdAt` to final approval for multi-level types
- `GET /api/admin/reports/by-department` — all requests grouped by department
- `GET /api/admin/reports/handler-load` — count of `status: "pending"` per handler for install_software, printing, risk_report

---

## 16. Security

### 16.1 Server Security

- **bcrypt**: 10 salt rounds for password hashing
- **JWT**: 8-hour expiry, `HS256` algorithm, secret from `.env`
- **Rate limiting**: 10 login attempts per 15 min per IP
- **Authorization**: `requireAuth` on all non-login routes; `requireAdmin` on admin routes
- **Assignment auth**: handlers can only update requests `assignedTo` themselves
- **Email validation**: `@utas.edu.om` domain enforced on user creation
- **Role-based route guard**: fund request creation requires `hod` role

### 16.2 File Upload Security

- File type validation by MIME type and extension
- File size limits (5MB profiles, 10MB printing)
- Files stored with timestamp-based names (no user-controlled names)

### 16.3 Client Security

- 401 response → auto-clears localStorage + redirects to login
- Tokens never stored in cookies (localStorage only — acceptable for intranet)
- No sensitive data in URL params

---

## 17. Deployment Notes

### Server

```bash
cd server
# Production: node index.js
# Development: npm start (uses nodemon for auto-restart)
```

The server uses **ESM** (`"type": "module"` in `server/package.json`). All imports use `import` syntax.

### Client

```bash
cd client
npm start     # Development (port 3000, proxies through CRA devserver)
npm run build # Production build → client/build/
```

For production, serve `client/build/` as static files from the Express server or a CDN.

---

## 18. Seed Data

### 18.1 `server/seedUsers.js`

Seed script to create initial test users. Run with:
```bash
node server/seedUsers.js
```

### 18.2 Test Accounts (password: `Password@123`)

| Role | Email | Access |
|---|---|---|
| Admin | admin@utas.edu.om | Full admin access |
| IT HOD | it.hod@utas.edu.om | IT dept HOD, handler access |
| IT Staff 1 | it.staff1@utas.edu.om | Handles install_software |
| Finance Officer | finance.officer@utas.edu.om | Approves finance steps |
| Staff Employee | staff.it@utas.edu.om | Submits requests |

### 18.3 Default Roles Seeding

On server startup, `seedDefaultRoles()` upserts all built-in roles into `roles_config`:
```javascript
const DEFAULT_ROLES = [
  { name: "admin", isSystem: true },
  { name: "staff", isSystem: true },
  { name: "hod", isSystem: false },
  { name: "it_hod", isSystem: false },
  { name: "head_academic", isSystem: false },
  { name: "avc", isSystem: false },
  { name: "dean", isSystem: false },
  { name: "finance", isSystem: false },
  { name: "public_relations", isSystem: false },
  { name: "it_staff", isSystem: false },
  { name: "print_officer", isSystem: false },
  { name: "safety_officer", isSystem: false },
];
```

---

## 19. Server Startup Sequence

1. Load `.env` via `dotenv.config()`
2. Create Express app, configure `cors`, `express.json()`, `express.urlencoded()`
3. Serve `uploads/` as static
4. Register `express-rate-limit` middleware on `/api/auth/login`
5. Define all route handlers
6. Add 404 catch-all handler
7. Connect to MongoDB via `mongoose.connect(MONGODB_URI)`
8. Call `seedDefaultRoles()` after connection
9. `app.listen(PORT)` (default 8080)

---

## 20. Key Architecture Decisions

1. **Single `server/index.js`** — All routes, middleware, and helpers in one file. Chosen for simplicity in a graduate project context.

2. **Two approval systems coexist**:
   - `WorkflowSettings` (chain-based) → Purchase, Transportation, Food, Fund, Printing, Risk Report
   - `AssignmentRule` (round-robin/dept-based) → Install Software (legacy, not migrated)

3. **Approval flow built at submit time** — `approvalFlow[]` is populated when the request is created, not lazily. This creates an immutable snapshot of who should approve.

4. **Pinned approver support** — `approvalLevels[].approverId` lets admin pin a specific person. Falls back to role-based resolution if the pinned user is inactive.

5. **React 19 + Redux Toolkit** — Modern functional component pattern throughout. No class components.

6. **Arabic-first i18n** — Default `lang = "ar"` with RTL. English is the alternate. No i18n library — just translation objects per component.

7. **Single MongoDB database** — All collections in one database. No multi-tenancy.

8. **No TypeScript** — Pure JavaScript (both client and server). Yup provides runtime validation.

9. **Dark mode** via Tailwind `dark:` classes — toggled by adding `"dark"` class to `<html>`.

10. **No separate controller files** — All business logic is inline in route handlers or in helper functions at the top of `server/index.js`.

---

## 21. GitHub Repository

- **Repo**: `https://github.com/Ahmed-Nadir-123/digital-platform-gradpro.git`
- **Branch**: `main`
- **Latest commit**: `3d250a9` — includes all WorkflowDashboard improvements (role text input, pin dropdown, 2-row card layout, single-level enforcement, approverId in schema)
