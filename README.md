# Digital Platform - Graduate Project

## Project Overview

This is a digital platform for managing IT service requests at Sultan Qaboos University. The system handles multiple types of requests including purchase requests with multi-level approval workflows, software downloads, print services, and request tracking.

### Key Features

- **Multi-Level Approval Workflow**: Purchase requests go through 3-level sequential manager approval (Manager1 → Manager2 → Manager3)
- **Role-Based Access**: Separate interfaces for IT Staff and Managers
- **Digital Request Tracking**: Dedicated tracking system separate from regular requests
- **Approval History**: Complete timeline of all approval actions
- **Delivery Date Management**: Manager 3 (final approver) sets expected delivery dates

## Technology Stack

### Backend
- **Node.js** with Express 5.1.0
- **MongoDB Atlas** (Mongoose 9.0.0)
- **bcrypt 6.0.0** for password hashing
- **CORS** enabled for cross-origin requests

### Frontend
- **React 18** with React Router 6
- **Redux Toolkit** for state management
- **Bootstrap 5** with Reactstrap
- **Axios** for API calls
- **Formik + Yup** for form validation

## Database Structure

### Connection Details
- **Database**: fullstakeDb
- **Connection String**: Hardcoded in `server/index.js` (line 18)
- **Collections**: itstaff, managers, workflowSettings, purchaserequests

### Collections Overview

#### 1. managers Collection
```json
{
  "_id": "692aa5ff8e3f209d24af6d8f",
  "managerId": "MGR001",
  "name": "Ahmed Al-Balushi",
  "email": "manager1@utas.edu.om",
  "password": "$2b$10$hashedPassword...",
  "role": "Manager1",
  "gender": "Male",
  "nationality": "Omani",
  "manpower_id": "EMP001"
}
```

**Test Credentials**:
- Manager 1: `manager1@utas.edu.om` / `pass123456`
- Manager 2: `manager2@utas.edu.om` / `pass123456`
- Manager 3: `manager3@utas.edu.om` / `pass123456`

#### 2. itstaff Collection
```json
{
  "_id": "692aa5f5b7b8e4a9d3c1e2f4",
  "ItStaffId": "ITS001",
  "name": "Sara Al-Hinai",
  "email": "sara.alhinai@utas.edu.om",
  "password": "$2b$10$hashedPassword...",
  "role": "IT Staff",
  "gender": "Female",
  "nationality": "Omani",
  "manpower_id": "EMP101"
}
```

**Test Credentials**:
- IT Staff: `sara.alhinai@utas.edu.om` / `pass123456`

#### 3. workflowSettings Collection
```json
{
  "_id": "67a71b3f6f6bbeb4c4a36854",
  "workflow_type": "purchase_request",
  "steps": [
    {
      "sequence_value": 1,
      "role": "Manager1",
      "approverId": "692aa5ff8e3f209d24af6d8f",
      "_id": "67a71b3f6f6bbeb4c4a36855"
    },
    {
      "sequence_value": 2,
      "role": "Manager2",
      "approverId": "692aa5ff8e3f209d24af6d91",
      "_id": "67a71b3f6f6bbeb4c4a36856"
    },
    {
      "sequence_value": 3,
      "role": "Manager3",
      "approverId": "692aa5ff8e3f209d24af6d93",
      "_id": "67a71b3f6f6bbeb4c4a36857"
    }
  ]
}
```

**Critical Note**: The `approverId` values MUST match the actual `_id` values in the managers collection. If you re-seed managers, run the workflow sync script.

