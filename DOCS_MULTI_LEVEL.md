# UTAS Digital Platform — Multi-Level Approval Sub-System

> **Scope**: This document covers all four request types that go through a configurable sequential chain of approvers: **Purchase Request**, **Transportation Request**, **Food Request**, and **Fund Request**. Every piece of logic, every schema field, every API endpoint, every UI component, and every data flow is documented here.

---

## 1. Overview

Multi-level requests require multiple approvers to sign off sequentially. The chain of approvers is configured by the admin per request type in the `WorkflowSettings` collection. When a request is submitted, the system builds an `approvalFlow[]` array, assigns the first approver, and advances step by step until all levels are satisfied.

| Request Type | DB Collection | Request# Prefix | Special Constraint |
|---|---|---|---|
| Purchase Request | `purchaserequests` | `BUY` | None (any employee) |
| Transportation Request | `transportationrequests` | `TRN` | None |
| Food Request | `foodrequests` | `FOOD` | None |
| Fund Request | `fundrequests` | `FUND` | **HOD only** can submit |

---

## 2. Database Schemas

### 2.1 Shared Sub-Schemas

#### `approvalHistorySchema` (sub-document, no `_id`)
```javascript
{
  level: Number,
  approverId: ObjectId → users,
  approverName: String,
  approverRole: String,
  action: String,     // "approved" | "rejected"
  comments: String,
  timestamp: Date
}
```

#### `approvalFlowSchema` (sub-document, no `_id`)
```javascript
{
  approverId: ObjectId → users,
  role: String,             // role name e.g. "hod", "avc", "finance"
  action: String,           // default "Pending"
  comment: String,
  timestamp: Date,
  currentApprover: String   // full name snapshot at creation time
}
```

---

### 2.2 PurchaseRequest — `purchaserequests` collection

```javascript
{
  requestNumber: String,    // unique, e.g. "BUY00001"
  requestId: String,        // same as requestNumber
  requesterId: ObjectId → users,
  requesterName: String,
  departmentRef: ObjectId → departments,
  department: String,
  status: String,           // "pending" | "approved" | "rejected"
  currentApprovalLevel: Number,  // default 1
  approvalHistory: [approvalHistorySchema],
  assignedTo: ObjectId → users,  // current approver
  priority: "low" | "medium" | "high",
  attachments: [String],
  
  // Type-specific fields
  itemDescription: String,
  quantity: Number,
  estimatedCost: String | Number,
  justification: String,
  urgency: String,          // "low" | "medium" | "high"
  requestCategory: String,  // "Purchase" | "Software" (for purchase sub-type)
  
  // Workflow fields
  approvalFlow: [approvalFlowSchema],
  currentStep: Number,      // default 1
  assignedHandler: ObjectId → users,
  
  createdAt, updatedAt
}
```

**MongoDB collection**: `purchaserequests`
**Mongoose model**: `PurchaseRequest`

---

### 2.3 TransportRequest — `transportationrequests` collection

```javascript
{
  requestNumber: String,    // e.g. "TRN00001"
  requestId: String,
  requesterId: ObjectId → users,
  requesterName: String,
  departmentRef: ObjectId → departments,
  department: String,
  status: String,
  currentApprovalLevel: Number,
  approvalHistory: [approvalHistorySchema],
  assignedTo: ObjectId → users,
  priority: "low" | "medium" | "high",
  attachments: [String],
  
  // Type-specific fields
  tripPurpose: String,      // REQUIRED
  destination: String,      // REQUIRED
  departureDate: Date,      // REQUIRED
  returnDate: Date,
  numberOfPassengers: Number, // REQUIRED
  vehicleType: String,
  additionalNotes: String,
  
  // Workflow fields
  approvalFlow: [approvalFlowSchema],
  currentStep: Number,
  assignedHandler: ObjectId → users,
  
  createdAt, updatedAt
}
```

**MongoDB collection**: `transportationrequests`
**Mongoose model**: `TransportRequest`

---

### 2.4 FoodRequest — `foodrequests` collection

