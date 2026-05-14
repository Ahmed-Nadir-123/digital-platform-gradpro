# Digital Platform — UTAS Employee Portal

## Overview

MERN stack (MongoDB, Express 5, React 19, Node.js ESM) employee portal for the University of Technology and Applied Sciences (UTAS). Employees submit 7 types of service requests; admins configure approval workflows; IT Staff handle/approve requests.

## Tech Stack

| Layer | Tech |
|---|---|
| **Server** | Express 5.1, Mongoose 9, bcrypt, jsonwebtoken, multer, express-rate-limit, dotenv |
| **Client** | React 19, Redux Toolkit, React Router 7, React Hook Form + Yup, Axios, Tailwind CSS 3, lucide-react icons, react-hot-toast |
| **UI Library** | shadcn-style components in `client/src/components/ui/` (card, button, input, dialog, table, etc.) |
| **Database** | MongoDB (single DB, collections per model) |

## Project Structure

```
├── .github/
│   ├── agents/code-reviewer.agent.md
│   └── copilot-instructions.md          ← this file
├── server/
│   ├── index.js                         ← ALL routes, middleware, helpers (~1500 lines)
│   ├── Models/                          ← Mongoose schemas
│   │   ├── User.js                      ← staffId, personal_name, role, email, password
│   │   ├── PurchaseRequest.js           ← requestCategory: Purchase|Software
│   │   ├── TransportRequest.js
│   │   ├── FoodRequest.js
│   │   ├── FundRequest.js
│   │   ├── MaintenanceRequest.js
│   │   ├── PrintingRequest.js           ← fileUrl for uploaded documents
│   │   ├── RiskReport.js
│   │   ├── WorkflowSettings.js          ← chain/group workflow config per type
│   │   ├── RequestCounter.js            ← auto-increment for request IDs
│   │   └── Notification.js              ← bilingual in-app notifications
│   ├── uploads/                         ← profiles/, printing/
│   └── seedUsers.js
├── client/
│   ├── src/
│   │   ├── App.js                       ← routes: /, /dashboard, /help-desk, /track-request, /digital-requests
│   │   ├── Features/
│   │   │   ├── DigitalRequestSlice.js   ← Redux thunks for requests & approvals
│   │   │   └── UserSlice.js             ← login/logout, localStorage persistence
│   │   ├── lib/
│   │   │   ├── api.js                   ← Axios instance with JWT interceptor
│   │   │   ├── LanguageContext.js        ← ar/en toggle, RTL support
│   │   │   └── utils.js                 ← cn() for Tailwind class merging
│   │   ├── components/
│   │   │   ├── admin/                   ← AdminDashboard, WorkflowDashboard, OverviewTab, RequestsTab, UsersTab
│   │   │   ├── handler/                 ← HandlerDashboard (IT Staff pending approvals)
│   │   │   ├── employee/               ← DigitalRequests (4-type form), PrintRequestForm
│   │   │   ├── shared/                  ← HelpDesk, TrackRequest, NotificationBell
│   │   │   ├── auth/                    ← AuthPage (login)
│   │   │   ├── layout/                  ← Home (sidebar + header shell)
│   │   │   └── ui/                      ← shadcn components (do NOT modify unless asked)
│   │   ├── Validations/                 ← Yup schemas
│   │   └── Store/Store.js               ← Redux store
│   └── public/
├── .env                                 ← MONGODB_URI, JWT_SECRET, PORT
└── README.md
```

## 7 Request Types

| Type | Model | ID Prefix | Endpoint Slug |
|---|---|---|---|
| Purchase Request | `PurchaseRequest` | `BUY` | `purchaseRequests` |
| Transport Request | `TransportRequest` | `TRN` | `transportRequests` |
| Food Request | `FoodRequest` | `FOOD` | `foodRequests` |
| Fund Request | `FundRequest` | `FUND` | `fundRequests` |
| Maintenance Request | `MaintenanceRequest` | `MNT` | `maintenanceRequests` |
| Printing Request | `PrintingRequest` | `PRN` | `printingRequests` |
| Risk Report | `RiskReport` | `RISK` | `riskReports` |

All models share: `requestId` (unique string), `requesterId` (ObjectId → User), `status`, `approvalFlow[]`, `currentStep`, `assignedHandler`, `timestamps`.

## Authentication & Authorization

- **JWT**: 8-hour expiry, stored in `localStorage`, sent as `Authorization: Bearer <token>`
- **Roles**: `"admin"` (full access), `"IT Staff"` (handle requests), `"employee"` (submit requests)
- **Middleware**: `requireAuth` (validates JWT → `req.user`), `requireAdmin` (checks role)
- **Rate limiting**: 10 login attempts per 15 minutes
- **Password**: bcrypt with 10 salt rounds
- **Client interceptor**: 401 → clear localStorage + redirect to `/`

## Workflow System (Critical Architecture)

