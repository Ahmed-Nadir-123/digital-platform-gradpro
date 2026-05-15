# UTAS Digital Platform — Single-Level Approval Sub-System

> **Scope**: This document covers all three request types that go through exactly one approval step: **Printing Request**, **Software Installation Request**, and **Risk Report**. Every piece of logic, every schema field, every API endpoint, every UI component, and every data flow is documented here.

---

## 1. Overview

Single-level requests are requests that require one approver/handler to either accept, work on, or reject them. Unlike multi-level types, there is no sequential chain of approvers — one person receives the request, acts on it, and closes it.

| Request Type | DB Collection | Request# Prefix | Assigned To Role |
|---|---|---|---|
| Printing Request | `printing_requests` | `PRT` | `print_officer` (via WorkflowSettings) |
| Software Installation | `installsoftware_requests` | `INS` | `it_staff` (via AssignmentRule) |
| Risk Report | `risk_reports` | `RSK` | `safety_officer` (via WorkflowSettings) |

---

## 2. Database Schemas

### 2.1 Shared Sub-Schemas (used by all three)

#### `approvalHistorySchema` (sub-document, no `_id`)
```
{
  level: Number,
  approverId: ObjectId → users,
  approverName: String,
  approverRole: String,
  action: String,         // "in_progress" | "completed" | "resolved" | "rejected"
  comments: String,
  timestamp: Date
}
```

#### `approvalFlowSchema` (sub-document, no `_id`) — used by Printing and Risk Report
```
{
  approverId: ObjectId → users,
  role: String,           // role name e.g. "print_officer"
  action: String,         // default "Pending"
  comment: String,
  timestamp: Date,
  currentApprover: String // full name snapshot
}
```

---

### 2.2 PrintingRequest — `printing_requests` collection

```javascript
{
  requestNumber: String,   // unique, e.g. "PRT00001"
  requestId: String,       // same as requestNumber (legacy alias)
  requesterId: ObjectId → users,
  requesterName: String,
  departmentRef: ObjectId → departments,
  department: String,
  status: String,          // "pending" | "in_progress" | "completed" | "rejected"
  currentApprovalLevel: Number,  // default 1
  approvalHistory: [approvalHistorySchema],
  assignedTo: ObjectId → users,  // the print_officer handling it
  priority: "low" | "medium" | "high",
  attachments: [String],
  
  // Type-specific fields
  type: String,            // e.g. "Exam", "Certificate", "General"
  requestedDate: Date,
  requiredDate: Date,
  courseName: String,
  courseCode: String,
  examTitle: String,
  orientation: String,     // "Portrait" | "Landscape"
  color: String,           // "Color" | "Black & White"
  stapling: String,
  paperSize: String,       // "A4" | "A3" etc.
  pagesPerExam: Number,
  setsCount: Number,
  totalPages: Number,      // auto-calculated: pagesPerExam * setsCount
  numberOfCertificates: Number,
  certificateType: String,
  eventName: String,
  recipientName: String,
  recipientsListUrl: String,  // uploaded file path
  examFileUrl: String,        // uploaded file path
  certificateFileUrl: String,
  additionalFiles: [String],
  handlerNotes: String,
  printingCompletedAt: Date,
  
  // Workflow fields (populated on creation)
  approvalFlow: [approvalFlowSchema],
  currentStep: Number,     // default 1
  assignedHandler: ObjectId → users,  // same as assignedTo
  
  createdAt: Date,
  updatedAt: Date
}
```

**MongoDB collection name**: `printing_requests`
**Mongoose model name**: `PrintingRequest`

---

### 2.3 InstallSoftwareRequest — `installsoftware_requests` collection