```javascript
{
  requestNumber: String,    // e.g. "FOOD00001"
  requestId: String,
  requesterId: ObjectId → users,
  requesterName: String,
  departmentRef: ObjectId → departments,
  department: String,
  status: String,
  currentApprovalLevel: Number,
  approvalHistory: [approvalHistorySchema],
  assignedTo: ObjectId → users,
  priority: "low" | "medium" | "high",
  attachments: [String],
  
  // Type-specific fields
  eventName: String,        // REQUIRED
  eventDate: Date,          // REQUIRED
  eventLocation: String,    // REQUIRED
  numberOfAttendees: Number, // REQUIRED
  mealType: String,         // REQUIRED
  dietaryRequirements: String,
  estimatedBudget: String | Number,
  additionalNotes: String,
  
  // Workflow fields
  approvalFlow: [approvalFlowSchema],
  currentStep: Number,
  assignedHandler: ObjectId → users,
  
  createdAt, updatedAt
}
```

**MongoDB collection**: `foodrequests`
**Mongoose model**: `FoodRequest`

---

### 2.5 FundRequest — `fundrequests` collection

```javascript
{
  requestNumber: String,    // e.g. "FUND00001"
  requestId: String,
  requesterId: ObjectId → users,
  requesterName: String,
  departmentRef: ObjectId → departments,
  department: String,
  status: String,           // "pending" | "approved" | "disbursed" | "rejected"
  currentApprovalLevel: Number,
  approvalHistory: [approvalHistorySchema],
  assignedTo: ObjectId → users,
  priority: "low" | "medium" | "high",
  attachments: [String],
  
  // Type-specific fields
  fundPurpose: String,      // REQUIRED
  requestedAmount: Number,  // REQUIRED
  currency: String,         // default "OMR"
  justification: String,    // REQUIRED
  budgetCode: String,
  paymentMethod: String,
  beneficiaryName: String,
  beneficiaryAccount: String,
  expectedDateNeeded: Date,
  disbursementDate: Date,   // set when final approval given
  
  // Workflow fields
  approvalFlow: [approvalFlowSchema],
  currentStep: Number,
  assignedHandler: ObjectId → users,
  
  createdAt, updatedAt
}
```

**MongoDB collection**: `fundrequests`
**Mongoose model**: `FundRequest`

> **Special**: Fund requests use `"disbursed"` as the final positive status (not `"approved"`). Only users with role `"hod"` can submit fund requests.

---

## 3. WorkflowSettings — The Chain Configuration

All 4 multi-level types are routed via the `WorkflowSettings` collection.

```javascript
// workflowsettings collection
{
  requestType: String,       // "purchase" | "transportation" | "food" | "fund"
  workflowName: String,
  isActive: Boolean,
  workflowType: "chain",     // always chain for multi-level
  approvalLevels: [
    {
      level: Number,          // 1, 2, 3, ...
      roleName: String,       // e.g. "hod", "avc", "finance", "dean"
      approverId: ObjectId | null,  // null = auto-pick; ObjectId = pinned person
      isRequired: Boolean,
      timeoutDays: Number,
      minAmount: Number,
      maxAmount: Number,
      departmentScope: String  // e.g. department code for HOD resolution
    }
  ],
  handlerGroup: [],           // unused for chain mode
  createdAt, updatedAt
}
```

**Example: 3-level purchase workflow:**
```json
{
  "requestType": "purchase",
  "workflowType": "chain",
  "approvalLevels": [
    { "level": 1, "roleName": "hod",     "approverId": null },
    { "level": 2, "roleName": "finance", "approverId": "66abc...pinned" },
    { "level": 3, "roleName": "avc",     "approverId": null }
  ]
}
```

---

## 4. Server-Side Core Functions

### 4.1 `normalizeRole(role)` — Role Normalization

```javascript
const ROLE_ALIASES = {
  "it staff": "it_staff",
  "it hod": "it_hod",
  "hoa": "head_academic",
  "financial": "finance",
  "public relations": "public_relations",
};

const normalizeRole = (role) => {
  const lower = (role || "").trim().toLowerCase();
  return ROLE_ALIASES[lower] || lower;
};
```

---

### 4.2 `resolveApproverForRole({ roleName, requester, departmentRef, departmentName, departmentScope })`

Finds the correct approver for a given role name. Called during `buildApprovalFlow`.