Two approval modes configured per request type in `WorkflowSettings`:

### Chain Mode (Sequential Approval)
- Admin defines ordered steps: `[{sequence_value, role, approverId}]`
- On request creation, `applyWorkflow()` builds `approvalFlow[]` array, sets `currentStep = 1`
- Each step must approve before proceeding to next
- Rejection at any step → final status = `"Rejected"`

### Group Mode (Round-Robin Delegation)
- Admin defines handler pool: `[{handlerId, handlerName, handlerRole}]`
- On request creation, `applyWorkflow()` picks next handler via `roundRobinIndex`
- Assigned handler approves/rejects directly

### Key Functions (all in `server/index.js`)
- `applyWorkflow(requestType, request)` — reads WorkflowSettings, applies chain or group routing
- `processGenericApproval(Model, req, res)` — shared approval handler for all types
- `createNotification(userId, typeName, requestId, action)` — bilingual notification after approval/rejection

### Endpoint Pattern
- Create: `POST /{endpointSlug}` → calls `applyWorkflow()`
- Approve: `POST /{endpointSlug}/:requestId/approve` → calls `processGenericApproval()`
- Pending for handler: `GET /requests/pending/:userId`

## File Uploads (Multer)

| Upload | Path | Max Size | Allowed Types |
|---|---|---|---|
| Profile photo | `uploads/profiles/` | 2 MB | Images |
| Printing document | `uploads/printing/` | 10 MB | PDF, DOC, DOCX |

Static serving: `app.use("/uploads", express.static(...))`

## Internationalization

- **Default language**: Arabic (`"ar"`) with RTL
- **Toggle**: `useLanguage()` hook from `LanguageContext.js`
- **Pattern**: Each component has a translation object `{ en: {...}, ar: {...} }` and uses `t = translations[lang]`
- Admin translations: `adminTranslations.js`
- Request form translations: `DigitalRequests.translations.js`
- Workflow translations: inline `WF_T` object in `WorkflowDashboard.js`

## Important Conventions

### Code Style
- **Server**: Single `index.js` file for all routes and logic (no separate route/controller files)
- **Client**: Components organized by role → `admin/`, `handler/`, `employee/`, `shared/`, `auth/`, `layout/`, `ui/`
- **ES Modules**: Both server and client use `import/export` (server `package.json` has `"type": "module"`)
- **Component pattern**: Functional components with hooks, Redux for async state, React Hook Form + Yup for forms

### Request ID Generation
- Uses `RequestCounter` model with atomic `findOneAndUpdate` (upsert + $inc)
- Each type has a prefix (BUY, TRN, FOOD, etc.) + zero-padded counter

### State Management
- `DigitalRequestSlice.js` — thunks: `createPurchaseRequest`, `fetchPendingApprovals`, `processApproval`, `fetchRequestDetails`
- `UserSlice.js` — thunks: `login`, `logout`; action: `setUser`
- Endpoint maps in thunks map `requestType` string → API slug

### Admin Features
- `GET /admin/stats` — aggregated dashboard stats (user count, request counts by status)
- `GET /admin/requests` — all requests of all 7 types
- `DELETE /admin/requests/:requestId/:requestType` — delete any request
- `GET /admin/workflows` — all workflow configs
- `PUT /admin/workflows/:requestType` — upsert workflow config
- User CRUD: `POST/PUT/DELETE /admin/users`

### UI System
- Tailwind CSS with `cn()` utility for class merging (from `lib/utils.js`)
- shadcn-style components in `ui/` — wrapper components around native elements
- Icons from `lucide-react`
- Toast notifications via `react-hot-toast`

## When Adding a New Request Type

1. **Model**: Create schema in `server/Models/` with `requestId`, `requesterId`, `status`, `approvalFlow[]`, `currentStep`, `assignedHandler`, `timestamps`
2. **Server routes**: Add POST (create + `applyWorkflow()`), GET (fetch), POST approve (`processGenericApproval()`)
3. **VALID_REQUEST_TYPES** array in `server/index.js` — add the new type name
4. **Pending endpoint**: Add to `typeMap` array in `GET /requests/pending/:userId`
5. **Admin stats**: Add model to `STATS_MODELS` array
6. **Redux**: Add endpoint mapping in `processApproval` and `fetchRequestDetails` thunks
7. **WorkflowDashboard**: Add to `TYPE_META` array and `WF_T` translations
8. **HandlerDashboard**: Add to `TYPE_LABELS` and `getDisplayTitle()` switch
9. **TrackRequest**: Add panel rendering for the new type
10. **Admin RequestsTab**: Add to request type filters and detail panels

## Environment Variables

```
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
PORT=8080
REACT_APP_API_URL=http://localhost:8080
```

## Run Commands

```bash
# Server
cd server && npm install && npm run dev   # nodemon

# Client
cd client && npm install && npm start     # react-scripts (port 3000)
```
