# AI Context — Digital Platform (UTAS Employee Portal)

> This file provides full context for any AI assistant working on this codebase.
> Last updated: March 2026

---

## 1. Overview

MERN stack employee portal for the University of Technology and Applied Sciences (UTAS).
Employees submit 7 types of service requests; admins configure approval workflows; IT Staff handle/approve requests.

---

## 2. Tech Stack

| Layer          | Tech                                                                                                                 |
| -------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Server**     | Node.js (ESM), Express 5.1, Mongoose 9, bcrypt, jsonwebtoken, multer, express-rate-limit, dotenv                     |
| **Client**     | React 19, Redux Toolkit, React Router 7, React Hook Form + Yup, Axios, Tailwind CSS 3, lucide-react, react-hot-toast |
| **UI Library** | shadcn-style components in `client/src/components/ui/`                                                               |
| **Database**   | MongoDB (single DB, collections per model)                                                                           |
| **Dark Mode**  | Tailwind `darkMode: ["class"]`, toggled via `.dark` class on `<html>`, persisted in localStorage                     |
| **i18n**       | Arabic (RTL, default) / English toggle via React Context                                                             |

---

## 3. Project Structure

```
├── AI_CONTEXT.md                        ← this file
├── .github/
│   ├── agents/code-reviewer.agent.md
│   └── copilot-instructions.md
├── server/
│   ├── index.js                         ← ALL routes, middleware, helpers (~1600+ lines, single file)
│   ├── package.json                     ← type: "module" (ESM)
│   ├── seedUsers.js                     ← DB seed script
│   ├── Models/
│   │   ├── User.js
│   │   ├── PurchaseRequest.js
│   │   ├── TransportRequest.js
│   │   ├── FoodRequest.js
│   │   ├── FundRequest.js
│   │   ├── MaintenanceRequest.js
│   │   ├── PrintingRequest.js           ← has fileUrl for uploaded docs
│   │   ├── RiskReport.js
│   │   ├── WorkflowSettings.js          ← chain/group workflow config
│   │   ├── RequestCounter.js            ← atomic auto-increment for BUY IDs
│   │   └── Notification.js              ← bilingual notifications
│   └── uploads/
│       ├── profiles/                    ← user profile photos
│       └── printing/                    ← uploaded print documents
├── client/
│   ├── src/
│   │   ├── App.js                       ← routes: /, /dashboard, /help-desk, /track-request, /digital-requests
│   │   ├── index.css                    ← CSS variables (light + dark themes)
│   │   ├── index.js                     ← React entry, wraps with LanguageProvider + Redux Provider
│   │   ├── Features/
│   │   │   ├── DigitalRequestSlice.js   ← Redux thunks for all 7 request types
│   │   │   └── UserSlice.js             ← login/logout, localStorage persistence
│   │   ├── lib/
│   │   │   ├── api.js                   ← Axios instance, JWT interceptor, 401 redirect
│   │   │   ├── LanguageContext.js        ← lang (ar/en), theme (light/dark), toggles, localStorage
│   │   │   └── utils.js                 ← cn() for Tailwind class merging
│   │   ├── hooks/
│   │   │   └── useAdminDashboard.js     ← admin dashboard data fetching hook
│   │   ├── Validations/
│   │   │   └── DigitalRequestValidation.js ← Yup schemas for forms
│   │   ├── Store/
│   │   │   └── Store.js                 ← Redux store config
│   │   ├── components/
│   │   │   ├── admin/
│   │   │   │   ├── AdminDashboard.js    ← tabbed admin panel (Overview, Requests, Users, Workflows)
│   │   │   │   ├── OverviewTab.js       ← stats cards, charts, recent requests
│   │   │   │   ├── RequestsTab.js       ← view/filter/delete all requests + detail modals
│   │   │   │   ├── UsersTab.js          ← CRUD users, role/active toggle
│   │   │   │   ├── WorkflowDashboard.js ← configure chain/group workflows for 7 types
│   │   │   │   ├── adminHelpers.js      ← shared utilities: statusVariant, Field, StatCard, etc.
│   │   │   │   └── adminTranslations.js ← bilingual admin strings (en/ar)
│   │   │   ├── handler/
│   │   │   │   └── HandlerDashboard.js  ← IT Staff pending approvals list + approve/reject
│   │   │   ├── employee/
│   │   │   │   ├── DigitalRequests.js   ← multi-tab form (Purchase, Transport, Food, Fund)
│   │   │   │   ├── DigitalRequests.translations.js
│   │   │   │   └── PrintRequestForm.js  ← printing request with file upload
│   │   │   ├── shared/
│   │   │   │   ├── HelpDesk.js          ← maintenance/helpdesk form
│   │   │   │   ├── TrackRequest.js      ← track request status by ID
│   │   │   │   └── NotificationBell.js  ← bell icon + dropdown in header
│   │   │   ├── auth/
│   │   │   │   └── AuthPage.js          ← login form
│   │   │   ├── layout/
│   │   │   │   └── Home.js             ← main shell: sidebar + header + content routing
│   │   │   └── ui/                      ← shadcn components (DO NOT modify unless asked)
│   │   └── Images/                      ← logo and static assets
│   ├── public/
│   └── tailwind.config.js              ← darkMode: ["class"], CSS variable-based colors
└── .env                                ← MONGODB_URI, JWT_SECRET, PORT
```