#### 4. purchaserequests Collection
```json
{
  "_id": "67a123456789abcdef012345",
  "requesterId": "692aa5f5b7b8e4a9d3c1e2f4",
  "itemName": "Dell Laptop XPS 15",
  "quantity": 2,
  "estimatedCost": 3000,
  "justification": "For new developers in the team",
  "urgency": "Medium",
  "status": "Pending",
  "currentStep": 1,
  "approvalFlow": [
    {
      "approverId": "692aa5ff8e3f209d24af6d8f",
      "role": "Manager1",
      "action": null,
      "comment": null,
      "timestamp": null,
      "currentApprover": true,
      "_id": "67a123456789abcdef012346"
    },
    {
      "approverId": "692aa5ff8e3f209d24af6d91",
      "role": "Manager2",
      "action": null,
      "comment": null,
      "timestamp": null,
      "currentApprover": false,
      "_id": "67a123456789abcdef012347"
    },
    {
      "approverId": "692aa5ff8e3f209d24af6d93",
      "role": "Manager3",
      "action": null,
      "comment": null,
      "timestamp": null,
      "currentApprover": false,
      "_id": "67a123456789abcdef012348"
    }
  ],
  "createdAt": "2025-02-09T10:30:00.000Z",
  "updatedAt": "2025-02-09T10:30:00.000Z"
}
```

## API Documentation

### Base URL
- Backend: `http://localhost:3002`
- Frontend: `http://localhost:3000`

### Authentication

#### POST /login
Unified login endpoint for both IT Staff and Managers.

**Request Body**:
```json
{
  "email": "manager1@utas.edu.om",
  "password": "pass123456"
}
```

**Response** (Success - 200):
```json
{
  "success": true,
  "user": {
    "_id": "692aa5ff8e3f209d24af6d8f",
    "managerId": "MGR001",
    "name": "Ahmed Al-Balushi",
    "email": "manager1@utas.edu.om",
    "role": "Manager1",
    "gender": "Male",
    "nationality": "Omani",
    "manpower_id": "EMP001"
  }
}
```

**Response** (Failure - 401):
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

**Implementation Note**: The endpoint first checks the `itstaff` collection, then the `managers` collection. User object structure differs between IT Staff (has `ItStaffId`) and Managers (has `managerId`).

### Purchase Requests

#### POST /purchaseRequests
Create a new purchase request. Automatically initializes approval workflow from WorkflowSettings.