```javascript
const resolveApproverForRole = async ({ roleName, requester, departmentRef, departmentScope }) => {
  const normalizedRole = normalizeRole(roleName);

  // Case 1: departmentScope set → find HOD of that specific department
  if (departmentScope) {
    const dept = await Department.findOne({ departmentCode: departmentScope });
    if (dept?.headOfDepartment) {
      return User.findById(dept.headOfDepartment).select("-password");
    }
  }

  // Case 2: role is "hod" → find HOD of the *requester's* department
  if (normalizedRole === "hod") {
    const dept = await Department.findById(departmentRef).populate("headOfDepartment");
    if (dept?.headOfDepartment) {
      return dept.headOfDepartment;
    }
    // fallback: find any user with role "hod"
    return User.findOne({ roles: "hod", isActive: true }).select("-password");
  }

  // Case 3: any other role → find active user with that role
  return User.findOne({ roles: normalizedRole, isActive: true }).select("-password");
};
```

**HOD Resolution Detail**: For `roleName: "hod"`, the server looks up `Department.headOfDepartment` for the requester's department. This is dynamic — the actual HOD is whoever is set as `headOfDepartment` in the Department document at submit time.

---

### 4.3 `buildApprovalFlow(levels, requester, departmentRef, departmentName)`

Converts the `approvalLevels[]` array from WorkflowSettings into a fully-resolved `approvalFlow[]` for the request document.

```javascript
const buildApprovalFlow = async (levels, requester, departmentRef, departmentName) => {
  const flow = [];
  
  for (const level of levels) {
    // Pinned approver: use directly
    if (level.approverId) {
      const pinned = await User.findById(level.approverId).select("-password");
      if (pinned && pinned.isActive !== false) {
        flow.push({
          approverId: pinned._id,
          role: level.roleName,
          action: "Pending",
          comment: "",
          timestamp: null,
          currentApprover: pinned.fullName || ""
        });
        continue;
      }
      // If pinned user not found/inactive, fall through to role resolution
    }
    
    // Auto-resolve by role
    const approver = await resolveApproverForRole({
      roleName: level.roleName,
      requester,
      departmentRef,
      departmentName,
      departmentScope: level.departmentScope || ""
    });
    
    if (!approver) {
      throw new Error(`No approver found for role: ${level.roleName}`);
    }
    
    flow.push({
      approverId: approver._id,
      role: level.roleName,
      action: "Pending",
      comment: "",
      timestamp: null,
      currentApprover: approver.fullName || ""
    });
  }
  
  return flow;
};
```

**Error**: If no approver found for a level, throws → request creation fails with 400 + message.

---

### 4.4 `createMultiLevelRequest({ Model, requestType, prefix, requesterId, payload })`

Shared factory for creating all 4 multi-level requests.

```javascript
const createMultiLevelRequest = async ({ Model, requestType, prefix, requesterId, payload }) => {
  // 1. Resolve requester data
  const resolved = await resolveRequesterData(requesterId, payload.departmentRef);
  if (!resolved) return { error: "Requester not found." };
  const { requester, departmentRef, departmentName } = resolved;

  // 2. Load workflow config
  const workflow = await WorkflowSettings.findOne({ requestType, isActive: true });
  if (!workflow || !workflow.approvalLevels?.length) {
    return { error: `${requestType} workflow not configured.` };
  }

  // 3. Build approval flow
  const levels = [...workflow.approvalLevels].sort((a, b) => a.level - b.level);
  let approvalFlow;
  try {
    approvalFlow = await buildApprovalFlow(levels, requester, departmentRef, departmentName);
  } catch (err) {
    return { error: err.message };
  }

  // 4. Generate request number
  const requestNumber = await generateRequestNumber(prefix);

  // 5. Find first approver
  const firstApprover = approvalFlow[0]?.approverId
    ? await User.findById(approvalFlow[0].approverId).select("-password")
    : null;

  // 6. Create document
  const requestDoc = await Model.create({
    requestNumber,
    requestId: requestNumber,
    requesterId: requester._id,
    requesterName: requester.fullName,
    departmentRef,
    department: departmentName,
    ...payload,
    status: "pending",
    approvalFlow,
    currentStep: 1,
    assignedTo: firstApprover?._id || null,
    assignedHandler: firstApprover?._id || null,
  });

  // 7. Notify first approver
  if (firstApprover) {
    await createNotification(
      firstApprover._id,
      requestDoc,
      requestType,
      `New ${requestType} request: ${requestNumber}`,
      ""
    );
  }

  return { request: requestDoc };
};
```

---

### 4.5 `approveMultiLevelRequest({ Model, requestId, approver, action, comments, requestType })`