---

## 4. The 7 Request Types

| #   | Type                  | Model                | ID Prefix | Endpoint Slug         | ID Method                 |
| --- | --------------------- | -------------------- | --------- | --------------------- | ------------------------- |
| 1   | Purchase / Software   | `PurchaseRequest`    | `BUY`     | `purchaseRequests`    | Counter (padded 8 digits) |
| 2   | Transport             | `TransportRequest`   | `TRN`     | `transportRequests`   | Timestamp                 |
| 3   | Food / Catering       | `FoodRequest`        | `FOOD`    | `foodRequests`        | Timestamp                 |
| 4   | Fund                  | `FundRequest`        | `FUND`    | `fundRequests`        | Timestamp                 |
| 5   | Maintenance / IT Help | `MaintenanceRequest` | `MNT`     | `maintenanceRequests` | Timestamp                 |
| 6   | Printing              | `PrintingRequest`    | `PRN`     | `printingRequests`    | Timestamp                 |
| 7   | Risk Report           | `RiskReport`         | `RISK`    | `riskReports`         | Timestamp                 |

**All 7 models share these workflow fields:**

```
requestId        — unique string (prefix + counter/timestamp)
requesterId      — ObjectId ref → User
status           — enum (varies per type, all include "Pending")
approvalFlow[]   — [{approverId, role, action, comment, timestamp, currentApprover}]
currentStep      — Number (for chain mode)
assignedHandler  — ObjectId ref → User (for group mode)
timestamps       — createdAt, updatedAt
```

---

## 5. Complete API Endpoints

### Authentication (no auth required)

| Method | Path      | Purpose                                                                           |
| ------ | --------- | --------------------------------------------------------------------------------- |
| POST   | `/login`  | Login (email + password) → JWT + user profile. Rate-limited: 10 attempts / 15 min |
| POST   | `/logout` | Logout                                                                            |

### Profile (auth required)

| Method | Path                      | Purpose                                         |
| ------ | ------------------------- | ----------------------------------------------- |
| POST   | `/upload/profile/:userId` | Upload profile photo (Multer: 2MB, images only) |
| GET    | `/users/:userId`          | Fetch user profile (excludes password)          |

### Request CRUD (auth required)