```javascript
{
  requestNumber: String,   // unique, e.g. "INS00001"
  requestId: String,
  requesterId: ObjectId → users,
  requesterName: String,
  departmentRef: ObjectId → departments,
  department: String,
  
  // Type-specific fields
  softwareName: String,    // REQUIRED
  softwareVersion: String,
  licenseType: String,
  installationLocation: String,  // REQUIRED (office/lab/room name)
  machineIdentifier: String,
  operatingSystem: String,
  priority: "low" | "medium" | "high",
  requestedDate: Date,
  preferredInstallationDate: Date,
  description: String,
  attachments: [String],
  
  // Status & handler
  status: String,          // "pending" | "in_progress" | "completed" | "rejected"
  currentApprovalLevel: Number,
  approvalHistory: [approvalHistorySchema],
  assignedTo: ObjectId → users,  // the it_staff handling it
  handlerNotes: String,
  installationCompletedAt: Date,
  
  createdAt: Date,
  updatedAt: Date
}
```

> **Note**: InstallSoftwareRequest does NOT have `approvalFlow` or `currentStep` fields — it uses the legacy `AssignmentRule` system for routing, and `assignedTo` only.

**MongoDB collection name**: `installsoftware_requests`
**Mongoose model name**: `InstallSoftwareRequest`

---

### 2.4 RiskReport — `risk_reports` collection

```javascript
{
  requestNumber: String,   // unique, e.g. "RSK00001"
  requestId: String,
  requesterId: ObjectId → users,
  requesterName: String,
  departmentRef: ObjectId → departments,
  department: String,
  status: String,          // "pending" | "in_progress" | "resolved" | "rejected"
  currentApprovalLevel: Number,
  approvalHistory: [approvalHistorySchema],
  assignedTo: ObjectId → users,
  priority: "low" | "medium" | "high",
  attachments: [String],
  
  // Type-specific fields
  location: String,        // REQUIRED – where the risk/incident occurred
  riskType: String,        // REQUIRED – e.g. "Fire", "Chemical", "Electrical"
  description: String,     // REQUIRED – detailed description
  severity: String,        // "Low" | "Medium" | "High" | "Critical"
  likelihood: String,
  reportedAt: Date,
  incidentDate: Date,
  evidenceFileUrl: String,
  riskAssessment: String,
  mitigationActions: String,
  resolvedBy: ObjectId → users,
  resolvedAt: Date,
  resolutionNotes: String,
  
  // Workflow fields
  approvalFlow: [approvalFlowSchema],
  currentStep: Number,
  assignedHandler: ObjectId → users,
  
  createdAt: Date,
  updatedAt: Date
}
```

**MongoDB collection name**: `risk_reports`
**Mongoose model name**: `RiskReport`

---

## 3. Assignment System

### 3.1 Printing and Risk Report — WorkflowSettings-based

These two use the `WorkflowSettings` collection. The admin configures the workflow from the "Request Routing" admin page.

**WorkflowSettings document for printing/risk_report**:
```javascript
{
  requestType: "printing",    // or "risk_report"
  workflowName: "Printing Workflow",
  isActive: true,
  workflowType: "chain",
  approvalLevels: [
    {
      level: 1,
      roleName: "print_officer",  // or "safety_officer"
      approverId: ObjectId | null,  // null = auto-pick by role; ObjectId = pinned to specific person
      isRequired: true,
      departmentScope: ""
    }
  ],
  handlerGroup: []
}
```

**Assignment logic at request creation (`POST /api/printing`):**
1. Server queries `WorkflowSettings.findOne({ requestType: "printing", isActive: true })`
2. Calls `buildApprovalFlow(levels, requester, departmentRef, departmentName)`
3. `buildApprovalFlow` checks `level.approverId`:
   - If set (pinned): loads that user directly
   - If null: calls `resolveApproverForRole({ roleName: "print_officer", ... })` which does `User.findOne({ roles: "print_officer", isActive: true })`
4. Sets `assignedTo = firstApprover._id`, `assignedHandler = firstApprover._id`
5. Creates `approvalFlow[0]` with the resolved approver data
6. Sends notification to the assigned person

### 3.2 Software Installation — AssignmentRule-based (legacy)

Software installation uses a separate `AssignmentRule` collection:

```javascript
// AssignmentRule schema (collection: assignment_rules)
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

**`applyAssignmentRule` function logic:**
1. Finds rule: `AssignmentRule.findOne({ serviceType: "install_software", isActive: true })`
2. Finds candidates: `User.find({ roles: "it_staff", isActive: true })`
3. Selects handler based on `assignmentMode`:
   - `round_robin`: picks `candidates[roundRobinIndex % candidates.length]`, increments index
   - `least_load`: queries each candidate's open request count, picks lowest
   - `department`: matches candidate to requester's department, fallback to first
   - `manual`: returns `null` (admin manually assigns later)
4. Sets `assignedTo = handler._id`

---

## 4. Request Lifecycle (Status Flow)

```
[Employee submits]
       ↓
  status: "pending"
  assignedTo: <handler>
       ↓
[Handler opens → marks In Progress]
  status: "in_progress"
       ↓
[Handler completes work]
  status: "completed"   ← Printing, Install Software
  status: "resolved"    ← Risk Report only
       ↓              OR
  status: "rejected"    ← at any point
```

**Status transitions allowed per type:**
| From | To | Who |
|---|---|---|
| pending | in_progress | Assigned handler only |
| in_progress | completed/resolved | Assigned handler only |
| pending/in_progress | rejected | Assigned handler only |

---

## 5. Server-Side Logic

### 5.1 `handleSingleLevelStatus` function

This shared helper handles all status updates for single-level types.

```javascript
const handleSingleLevelStatus = async ({
  Model,        // Mongoose model
  requestId,    // request number or _id
  handler,      // req.user (the logged-in handler)
  newStatus,    // "in_progress" | "completed" | "resolved" | "rejected"
  notes,        // optional comment
  requestType   // "printing" | "install_software" | "risk_report"
}) => {
  // 1. Find request by requestNumber or requestId or _id
  const request = await findRequestById(Model, requestId);
  if (!request) return { error: "Request not found." };
  
  // 2. Authorization check: handler must be the assigned person
  if (!request.assignedTo || request.assignedTo.toString() !== handler._id.toString()) {
    return { error: "Not assigned to you." };
  }

  // 3. Push to approvalHistory
  request.approvalHistory.push({
    level: 1,
    approverId: handler._id,
    approverName: handler.fullName,
    approverRole: handler.roles[0] || "handler",
    action: newStatus,
    comments: notes || "",
    timestamp: new Date(),
  });

  // 4. Update status
  request.status = newStatus;

  // 5. If final status, clear assignment
  if (["completed", "resolved", "rejected"].includes(newStatus)) {
    request.assignedTo = null;
    request.assignedHandler = null;
  }

  // 6. Type-specific completion timestamps
  if (requestType === "install_software" && newStatus === "completed") {
    request.installationCompletedAt = new Date();
  }
  if (requestType === "printing" && newStatus === "completed") {
    request.printingCompletedAt = new Date();
  }
  if (requestType === "risk_report" && newStatus === "resolved") {
    request.resolvedBy = handler._id;
    request.resolvedAt = new Date();
  }

  await request.save();
  
  // 7. Notify requester
  await createNotification(request.requesterId, request, requestType, "Your request was updated.", "");
  
  return { request };
};
```

---

## 6. API Endpoints

### 6.1 Printing Request

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/printing` | Bearer JWT | Create printing request (multipart/form-data) |
| GET | `/api/printing/user/:userId` | Bearer JWT | Get all requests by user |
| GET | `/api/printing/assigned/:handlerId` | Bearer JWT | Get pending/in_progress requests assigned to handler |
| GET | `/api/printing/:id` | Bearer JWT | Get single request by number or `_id` |
| PUT | `/api/printing/:id/status` | Bearer JWT | Handler updates status |