**Request Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "requesterId": "692aa5f5b7b8e4a9d3c1e2f4",
  "itemName": "Dell Laptop XPS 15",
  "quantity": 2,
  "estimatedCost": 3000,
  "justification": "For new developers in the team",
  "urgency": "Medium"
}
```

**Response** (Success - 201):
```json
{
  "success": true,
  "request": {
    "_id": "67a123456789abcdef012345",
    "requesterId": "692aa5f5b7b8e4a9d3c1e2f4",
    "itemName": "Dell Laptop XPS 15",
    "quantity": 2,
    "estimatedCost": 3000,
    "status": "Pending",
    "currentStep": 1,
    "approvalFlow": [...],
    "createdAt": "2025-02-09T10:30:00.000Z"
  }
}
```

**Workflow Initialization Logic**:
1. Fetches workflow settings from database
2. Creates approvalFlow array with all steps
3. Sets `currentApprover: true` for first step only
4. Sets `currentStep: 1` and `status: "Pending"`

#### GET /purchaseRequests/user/:userId
Fetch all purchase requests created by a specific user.

**Response** (200):
```json
{
  "success": true,
  "requests": [
    {
      "_id": "67a123456789abcdef012345",
      "itemName": "Dell Laptop XPS 15",
      "status": "Pending",
      "currentStep": 1,
      ...
    }
  ]
}
```

#### GET /purchaseRequests/pending/:managerId
Fetch pending approval requests for a specific manager. Only returns requests where the manager is the current approver.

**Response** (200):
```json
{
  "success": true,
  "requests": [
    {
      "_id": "67a123456789abcdef012345",
      "itemName": "Dell Laptop XPS 15",
      "approvalFlow": [...],
      ...
    }
  ]
}
```

**Filter Logic**: 
- Finds requests where `status === "Pending"`
- Checks `approvalFlow` for entry with manager's role
- Verifies `currentApprover: true` for that role

#### POST /purchaseRequests/:requestId/approve
Approve or reject a purchase request. Advances workflow to next step or marks as complete/rejected.

**Request Headers**:
```
Content-Type: application/json
```

**Request Body** (Approval):
```json
{
  "managerId": "692aa5ff8e3f209d24af6d8f",
  "action": "approve",
  "comment": "Approved for budget allocation",
  "deliveryDate": "2025-03-15"
}
```

**Request Body** (Rejection):
```json
{
  "managerId": "692aa5ff8e3f209d24af6d8f",
  "action": "reject",
  "comment": "Budget not available this quarter"
}
```

**Response** (Success - 200):
```json
{
  "success": true,
  "message": "Request approved successfully",
  "request": {
    "_id": "67a123456789abcdef012345",
    "status": "Pending",
    "currentStep": 2,
    "approvalFlow": [
      {
        "approverId": "692aa5ff8e3f209d24af6d8f",
        "role": "Manager1",
        "action": "approve",
        "comment": "Approved for budget allocation",
        "timestamp": "2025-02-09T14:25:00.000Z",
        "currentApprover": false
      },
      {
        "approverId": "692aa5ff8e3f209d24af6d91",
        "role": "Manager2",
        "currentApprover": true
      }
    ]
  }
}
```

**Authorization Logic** (lines 232-260 in server/index.js):
1. Finds the approval step for the manager making the request
2. Extracts `approverId` from that step
3. Compares `approverId.toString()` with `managerId` from request body
4. Returns 403 if IDs don't match

**Workflow Advancement Logic**:
- **On Approval**: 
  - Updates current step with action, comment, timestamp
  - Sets `currentApprover: false` for current step
  - Increments `currentStep`
  - Sets `currentApprover: true` for next step (if exists)
  - If last step: sets `status: "Approved"` and `deliveryDate` (Manager3 only)
- **On Rejection**:
  - Updates current step with action, comment, timestamp
  - Sets `status: "Rejected"`
  - Stops workflow (no further approvals)

## Approval Workflow System

### Workflow Design
The system uses a **database-driven sequential approval workflow** with three levels:

```
IT Staff → Manager 1 → Manager 2 → Manager 3 → Approved/Rejected
```

### Authorization Mechanism

**ID-Based Authorization** (chosen over role-based):
- Each workflow step stores `approverId` (manager's _id from database)
- When approving, backend compares logged-in manager's _id with expected approverId
- This allows future group-based assignments (multiple managers per level)

### Key Components

#### WorkflowSettings Schema
```javascript
{
  workflow_type: String,
  steps: [{
    sequence_value: Number,
    role: String,
    approverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Manager' }
  }]
}
```

#### PurchaseRequest Schema
```javascript
{
  requesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'ItStaff' },
  itemName: String,
  quantity: Number,
  estimatedCost: Number,
  justification: String,
  urgency: String,
  status: String,
  currentStep: Number,
  deliveryDate: Date,
  approvalFlow: [{
    approverId: mongoose.Schema.Types.ObjectId,
    role: String,
    action: String,
    comment: String,
    timestamp: Date,
    currentApprover: Boolean
  }]
}
```

### Workflow State Machine

**States**:
- `Pending`: Awaiting approval at current step
- `Approved`: All approvers have approved
- `Rejected`: Any approver rejected

**Transitions**:
1. **Request Created**: status=Pending, currentStep=1, first approver marked
2. **Manager1 Approves**: currentStep=2, Manager2 becomes current approver
3. **Manager2 Approves**: currentStep=3, Manager3 becomes current approver
4. **Manager3 Approves**: status=Approved, deliveryDate set
5. **Any Manager Rejects**: status=Rejected, workflow stops

### Critical Synchronization

**⚠️ IMPORTANT**: The `approverId` values in WorkflowSettings MUST exactly match the `_id` values in the managers collection.

**If managers are re-seeded**, run the sync script:

```javascript
// syncWorkflow.js (create in server folder, then delete after running)
const mongoose = require('mongoose');
const Manager = require('./Models/Manager');
const WorkFlowSettings = require('./Models/WorkFlowSettings');