| Method | Path                           | Purpose                                                              |
| ------ | ------------------------------ | -------------------------------------------------------------------- |
| POST   | `/purchaseRequests`            | Create purchase request → `applyWorkflow()`                          |
| POST   | `/transportRequests`           | Create transport request → `applyWorkflow()`                         |
| POST   | `/foodRequests`                | Create food request → `applyWorkflow()`                              |
| POST   | `/fundRequests`                | Create fund request → `applyWorkflow()`                              |
| POST   | `/maintenanceRequests`         | Create maintenance request → `applyWorkflow()`                       |
| POST   | `/printingRequests`            | Create printing request (multipart, file upload) → `applyWorkflow()` |
| POST   | `/riskReports`                 | Create risk report → `applyWorkflow()`                               |
| GET    | `/purchaseRequests/:requestId` | Fetch single purchase request (populated)                            |
| GET    | `/maintenanceRequests`         | Fetch all maintenance requests                                       |
| GET    | `/requests/my/:userId`         | Fetch all 7 types submitted by a user                                |
| GET    | `/requests/pending/:userId`    | Pending approvals for a handler (chain + group modes)                |

### Approval (auth required)

| Method | Path                         | Purpose                                                        |
| ------ | ---------------------------- | -------------------------------------------------------------- |
| POST   | `/{slug}/:requestId/approve` | Approve/reject any of the 7 types → `processGenericApproval()` |

**Approval Body:**

```json
{ "approverId": "...", "action": "Approved|Rejected", "comment": "optional" }
```

### Notifications (auth required)

| Method | Path                                  | Purpose                                      |
| ------ | ------------------------------------- | -------------------------------------------- |
| GET    | `/notifications/:userId`              | Fetch 50 recent notifications + unread count |
| PATCH  | `/notifications/:notificationId/read` | Mark one notification as read                |
| PATCH  | `/notifications/:userId/read-all`     | Mark all as read                             |

### Admin Only (auth + role = "admin")

| Method | Path                                      | Purpose                                                                |
| ------ | ----------------------------------------- | ---------------------------------------------------------------------- |
| GET    | `/admin/stats`                            | Dashboard stats (user count, request counts, role breakdown, recent 5) |
| GET    | `/admin/requests`                         | Fetch ALL requests (all 7 types, all users)                            |
| DELETE | `/admin/requests/:requestId/:requestType` | Delete any request                                                     |
| GET    | `/admin/workflows`                        | Fetch all workflow configs                                             |
| PUT    | `/admin/workflows/:requestType`           | Upsert workflow config (chain or group)                                |
| GET    | `/admin/users`                            | List all users                                                         |
| POST   | `/admin/users`                            | Create new user                                                        |
| PUT    | `/admin/users/:userId`                    | Full edit user (all fields)                                            |
| PATCH  | `/admin/users/:userId`                    | Quick edit (role, isActive)                                            |
| DELETE | `/admin/users/:userId`                    | Delete user                                                            |

---

## 6. Authentication & Security

- **JWT**: 8-hour expiry, stored in `localStorage`, sent as `Authorization: Bearer <token>`
- **Roles**: `"admin"` (full access), `"IT Staff"` (handle requests), `"employee"` (submit requests)
- **Server Middleware**:
  - `requireAuth` — validates JWT, sets `req.user`
  - `requireAdmin` — checks `req.user.role === "admin"`
  - Auth gate: global middleware applies `requireAuth` to all routes below `/login` and `/logout`
- **Rate Limiting**: 10 login attempts per 15 minutes (`express-rate-limit`)
- **Password**: bcrypt with 10 salt rounds
- **Client interceptor** (api.js): 401 response → clear localStorage + redirect to `/`

---

## 7. Workflow System (Critical Architecture)

Two approval modes, configured per request type in `WorkflowSettings`:

### Chain Mode (Sequential)

- Admin defines ordered steps: `[{sequence_value, role, approverId}]`
- On request creation: `applyWorkflow()` builds `approvalFlow[]` array, sets `currentStep = 1`
- Each step's approver must approve before the next step
- Rejection at any step → `status = "Rejected"`

### Group Mode (Round-Robin)

- Admin defines handler pool: `[{handlerId, handlerName, handlerRole}]`
- On request creation: `applyWorkflow()` picks next handler via `roundRobinIndex % pool.length`
- Assigned handler approves/rejects directly
- No sequential steps

### Key Server Functions (all in `server/index.js`)