**POST `/api/printing` — required fields:**
```
type                 (string)  — e.g. "Exam", "Certificate"
requiredDate         (optional date)
orientation          (optional)
color                (optional)
stapling             (optional)
paperSize            (optional)
pagesPerExam         (optional number)
setsCount            (optional number)
numberOfCertificates (optional number)
certificateType      (optional)
eventName            (optional)
recipientName        (optional)
document             (optional file — PDF/DOC/DOCX, max 10MB)
recipientsList       (optional file — CSV/Excel/PDF/DOC/TXT, max 10MB)
```
Returns: `{ request: PrintingRequest }`

**PUT `/api/printing/:id/status` — body:**
```json
{ "newStatus": "in_progress" | "completed" | "rejected", "notes": "optional comment" }
```
Returns: `{ request: PrintingRequest }`

---

### 6.2 Software Installation

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/install-software` | Bearer JWT | Create install software request |
| GET | `/api/install-software/user/:userId` | Bearer JWT | Get all requests by user |
| GET | `/api/install-software/assigned/:handlerId` | Bearer JWT | Get pending/in_progress assigned to handler |
| GET | `/api/install-software/:id` | Bearer JWT | Get single request |
| PUT | `/api/install-software/:id/status` | Bearer JWT | Handler updates status |

**POST `/api/install-software` — required fields:**
```
softwareName          (string, required)
installationLocation  (string, required)
softwareVersion       (optional)
licenseType           (optional)
machineIdentifier     (optional)
operatingSystem       (optional)
preferredInstallationDate (optional date)
description           (optional)
priority              (optional: low|medium|high)
```
Returns: `{ request: InstallSoftwareRequest }`

**PUT `/api/install-software/:id/status` — body:**
```json
{ "newStatus": "in_progress" | "completed" | "rejected", "notes": "optional" }
```

---

### 6.3 Risk Report

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/risk-reports` | Bearer JWT | Create risk report |
| GET | `/api/risk-reports/user/:userId` | Bearer JWT | Get all by user |
| GET | `/api/risk-reports/assigned/:handlerId` | Bearer JWT | Get pending/in_progress assigned to handler |
| GET | `/api/risk-reports/:id` | Bearer JWT | Get single |
| PUT | `/api/risk-reports/:id/status` | Bearer JWT | Handler updates status |

**POST `/api/risk-reports` — required fields:**
```
location    (string, required)
riskType    (string, required)
description (string, required)
severity    (optional)
likelihood  (optional)
incidentDate (optional date)
category    (optional)
```
Returns: `{ request: RiskReport }`

**PUT `/api/risk-reports/:id/status` — body:**
```json
{ "newStatus": "in_progress" | "resolved" | "rejected", "notes": "optional" }
```
Note: risk report uses `"resolved"` instead of `"completed"`.

---

## 7. Frontend Components

### 7.1 Request Creation

**File**: `client/src/components/employee/DigitalRequests.js`

This mega-component renders all 7 request forms based on `activeForm` state. For single-level types:

- `activeForm === "Printing"` → renders the printing form (includes file upload fields)
- `activeForm === "Software Installation"` → renders software form
- `activeForm === "Risk Report"` → renders risk report form

All forms use **React Hook Form** + **Yup** validation via `client/src/Validations/DigitalRequestValidation.js`.

**Relevant Redux thunks dispatched:**
```javascript
dispatch(createPrintingRequest(formData))   // multipart/form-data
dispatch(createInstallSoftwareRequest(data))
dispatch(createRiskRequest(data))
```

**Defined in**: `client/src/Features/DigitalRequestSlice.js`
- `createPrintingRequest` → POST `/api/printing` with `Content-Type: multipart/form-data`
- `createInstallSoftwareRequest` → POST `/api/install-software`
- `createRiskRequest` → POST `/api/risk-reports`

---

### 7.2 Handler Dashboard

**File**: `client/src/components/handler/HandlerDashboard.js`

Displays all requests currently assigned to the logged-in handler (any role from `HANDLER_ROLES`).

**Data source**: `Redux state.digitalRequests.pendingApprovals`