Handles the approval or rejection at each step.

```javascript
const approveMultiLevelRequest = async ({
  Model, requestId, approver, action, comments, requestType
}) => {
  // 1. Find request
  const request = await findRequestById(Model, requestId);
  if (!request) return { error: "Request not found." };

  // 2. Authorization: assigned approver must match
  if (!request.assignedTo || request.assignedTo.toString() !== approver._id.toString()) {
    return { error: "Not assigned to you." };
  }

  // 3. Optional role check: current step's role must be in approver's roles
  const currentFlowStep = request.approvalFlow[request.currentStep - 1];
  if (currentFlowStep?.role) {
    const requiredRole = normalizeRole(currentFlowStep.role);
    const approverRoles = normalizeRoles(approver.roles);
    if (!approverRoles.includes(requiredRole) && !approverRoles.includes("admin")) {
      return { error: "You do not have the required role for this step." };
    }
  }

  const isFinalStep = request.currentStep >= request.approvalFlow.length;

  // 4. Record in approvalHistory
  request.approvalHistory.push({
    level: request.currentStep,
    approverId: approver._id,
    approverName: approver.fullName,
    approverRole: approver.roles[0] || "",
    action,
    comments: comments || "",
    timestamp: new Date(),
  });

  // 5. Update approvalFlow entry
  if (request.approvalFlow[request.currentStep - 1]) {
    request.approvalFlow[request.currentStep - 1].action = action;
    request.approvalFlow[request.currentStep - 1].comment = comments || "";
    request.approvalFlow[request.currentStep - 1].timestamp = new Date();
  }

  if (action === "rejected") {
    // Reject: terminate immediately
    request.status = "rejected";
    request.assignedTo = null;
    request.assignedHandler = null;
  } else if (isFinalStep) {
    // Last level approved: set final status
    request.status = requestType === "fund" ? "disbursed" : "approved";
    request.assignedTo = null;
    request.assignedHandler = null;
    if (requestType === "fund") {
      request.disbursementDate = new Date();
    }
  } else {
    // Advance to next step
    request.currentStep += 1;
    const nextFlowEntry = request.approvalFlow[request.currentStep - 1];
    
    if (nextFlowEntry?.approverId) {
      // Load next approver
      const nextApprover = await User.findById(nextFlowEntry.approverId).select("-password");
      if (nextApprover) {
        request.assignedTo = nextApprover._id;
        request.assignedHandler = nextApprover._id;
        
        await createNotification(
          nextApprover._id,
          request,
          requestType,
          `Request ${request.requestNumber} needs your approval`,
          ""
        );
      }
    }
  }

  await request.save();
  
  // Notify requester of final outcome
  if (["approved", "disbursed", "rejected"].includes(request.status)) {
    await createNotification(
      request.requesterId,
      request,
      requestType,
      `Your ${requestType} request was ${request.status}`,
      ""
    );
  }

  return { request };
};
```

---

## 5. API Endpoints

### 5.1 Purchase Request

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/purchase` | Bearer JWT | Create purchase request |
| GET | `/api/purchase/user/:userId` | Bearer JWT | All requests by user |
| GET | `/api/purchase/pending/:approverId` | Bearer JWT | Pending requests assigned to approver |
| GET | `/api/purchase/:id` | Bearer JWT | Get single request |
| PUT | `/api/purchase/:id/status` | Bearer JWT | Approve or reject |

**POST `/api/purchase` — required fields:**
```
itemDescription   (string, required) — also accepts: itemName, items
quantity          (number, required)
estimatedCost     (string/number, required) — also accepts: estimatedBudget
justification     (string, required) — also accepts: additionalNotes
urgency           (optional: low|medium|high)
requestCategory   (optional: "Purchase" | "Software")
```

**PUT `/api/purchase/:id/status` — body:**
```json
{ "action": "approved" | "rejected", "comments": "optional" }
```

---

### 5.2 Transportation Request

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/transportation` | Bearer JWT | Create transport request |
| GET | `/api/transportation/user/:userId` | Bearer JWT | All by user |
| GET | `/api/transportation/pending/:approverId` | Bearer JWT | Pending for approver |
| GET | `/api/transportation/:id` | Bearer JWT | Get single |
| PUT | `/api/transportation/:id/status` | Bearer JWT | Approve or reject |