- `applyWorkflow(requestType, request)` — reads WorkflowSettings, applies chain or group
- `processGenericApproval(Model, req, res)` — shared approval logic for all 7 types
- `createNotification(userId, typeName, requestId, action)` — bilingual notification on approve/reject

### Workflow Array: `VALID_REQUEST_TYPES`

```javascript
const VALID_REQUEST_TYPES = [
  "PurchaseRequest",
  "TransportRequest",
  "FoodRequest",
  "FundRequest",
  "MaintenanceRequest",
  "PrintingRequest",
  "RiskReport",
];
```

---

## 8. File Upload System (Multer)

| Upload            | Path                | Max Size | Allowed Types     | Middleware       |
| ----------------- | ------------------- | -------- | ----------------- | ---------------- |
| Profile photo     | `uploads/profiles/` | 2 MB     | Images (image/\*) | `uploadProfile`  |
| Printing document | `uploads/printing/` | 10 MB    | .pdf, .doc, .docx | `uploadPrinting` |

Static serving: `app.use("/uploads", express.static(...))`

---

## 9. Theme System (Dark Mode)

- **Tailwind Config**: `darkMode: ["class"]`
- **Toggle Mechanism**: `LanguageContext.js` manages `theme` state ("light" | "dark"), persists to `localStorage`, toggles `.dark` class on `<html>`
- **CSS Variables** (`index.css`): `:root` defines light palette, `.dark` overrides with dark palette
- **Colors**: All UI components use CSS variable-based Tailwind colors (`bg-background`, `text-foreground`, `bg-card`, etc.)
- **Toggle Button**: Moon/Sun icon in `Home.js` header navbar

---

## 10. Internationalization (i18n)

- **Default**: Arabic (`"ar"`) with RTL
- **Toggle**: `useLanguage()` hook from `LanguageContext.js`
- **Pattern**: Each component has translations `{ en: {...}, ar: {...} }`, accessed via `t = translations[lang]`
- **Translation Files**:
  - `adminTranslations.js` — admin panel strings
  - `DigitalRequests.translations.js` — form labels, navigation, shared strings
  - `WF_T` object in `WorkflowDashboard.js` — workflow-specific strings
  - `Notification.js` model stores `message` (EN) + `messageAr` (AR)
- **RTL Adjustment**: `[dir="rtl"] { font-size: 0.9375rem }` for Arabic text balance

---

## 11. Redux State Management

### DigitalRequestSlice

```javascript
state: {
  pendingApprovals: [],   // handler's pending list
  currentRequest: null,   // single request detail
  isLoading, isSuccess, isError, message
}
```

**Thunks:**

- `createPurchaseRequest(data)` — POST `/purchaseRequests`
- `fetchPendingApprovals(userId)` — GET `/requests/pending/:userId`
- `processApproval({ requestId, requestType, approvalData })` — POST `/{slug}/:id/approve`
- `fetchRequestDetails({ requestId, requestType })` — GET `/{slug}/:id`

**Endpoint Map** (used in processApproval + fetchRequestDetails):

```javascript
{
  PurchaseRequest: "purchaseRequests",
  TransportRequest: "transportRequests",
  FoodRequest: "foodRequests",
  FundRequest: "fundRequests",
  MaintenanceRequest: "maintenanceRequests",
  PrintingRequest: "printingRequests",
  RiskReport: "riskReports"
}
```

### UserSlice

```javascript
state: { user: {...}, isLoading, isSuccess, isError, message }
```

- `login({ email, password })` — POST `/login`, saves to localStorage
- `logout()` — POST `/logout`, clears localStorage
- `setUser(payload)` — merge user and sync to localStorage

---

## 12. Database Collections & Indexes