**How it's populated**: `fetchPendingApprovals(userId)` thunk in `DigitalRequestSlice.js`:
```javascript
// For single-level types, uses /assigned/:userId endpoint
entries.map(([type, cfg]) => {
  if (MULTI_LEVEL_TYPES.includes(type)) {
    return api.get(`${cfg.pending}/${userId}`);
  }
  return api.get(`${cfg.assigned}/${userId}`);  // ← single-level
})
```

**Action buttons per request type:**
- Single-level request selected → shows buttons: **Mark In Progress**, **Complete/Resolve**, **Reject**
- For risk_report: "Complete" becomes "Resolve"

**Approval dispatch logic:**
```javascript
const isSingleLevel = ["installsoftwarerequest", "printingrequest", "riskreport"].includes(
  requestTypeKey
);
const approvalData = isSingleLevel
  ? { newStatus: "in_progress" | "completed" | "resolved" | "rejected", notes: comments }
  : { action: "approved" | "rejected", comments };

dispatch(processApproval({ requestId, requestType, approvalData }))
```

`processApproval` thunk detects single vs multi-level and calls the correct endpoint:
- Single-level → `PUT /api/{endpoint}/:id/status` with `{ newStatus, notes }`
- Multi-level → `PUT /api/{endpoint}/:id/status` with `{ action, comments }`

---

### 7.3 Track Request

**File**: `client/src/components/shared/TrackRequest.js`

Employees can search by request number. Shows full detail panel for each type including:
- Status badge
- Approval history timeline
- All type-specific fields
- Handler notes (for single-level)

---

### 7.4 Printing Request Form

**File**: `client/src/components/employee/PrintRequestForm.js`

Separate component for the more complex printing form:
- Tabs for different printing types (Exam, Certificate, General)
- File upload for document and recipients list
- Sends `multipart/form-data` via Axios

---

## 8. Admin Workflow Configuration (Single-Level)

### 8.1 WorkflowDashboard.js

**File**: `client/src/components/admin/WorkflowDashboard.js`

The "Request Routing" admin page shows 7 cards (one per request type). For single-level types (Printing, Install Software, Risk Report), the card shows "1 step" maximum.

**Configuration modal enforces single-level:**
```javascript
const SINGLE_LEVEL_TYPES = ["printing", "install_software", "risk_report"];

// On modal open: trim loaded steps to max 1
setSteps(isSingleLevel ? loaded.slice(0, 1) : loaded);

// Add step button: hidden when already 1 step exists
{isSingleLevel && steps.length >= 1 ? (
  <p>This type supports a single approver only</p>
) : (
  <Button onClick={addStep}>Add Approver</Button>
)}

// addStep function is also guarded internally:
const addStep = () => {
  setSteps((prev) => {
    if (isSingleLevel && prev.length >= 1) return prev;
    return [...prev, { id: Date.now(), userId: "", role: "" }];
  });
};

// handleSave: hard-caps before saving
const effectiveSteps = isSingleLevel ? steps.slice(0, 1) : steps;
```

### 8.2 Step Row UI

Each step card has two rows:
1. **Row 1**: reorder arrows | step number | **role text input** (with datalist autocomplete) | Pinned/Auto badge | delete
2. **Row 2** (indented): **"Pin to person" dropdown** (filtered to only show users with the typed role)

**Role examples for single-level types:**
- Printing: `print_officer`
- Risk Report: `safety_officer`
- Install Software: configured via AssignmentRule (not WorkflowSettings)

**Badge behavior:**
- No user selected → **"Auto by role"** badge (blue) — server resolves a matching user at submit time
- User selected → **"Pinned"** badge (amber) — server always routes to that specific person

### 8.3 Saving Workflow

`useAdminDashboard.js` → `saveWorkflow(requestType, config)`:
```javascript
// If config has _id → PUT /api/admin/workflow-settings/:id (update existing)
// If no _id → POST /api/admin/workflow-settings (create new)
```

**What gets saved per step:**
```javascript
{
  level: 1,
  roleName: "print_officer",
  approverId: "66abc..." | null,  // null = auto-pick; ObjectId = pinned
  isRequired: true,
  departmentScope: ""
}
```