async function syncWorkflow() {
  try {
    await mongoose.connect('YOUR_MONGODB_CONNECTION_STRING');
    
    const managers = await Manager.find({}).sort({ role: 1 });
    
    if (managers.length !== 3) {
      throw new Error('Expected 3 managers');
    }
    
    await WorkFlowSettings.deleteMany({ workflow_type: 'purchase_request' });
    
    const workflow = new WorkFlowSettings({
      workflow_type: 'purchase_request',
      steps: [
        { sequence_value: 1, role: 'Manager1', approverId: managers[0]._id },
        { sequence_value: 2, role: 'Manager2', approverId: managers[1]._id },
        { sequence_value: 3, role: 'Manager3', approverId: managers[2]._id }
      ]
    });
    
    await workflow.save();
    console.log('Workflow synced successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

syncWorkflow();
```

Run with: `node syncWorkflow.js`

## Frontend Architecture

### Component Structure

```
src/
├── App.js (Main routing)
├── pages/
│   ├── Home.js (Dashboard with conditional Manager panel)
│   ├── AuthPage.js (Login)
│   └── ...
├── components/
│   ├── DigitalRequests.js (IT Staff request form)
│   ├── DigitalRequestsTracking.js (Request tracking display)
│   ├── ManagerApprovalPanel.js (Manager approval interface)
│   └── MyRequests.js (Contains tracking component)
└── Features/
    ├── UserSlice.js (Authentication state)
    └── DigitalRequestSlice.js (Request state)
```

### State Management (Redux)

#### UserSlice
```javascript
// State shape
{
  user: {
    _id: String,
    name: String,
    email: String,
    role: String,
    managerId: String,  // For managers
    ItStaffId: String,  // For IT staff
    gender: String,
    nationality: String,
    manpower_id: String
  },
  isAuthenticated: Boolean,
  loading: Boolean,
  error: String
}
```

#### DigitalRequestSlice
```javascript
// State shape
{
  requests: Array,
  pendingApprovals: Array,
  loading: Boolean,
  error: String
}

// Async thunks
- createPurchaseRequest(requestData)
- fetchMyRequests(userId)
- fetchPendingApprovals(managerId)
- processApproval({ requestId, managerId, action, comment, deliveryDate })
```

### Key Components

#### ManagerApprovalPanel.js
Located in: `client/src/components/ManagerApprovalPanel.js`

**Purpose**: Manager interface for approving/rejecting requests

**Key Features**:
- Fetches pending approvals on component mount
- Displays request details in accordion format
- Two-step approval process (Approve button → Form → Confirm)
- Conditional delivery date field for Manager3 only
- Approval history timeline with color-coded status

**Critical Logic**:
```javascript
// Line 29-43: Determines if current user is final approver
const isFinalApprover = () => {
  if (!user?.role || !pendingApprovals.length) return false;
  
  const firstRequest = pendingApprovals[0];
  if (!firstRequest?.approvalFlow) return false;
  
  const lastStep = firstRequest.approvalFlow[firstRequest.approvalFlow.length - 1];
  return user.role === lastStep.role;
};

// Lines 86-125: Validation and submission
const handleConfirmAction = () => {
  if (actionType === 'approve' && isFinalApprover() && !deliveryDate) {
    alert('Please select a delivery date');
    return;
  }
  
  dispatch(processApproval({
    requestId: selectedRequest._id,
    managerId: user._id,
    action: actionType,
    comment: comments[selectedRequest._id],
    deliveryDate: actionType === 'approve' ? deliveryDate : undefined
  }));
};
```

#### DigitalRequests.js
Located in: `client/src/components/DigitalRequests.js`

**Purpose**: IT Staff form for creating purchase requests

**Features**:
- Form validation with Yup schema
- Urgency dropdown (Low/Medium/High)
- Cost estimation field
- Justification textarea
- Redux dispatch on submit

#### DigitalRequestsTracking.js
Located in: `client/src/components/DigitalRequestsTracking.js`

**Purpose**: Display IT Staff's submitted requests with approval history

**Features**:
- Embedded in MyRequests.js as separate section
- Shows current approval stage
- View history modal with timeline
- Color-coded status badges

#### Home.js
Located in: `client/src/pages/Home.js`

**Purpose**: Main dashboard after login

**Features**:
- Displays employee personal information
- Conditional rendering for IT Staff vs Manager fields
- Embeds ManagerApprovalPanel component for managers only
- Handles different data structures between user types

**Critical Logic** (lines 66-91):
```javascript
// Handles both IT Staff and Manager data structures
const displayId = user?.ItStaffId || user?.managerId || "N/A";
const displayGender = user?.gender || "N/A";
const displayNationality = user?.nationality || "N/A";
const displayManpowerId = user?.manpower_id || "N/A";
```

### Routing

```javascript
// App.js
<Routes>
  <Route path="/" element={<AuthPage />} />
  <Route path="/home" element={<Home />} />
  <Route path="/digital-requests" element={<DigitalRequests />} />
  <Route path="/my-requests" element={<MyRequests />} />
  {/* Other routes */}
</Routes>
```

**Note**: Manager approval panel is NOT a separate route - it's embedded in Home.js

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account (or local MongoDB)
- Git

### Installation

1. **Clone the repository**
```powershell
git clone <repository-url>
cd "Digital Platfrom gradpro"
```

2. **Install backend dependencies**
```powershell
cd server
npm install
```

3. **Install frontend dependencies**
```powershell
cd ../client
npm install
```

4. **Configure database connection**
- Open `server/index.js`
- Update MongoDB connection string on line 18
- (TODO: Move to .env file)

5. **Seed the database**
```powershell
cd ../server
node seedManagers.js
node syncWorkflow.js
```

6. **Start backend server**
```powershell
# In server folder
node index.js
# Server runs on http://localhost:3002
```

7. **Start frontend**
```powershell
# In client folder (new terminal)
npm start
# App opens at http://localhost:3000
```

### Database Seeding Scripts

#### seedManagers.js
Creates 3 managers with roles Manager1, Manager2, Manager3

#### syncWorkflow.js
Synchronizes workflow settings with current manager IDs (run after seeding managers)

### Testing the System

1. **Login as IT Staff**
   - Email: `sara.alhinai@utas.edu.om`
   - Password: `pass123456`
   - Navigate to Digital Requests → Create request

2. **Login as Manager 1**
   - Email: `manager1@utas.edu.om`
   - Password: `pass123456`
   - See pending request in home page → Approve

3. **Login as Manager 2**
   - Email: `manager2@utas.edu.om`
   - Password: `pass123456`
   - See pending request → Approve

4. **Login as Manager 3**
   - Email: `manager3@utas.edu.om`
   - Password: `pass123456`
   - See pending request → Set delivery date → Approve

5. **Check as IT Staff**
   - Login again as Sara
   - View My Requests → See approved status with delivery date

## Known Issues and Limitations

### Security Issues (HIGH PRIORITY)
- ❌ **No JWT tokens**: Authentication uses simple boolean flag
- ❌ **Hardcoded credentials**: MongoDB connection string in source code
- ❌ **No .env file**: All sensitive data exposed
- ❌ **Passwords in plaintext**: Seed scripts contain actual passwords

### Missing Features
- ❌ **File uploads**: Profile photos, document attachments not implemented
- ❌ **Email notifications**: No email sent on approval/rejection
- ❌ **Transport request backend**: Frontend form exists, no backend API
- ❌ **Graduation project backend**: Frontend form exists, no backend API
- ❌ **Help desk backend**: Placeholder component only
- ❌ **Reports and analytics**: No dashboard for statistics

### Technical Debt
- ⚠️ **No input sanitization**: Vulnerable to injection attacks
- ⚠️ **No rate limiting**: API endpoints unprotected
- ⚠️ **No logging**: No audit trail for actions
- ⚠️ **No error boundaries**: Frontend crashes not handled gracefully
- ⚠️ **No API versioning**: Breaking changes will affect all clients

### Workflow Limitations
- Old requests created before workflow setup will not work (create fresh requests)
- No support for parallel approvals (future feature)
- No approval delegation (if manager unavailable)
- No request editing after submission
- No request cancellation by IT staff

## Priority TODOs for Next Developer

### Phase 1: Security (Week 1-2)
1. **Implement JWT authentication**
   - Install `jsonwebtoken` package
   - Create token on login (expires in 24h)
   - Add auth middleware to protect routes
   - Store token in localStorage (consider httpOnly cookies for production)

2. **Environment variables**
   - Create `.env` file with MongoDB connection string
   - Add `JWT_SECRET` for token signing
   - Use `dotenv` package
   - Update `.gitignore` to exclude `.env`

3. **Input validation and sanitization**
   - Install `express-validator`
   - Add validation middleware to all POST routes
   - Sanitize user inputs to prevent injection

### Phase 2: File Uploads (Week 3)
1. **Profile photo uploads**
   - Install `multer` for file handling
   - Create `/uploads` endpoint
   - Store files in MongoDB GridFS or cloud storage (AWS S3/Azure Blob)
   - Update User schemas to include `profilePhotoUrl` field

2. **Document attachments for requests**
   - Add `attachments` array field to PurchaseRequest schema
   - Support multiple file uploads per request
   - Validate file types (PDF, images only)
   - Implement file size limits (max 5MB per file)

### Phase 3: Transport & Graduation Features (Week 4-5)
1. **Transport request backend**
   - Create `TransportRequest.js` model (schema similar to PurchaseRequest)
   - Add CRUD endpoints: POST, GET /user/:userId, GET /pending/:managerId
   - Reuse existing approval workflow (same 3-level process)
   - Update frontend to connect to new endpoints

2. **Graduation project backend**
   - Create `GraduationProject.js` model
   - Add supervisor assignment logic
   - Create review/feedback system
   - Add file upload for project documents

### Phase 4: Notifications (Week 6)
1. **Email notifications**
   - Install `nodemailer`
   - Configure SMTP settings (use Gmail/SendGrid)
   - Send emails on:
     - Request submission (to Manager1)
     - Approval (to next manager)
     - Final approval (to IT staff with delivery date)
     - Rejection (to IT staff)

2. **In-app notifications**
   - Create `Notification.js` model
   - Add bell icon in navbar with unread count
   - Mark as read functionality

### Phase 5: Enhanced Features (Week 7-8)
1. **Request editing**
   - Allow IT staff to edit pending requests (before any approval)
   - Add edit button in MyRequests component
   - Create PATCH endpoint: `/purchaseRequests/:id`

2. **Request cancellation**
   - Add cancel button for pending requests
   - Create endpoint: POST `/purchaseRequests/:id/cancel`
   - Add `status: "Cancelled"` to schema

3. **Reports and analytics**
   - Create admin dashboard page
   - Show statistics: total requests, approval rates, average processing time
   - Filter by date range, status, department
   - Export to CSV functionality

4. **Help desk system**
   - Create ticket system for IT support
   - Priority-based queue
   - Assignment to IT staff members
   - Status tracking (Open, In Progress, Resolved)

### Code Quality Improvements
- Add error boundaries in React components
- Implement proper logging (Winston or Bunyan)
- Add rate limiting (express-rate-limit)
- Write unit tests (Jest for backend, React Testing Library for frontend)
- Add API documentation (Swagger/OpenAPI)
- Implement API versioning (/api/v1/)

## Debugging Tips

### Common Issues

**Issue**: 403 Unauthorized when approving request
- **Cause**: Manager's _id doesn't match approverId in workflow
- **Solution**: Run `syncWorkflow.js` to sync manager IDs with workflow
- **Check**: Console logs in server show expectedApproverId vs actualApproverId

**Issue**: Manager3 can't see delivery date field
- **Cause**: isFinalApprover check failing
- **Solution**: Verify user.role matches last step's role in workflow
- **Check**: Frontend console logs in ManagerApprovalPanel line 29-43

**Issue**: Home page shows "N/A" for manager data
- **Cause**: Manager object uses different field names than IT Staff
- **Solution**: Already fixed in lines 66-91 of Home.js
- **Check**: Verify displayId uses managerId fallback

**Issue**: Old requests don't appear in manager panel
- **Cause**: Created before workflow was properly set up
- **Solution**: Create fresh request as IT staff
- **Check**: Ensure request has complete approvalFlow array in database

### Debugging Commands

**Check database collections**:
```javascript
// In MongoDB Compass or mongo shell
use fullstakeDb
db.managers.find().pretty()
db.workflowSettings.find().pretty()
db.purchaserequests.find().pretty()
```

**Test API endpoints** (PowerShell):
```powershell
# Login
Invoke-RestMethod -Uri "http://localhost:3002/login" -Method POST -Body (@{email="manager1@utas.edu.om"; password="pass123456"} | ConvertTo-Json) -ContentType "application/json"

# Get pending approvals
Invoke-RestMethod -Uri "http://localhost:3002/purchaseRequests/pending/692aa5ff8e3f209d24af6d8f" -Method GET

# Create request
Invoke-RestMethod -Uri "http://localhost:3002/purchaseRequests" -Method POST -Body (@{requesterId="692aa5f5b7b8e4a9d3c1e2f4"; itemName="Test Item"; quantity=1; estimatedCost=100; justification="Testing"; urgency="Low"} | ConvertTo-Json) -ContentType "application/json"
```

**Frontend debugging**:
- Open browser DevTools (F12)
- Check Redux DevTools extension for state changes
- Console logs in ManagerApprovalPanel show isFinalApprover calculation
- Network tab shows API call results

## Project Handover Notes

### What Works
✅ Complete authentication system for IT Staff and Managers  
✅ Purchase request creation with automatic workflow initialization  
✅ Three-level sequential approval system  
✅ ID-based authorization protecting approval endpoints  
✅ Manager approval panel with modal interface  
✅ Delivery date requirement for final approver (Manager3)  
✅ Request tracking with approval history timeline  
✅ Redux state management with async thunks  
✅ Responsive UI with Bootstrap 5  

### What's Missing
❌ Security layer (JWT, .env, validation)  
❌ File upload functionality  
❌ Email notifications  
❌ Transport request backend  
❌ Graduation project backend  
❌ Help desk system  
❌ Reports and analytics  

### Architecture Decisions

**Why ID-based authorization instead of role-based?**
- Allows future group assignments (multiple Manager1s)
- More flexible for organizational changes
- Easier to implement delegation features later

**Why embed manager panel in Home.js instead of separate route?**
- Faster access to pending approvals
- Single-page dashboard experience
- Reduces navigation clicks for managers

**Why separate DigitalRequests from regular requests?**
- Different approval workflows planned for different request types
- Cleaner separation of concerns
- Easier to add new request types (transport, graduation) later

**Why two-step approval (button → form)?**
- Prevents accidental approvals
- Forces managers to add comments
- Validates delivery date before submission

### Contact Information
- **Project Author**: [Your Name/Team]
- **Date**: November 29, 2025
- **Repository**: [GitHub URL]
- **Documentation**: This README

---

## Quick Reference

### Key File Locations
- **Main server**: `server/index.js`
- **Manager model**: `server/Models/Manager.js`
- **Request model**: `server/Models/PurchaseRequest.js`
- **Workflow model**: `server/Models/WorkFlowSettings.js`
- **Manager panel**: `client/src/components/ManagerApprovalPanel.js`
- **Request form**: `client/src/components/DigitalRequests.js`
- **Dashboard**: `client/src/pages/Home.js`
- **Redux requests**: `client/src/Features/DigitalRequestSlice.js`

### Test Credentials Summary
| Role | Email | Password | Manager ID |
|------|-------|----------|------------|
| IT Staff | sara.alhinai@utas.edu.om | pass123456 | - |
| Manager 1 | manager1@utas.edu.om | pass123456 | 692aa5ff8e3f209d24af6d8f |
| Manager 2 | manager2@utas.edu.om | pass123456 | 692aa5ff8e3f209d24af6d91 |
| Manager 3 | manager3@utas.edu.om | pass123456 | 692aa5ff8e3f209d24af6d93 |

### Useful Scripts
```powershell
# Start backend
cd server; node index.js

# Start frontend
cd client; npm start

# Seed managers
cd server; node seedManagers.js

# Sync workflow
cd server; node syncWorkflow.js

# Install dependencies
cd server; npm install
cd client; npm install
```

---

**Last Updated**: November 29, 2025  
**Version**: 1.0  
**Status**: Development - Ready for Security Phase