| Collection            | Model              | Unique Index        |
| --------------------- | ------------------ | ------------------- |
| `users`               | User               | `staffId`, `email`  |
| `purchaseRequests`    | PurchaseRequest    | `requestId`         |
| `transportRequests`   | TransportRequest   | `requestId`         |
| `foodRequests`        | FoodRequest        | `requestId`         |
| `fundRequests`        | FundRequest        | `requestId`         |
| `maintenanceRequests` | MaintenanceRequest | `requestId`         |
| `printingRequests`    | PrintingRequest    | `requestId`         |
| `riskReports`         | RiskReport         | `requestId`         |
| `workflowSettings`    | WorkflowSettings   | `type`              |
| `notifications`       | Notification       | indexed on `userId` |
| `requestCounters`     | RequestCounter     | `key`               |

---

## 13. Key Conventions

| Convention              | Detail                                                                                    |
| ----------------------- | ----------------------------------------------------------------------------------------- |
| **Server Architecture** | Single `index.js` file for ALL routes and logic — no separate route/controller files      |
| **ES Modules**          | Both server and client use `import/export` (server `package.json` has `"type": "module"`) |
| **Components by Role**  | `admin/`, `handler/`, `employee/`, `shared/`, `auth/`, `layout/`, `ui/`                   |
| **UI Components**       | shadcn-style wrappers in `ui/` — do NOT modify unless explicitly asked                    |
| **Form Pattern**        | React Hook Form + Yup validation schemas                                                  |
| **Icons**               | lucide-react exclusively                                                                  |
| **Toasts**              | react-hot-toast                                                                           |
| **Class Merging**       | `cn()` utility from `lib/utils.js`                                                        |
| **ID Generation**       | `BUY`: atomic counter (padded 8 digits); all others: prefix + `Date.now()`                |

---

## 14. When Adding a New Request Type

1. **Model**: Create schema in `server/Models/` with `requestId`, `requesterId`, `status`, `approvalFlow[]`, `currentStep`, `assignedHandler`, `timestamps`
2. **Server routes**: Add POST (create + `applyWorkflow()`), GET (fetch), POST approve (`processGenericApproval()`)
3. **VALID_REQUEST_TYPES** in `server/index.js` — add the new type name
4. **Pending endpoint**: Add to `typeMap` array in `GET /requests/pending/:userId`
5. **Admin stats**: Add model to `STATS_MODELS` / admin endpoint aggregation
6. **Redux**: Add endpoint mapping in `processApproval` and `fetchRequestDetails` thunks
7. **WorkflowDashboard**: Add to `TYPE_META` array and `WF_T` translations (en + ar)
8. **HandlerDashboard**: Add to `TYPE_LABELS` and `getDisplayTitle()` switch
9. **TrackRequest**: Add panel rendering for the new type
10. **Admin RequestsTab**: Add to request type filters and detail panels

---

## 15. Environment Variables

```
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
PORT=5000
REACT_APP_API_URL=http://localhost:5000
```

---

## 16. Run Commands

```bash
# Server (port 5000)
cd server && npm install && npm run dev   # nodemon

# Client (port 3000)
cd client && npm install && npm start     # react-scripts
```

---

## 17. Common Patterns

### Creating a request (server-side):

```javascript
app.post("/exampleRequests", async (req, res) => {
  // 1. Validate fields
  // 2. Generate requestId (PREFIX + Date.now() or counter)
  // 3. new Model({...fields})
  // 4. await request.save()
  // 5. await applyWorkflow("ExampleRequest", request)
  // 6. res.status(201).json({ message, requestId })
});
```

### Approval endpoint:

```javascript
app.post("/exampleRequests/:requestId/approve", (req, res) =>
  processGenericApproval(ExampleRequest, req, res),
);
```

### Translation pattern (client):

```javascript
const translations = {
  en: { title: "Title", submit: "Submit" },
  ar: { title: "العنوان", submit: "إرسال" },
};
// Inside component:
const { lang } = useLanguage();
const t = translations[lang];
// Usage: <h1>{t.title}</h1>
```

### Dark mode compatible styling:

```jsx
// Use CSS variable-based Tailwind classes:
<div className="bg-background text-foreground border-border" />
<div className="bg-card text-card-foreground" />
<div className="bg-muted text-muted-foreground" />

// For hardcoded colors, add dark: variant:
<div className="bg-blue-50 dark:bg-blue-950" />
```