**POST `/api/transportation` — required fields:**
```
tripPurpose         (string, required) — also accepts: purpose
destination         (string, required)
departureDate       (date, required)
numberOfPassengers  (number, required)
returnDate          (optional date)
vehicleType         (optional)
additionalNotes     (optional)
```

---

### 5.3 Food Request

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/food` | Bearer JWT | Create food request |
| GET | `/api/food/user/:userId` | Bearer JWT | All by user |
| GET | `/api/food/pending/:approverId` | Bearer JWT | Pending for approver |
| GET | `/api/food/:id` | Bearer JWT | Get single |
| PUT | `/api/food/:id/status` | Bearer JWT | Approve or reject |

**POST `/api/food` — required fields:**
```
eventName           (required) — also accepts: occasionName
eventDate           (required)
eventLocation       (required) — also accepts: location
numberOfAttendees   (required) — also accepts: numberOfPersons
mealType            (required)
dietaryRequirements (optional)
estimatedBudget     (optional)
additionalNotes     (optional)
```

---

### 5.4 Fund Request

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/fund` | Bearer JWT | Create fund request (**HOD only**) |
| GET | `/api/fund/user/:userId` | Bearer JWT | All by user |
| GET | `/api/fund/pending/:approverId` | Bearer JWT | Pending for approver |
| GET | `/api/fund/:id` | Bearer JWT | Get single |
| PUT | `/api/fund/:id/status` | Bearer JWT | Approve or reject |

**POST `/api/fund` — HOD guard:**
```javascript
if (!requireRole(req.userRoles, "hod")) {
  return res.status(403).json({ message: "Only HOD can create fund requests." });
}
```

**POST `/api/fund` — required fields:**
```
fundPurpose       (required) — also accepts: purposeTitle
requestedAmount   (required) — also accepts: amountRequested
justification     (required)
currency          (optional, default "OMR")
budgetCode        (optional)
paymentMethod     (optional)
beneficiaryName   (optional)
beneficiaryAccount (optional)
expectedDateNeeded (optional date)
```

**PUT `/api/fund/:id/status` — body:**
```json
{ "action": "approved" | "rejected", "comments": "optional" }
```
Final approval sets `status = "disbursed"` (not `"approved"`).

---

## 6. Multi-Step State Machine

### State Transitions

```
[Create] → status: "pending", currentStep: 1, assignedTo: step1_approver
    ↓
[Step 1 Approves] → currentStep: 2, assignedTo: step2_approver, notify step2
    ↓
[Step 2 Approves] → currentStep: 3, assignedTo: step3_approver, notify step3
    ↓
[Last Step Approves] → status: "approved" (or "disbursed" for fund), assignedTo: null
    
[Any Step Rejects] → status: "rejected", assignedTo: null
```

### Visual Example: 3-Level Purchase Request

```
Level 1: HOD (auto-resolved from requester's dept)
  → Approves
Level 2: Finance Officer (pinned to specific person)
  → Approves
Level 3: AVC (auto-resolved, first active AVC in system)
  → Approves
RESULT: status = "approved"
```

### `approvalFlow` array example after Level 1 approval:
```json
[
  {
    "approverId": "66abc001",
    "role": "hod",
    "action": "approved",
    "comment": "Looks good",
    "timestamp": "2025-01-15T10:30:00Z",
    "currentApprover": "Dr. Ahmed Al-Rashid"
  },
  {
    "approverId": "66abc002",
    "role": "finance",
    "action": "Pending",
    "comment": "",
    "timestamp": null,
    "currentApprover": "Fatima Al-Balushi"
  },
  {
    "approverId": "66abc003",
    "role": "avc",
    "action": "Pending",
    "comment": "",
    "timestamp": null,
    "currentApprover": "Prof. Salim Al-Harthi"
  }
]
```

---

## 7. Frontend Components

### 7.1 Request Creation

**File**: `client/src/components/employee/DigitalRequests.js`

The main form component dispatches different thunks based on `activeForm`:
- `"Purchase"` → `dispatch(createPurchaseRequest(data))`
- `"Transportation"` → `dispatch(createTransportRequest(data))`
- `"Food"` → `dispatch(createFoodRequest(data))`
- `"Fund"` → `dispatch(createFundRequest(data))` — button only visible to HOD