---

## 9. Notifications

When a single-level request is created and assigned:
```javascript
await createNotification(
  firstApprover._id,
  requestDoc,
  "printing",  // or "install_software" or "risk_report"
  `New printing request assigned: PRT00001`,
  ""  // Arabic message (empty for now)
);
```

When a handler updates status:
```javascript
await createNotification(
  request.requesterId,
  request,
  requestType,
  "Your request was updated.",
  ""
);
```

**Notification schema** (`notifications` collection):
```javascript
{
  userId: ObjectId → users,
  requestId: ObjectId,
  requestType: String,
  requestNumber: String,
  message: String,
  messageAr: String,
  isRead: Boolean,   // default false
  createdAt, updatedAt
}
```

**Notification Bell** (`NotificationBell.js`) polls `GET /api/notifications/:userId` and marks as read.

---

## 10. Role System

Roles relevant to single-level types:

| Role | Type | Who has it |
|---|---|---|
| `print_officer` | Handler | Print room staff |
| `safety_officer` | Handler | Campus safety officer |
| `it_staff` | Handler | IT support staff |
| `staff` | Submitter | Regular employees who can submit requests |
| `admin` | Admin | System administrators |

**How roles are stored**: `User.roles: [String]` — array field.

**How roles are checked server-side:**
```javascript
const normalizedRoles = normalizeRoles(user.roles);
// normalizeRoles handles aliases: "IT Staff" → "it_staff"
```

**Role aliases** (defined in `ROLE_ALIASES`):
```javascript
"it staff" → "it_staff"
"it hod" → "it_hod"
"hoa" → "head_academic"
"financial" → "finance"
"public relations" → "public_relations"
```

---

## 11. File Uploads (Printing Only)

**Multer configuration** for printing:
- Storage: `server/uploads/printing/`
- Max file size: 10 MB
- Accepted for `document` field: `.pdf`, `.doc`, `.docx`
- Accepted for `recipientsList` field: `.csv`, `.xlsx`, `.xls`, `.txt`, `.pdf`, `.doc`, `.docx`
- Filename: `printing_<timestamp>.<ext>`

**Static serving**: `app.use("/uploads", express.static(path.join(__dirname, "uploads")))`

Client accesses uploaded files at: `http://localhost:8080/uploads/printing/<filename>`

---

## 12. Request Number Generation

```javascript
const generateRequestNumber = async (prefix) => {
  const counter = await RequestCounter.findOneAndUpdate(
    { key: prefix },
    { $inc: { value: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  const padded = String(counter.value).padStart(5, "0");
  return `${prefix}${padded}`;
};
```

| Type | Prefix | Example |
|---|---|---|
| Printing | `PRT` | `PRT00001` |
| Install Software | `INS` | `INS00001` |
| Risk Report | `RSK` | `RSK00001` |

Uses `RequestCounter` model (`requestCounters` collection) with atomic `findOneAndUpdate` to prevent race conditions.

---

## 13. Key Design Decisions

1. **Single handler responsibility**: Only the assigned handler can update the request. Server checks `request.assignedTo.toString() === handler._id.toString()`.

2. **WorkflowSettings vs AssignmentRule**: Printing and Risk Report were migrated to WorkflowSettings for consistent admin UI. Install Software still uses the legacy AssignmentRule system (its schema lacks `approvalFlow`/`currentStep` fields).

3. **Pinned vs Auto assignment**: Admin can either let the system auto-pick by role (flexible) or pin a specific person (deterministic). Stored as `approvalLevels[0].approverId`.

4. **Hard single-step cap**: Even if someone crafts a malicious API call to save multiple levels, `handleSave` in the frontend and the `SINGLE_LEVEL_TYPES` check both enforce the 1-step cap.

5. **Status naming difference**: Risk Reports use `"resolved"` as the final positive state (not `"completed"`) to align with safety management terminology.