**Redux thunks** (in `DigitalRequestSlice.js`):
```javascript
createPurchaseRequest   → POST /api/purchase
createTransportRequest  → POST /api/transportation
createFoodRequest       → POST /api/food
createFundRequest       → POST /api/fund
```

**Validation**: `client/src/Validations/DigitalRequestValidation.js` — Yup schemas per type.

---

### 7.2 Handler Dashboard (Approver View)

**File**: `client/src/components/handler/HandlerDashboard.js`

For multi-level requests, the "handler" is actually the current-step approver (any role: `hod`, `avc`, `finance`, `dean`, etc.).

**Pending data fetched via:**
```javascript
// Multi-level: uses /pending/:userId
api.get(`/purchase/pending/${userId}`)
api.get(`/transportation/pending/${userId}`)
api.get(`/food/pending/${userId}`)
api.get(`/fund/pending/${userId}`)
```

**Action modal for multi-level requests:**
- Shows **"Approve"** and **"Reject"** buttons
- Rejection requires a comment

**Dispatch:**
```javascript
// Multi-level
dispatch(processApproval({
  requestId,
  requestType: "PurchaseRequest",
  approvalData: { action: "approved" | "rejected", comments }
}))
```

**`processApproval` thunk routing:**
```javascript
const MULTI_LEVEL_TYPES = ["purchase", "PurchaseRequest", "transportation", "TransportRequest", "food", "FoodRequest", "fund", "FundRequest"];

if (MULTI_LEVEL_TYPES.includes(requestType)) {
  response = await api.put(`${cfg.approval}/${requestId}/status`, { action, comments });
} else {
  response = await api.put(`${cfg.approval}/${requestId}/status`, { newStatus, notes });
}
```

---

### 7.3 Approval Chain Display

In the request detail view (modal in HandlerDashboard or TrackRequest), the `approvalFlow[]` is displayed as a timeline:
- Each step shows: level number, approver name, role, status badge (Pending/Approved/Rejected)
- Current step is highlighted
- If action is "Pending" and it's the user's step, action buttons appear

---

### 7.4 Track Request

**File**: `client/src/components/shared/TrackRequest.js`

Employees search by request number. Shows:
- Full request details
- Approval chain visualization (all steps with statuses)
- Current step indicator
- `approvalHistory[]` timeline with timestamps and comments

---

## 8. Workflow Configuration Admin UI

### 8.1 WorkflowDashboard

**File**: `client/src/components/admin/WorkflowDashboard.js`

Admin opens a card for any multi-level type → "Configure" → `WorkflowConfigModal`.

**Multi-level cards**: Purchase, Transportation, Food, Fund (shown in blue/green/orange/purple).

### 8.2 WorkflowConfigModal — Key Behaviors

**No step limit** for multi-level types (the `isSingleLevel` check is `false`).

```javascript
const isSingleLevel = SINGLE_LEVEL_TYPES.includes(selectedType); // false for multi-level
```

**Step row** (2-row card design):
- **Row 1**: reorder ↑↓ | badge "Step N" | role text input (datalist with predefined roles) | Pinned/Auto badge | delete ✕
- **Row 2**: "Pin to person" dropdown (filtered by typed role)

**Available roles datalist** (for autocomplete in step row):
```
hod, avc, finance, dean, head_academic, it_staff, it_hod,
public_relations, safety_officer, print_officer, admin
```

**User dropdown filtering**: Only shows users whose `roles[]` array contains the typed role (case-insensitive match). If role field is empty, shows all non-staff users.

**Badge colors**:
- No user pinned → **"Auto by role"** (blue badge)
- User pinned → **"Pinned"** (amber badge)

### 8.3 `handleSave` in WorkflowConfigModal

```javascript
const handleSave = async () => {
  const effectiveSteps = isSingleLevel ? steps.slice(0, 1) : steps;  // no cap for multi-level
  
  const approvalLevels = effectiveSteps.map((s, i) => ({
    level: i + 1,
    roleName: s.role || "",
    approverId: s.userId || null,   // null = auto; ObjectId = pinned
    isRequired: true,
    departmentScope: "",
  }));

  const config = {
    ...(initialConfig?._id ? { _id: initialConfig._id } : {}),
    workflowName: `${selectedType} Workflow`,
    requestType: selectedType,  // lowercase DB key
    isActive: true,
    workflowType: "chain",
    approvalLevels,
    handlerGroup: [],
  };

  // dispatch saveAdminWorkflow(config)
  // → PUT /api/admin/workflow-settings/:id (if _id exists)
  // → POST /api/admin/workflow-settings (if new)
};
```

### 8.4 Live Preview

Right side of the modal shows a preview of the chain:
- Each step shows role (and name if pinned) as a colored chip
- Arrow connectors between steps
- Color:
  - Role-only (auto): blue chip
  - Pinned person: amber chip

---

## 9. `findRequestById` Helper

Used by all read/update endpoints:
```javascript
const findRequestById = async (Model, id) => {
  // Try by requestNumber first
  let doc = await Model.findOne({ requestNumber: id }).populate("requesterId departmentRef assignedTo");
  if (!doc) {
    // Try by requestId field
    doc = await Model.findOne({ requestId: id }).populate("requesterId departmentRef assignedTo");
  }
  if (!doc && id.match(/^[a-fA-F0-9]{24}$/)) {
    // Try by MongoDB _id
    doc = await Model.findById(id).populate("requesterId departmentRef assignedTo");
  }
  return doc;
};
```

---

## 10. `resolveRequesterData` Helper

Loads full requester info with populated department:
```javascript
const resolveRequesterData = async (userId, departmentRefOverride) => {
  const user = await User.findById(userId)
    .populate({ path: "departmentRef", populate: { path: "headOfDepartment" } })
    .select("-password");
  if (!user) return null;
  
  const deptRef = departmentRefOverride || user.departmentRef?._id;
  const deptName = user.departmentRef?.departmentName || "";
  
  return { requester: user, departmentRef: deptRef, departmentName: deptName };
};
```

---

## 11. HOD Resolution in Detail

HOD (Head of Department) is a special role that is dynamically resolved based on the requester's department. It is **not stored as a static user role** in most cases — it comes from `Department.headOfDepartment`.

**Flow:**
1. Request submitted by Employee in Department X
2. Level 1 configured as `roleName: "hod"`, `approverId: null`
3. `resolveApproverForRole` is called with the requester's `departmentRef`
4. Server queries: `Department.findById(departmentRef).populate("headOfDepartment")`
5. Returns `dept.headOfDepartment` (the specific user set as HOD of that department)
6. That user becomes `assignedTo` for level 1

**Edge cases:**
- If department has no HOD set: falls back to `User.findOne({ roles: "hod", isActive: true })`
- If no HOD found anywhere: `buildApprovalFlow` throws → request creation fails with 400

**When HOD is stored as a role**: Some users may also have `"hod"` in their `roles[]` array. This is used for permission checks (e.g. fund request submission) and handler dashboard access.

---

## 12. Notification System

Each time a request advances to the next level, the next approver is notified:
```javascript
await createNotification(
  nextApprover._id,
  request,
  requestType,
  `Request ${request.requestNumber} needs your approval`,
  ""  // Arabic message
);
```

On final decision (approved/disbursed/rejected), the original requester is notified:
```javascript
await createNotification(
  request.requesterId,
  request,
  requestType,
  `Your ${requestType} request was ${request.status}`,
  ""
);
```

**Notification polling**: `NotificationBell.js` calls `GET /api/notifications/:userId` and shows unread count badge.

---

## 13. Key Design Decisions

1. **Immutable approval flow snapshot**: `approvalFlow[]` is built at request creation time with names snapshotted. Even if a user changes their role later, the approval chain remains the same.

2. **Role authorization**: Each approval step checks that the approver's role matches the step's `roleName`. This prevents a user from approving a step intended for a different role.

3. **Pinned vs Auto**: Admin can pin a specific person to any level. If that person becomes inactive, the system falls through to role-based resolution (graceful degradation).

4. **Sequential enforcement**: `approveMultiLevelRequest` only works when `request.assignedTo === approver._id`. Even if someone guesses the request ID, they can't approve unless they are the current assignee.

5. **Fund request restriction**: Only `hod` role users can submit fund requests. Checked server-side with `requireRole(req.userRoles, "hod")`.

6. **Fund final status**: Uses `"disbursed"` instead of `"approved"` for semantic accuracy in financial workflows. Sets `disbursementDate` automatically.

7. **No group/round-robin for multi-level**: Multi-level types always use chain mode. The `workflowType` is always `"chain"` for these four types.
