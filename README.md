# Digital Platform — UTAS Employee Portal

![MERN Stack](https://img.shields.io/badge/Stack-MERN-blue?style=for-the-badge&logo=mongodb)
![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)
![Express](https://img.shields.io/badge/Express-5.1-lightgrey?style=for-the-badge&logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-9-green?style=for-the-badge&logo=mongodb)
![Node.js](https://img.shields.io/badge/Node.js-ESM-green?style=for-the-badge&logo=node.js)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38B2AC?style=for-the-badge&logo=tailwind-css)

A comprehensive digital platform and service request portal developed for the **University of Technology and Applied Sciences (UTAS)**. This system digitizes and automates intra-departmental requests across the university, seamlessly managing approval workflows with robust admin controls.

## 🚀 Features

- **7 Core Request Types Digitized:**
  - 🛒 Purchase Requests (General & Software)
  - 🚍 Transport Requests
  - 🍔 Food Requests
  - 💰 Fund Requests
  - 🛠️ Maintenance Requests
  - 🖨️ Printing Requests (with doc uploads)
  - ⚠️ Risk Reports
- **Dynamic Workflow Engine (Two Modes):**
  - *Chain Mode:* Sequential multi-level approvals.
  - *Group Mode:* Round-robin automated delegation among handlers.
- **Role-Based Access Control (RBAC):**
  - *Employees:* Submit and track requests.
  - *IT Staff / Handlers:* Process specific departmental requests.
  - *Admins:* Full system configuration, dashboard metrics, user and workflow management.
- **Internationalization (i18n):**
  - Fully bilingual (English / Arabic) with seamless RTL layout support.
- **Secure File Uploads:**
  - Profile images and secure PDF/DOCX uploads via Multer.
- **Modern UI/UX:**
  - Responsive design powered by Tailwind CSS 3 and customized shadcn/ui components.

## 🛠️ Technology Stack

### Frontend (Client)
- **Framework:** React 19
- **State Management:** Redux Toolkit
- **Routing:** React Router 7
- **Forms & Validation:** React Hook Form + Yup
- **Styling:** Tailwind CSS 3 & shadcn/ui
- **HTTP Client:** Axios (with JWT Interceptors)

### Backend (Server)
- **Runtime:** Node.js (ES Modules)
- **Framework:** Express 5.1
- **Database:** MongoDB & Mongoose 9
- **Authentication:** JWT (JSON Web Tokens) & bcryptjs
- **Upload Management:** Multer
- **Security:** express-rate-limit

## 📂 Project Structure

```text
digital-platform/
├── client/              # React frontend workspace
│   ├── src/
│   │   ├── components/  # Admin, Employee, Handler & Shared views
│   │   ├── Features/    # Redux Slices
│   │   └── lib/         # API interceptors & utilities
│   └── public/
└── server/              # Node.js backend workspace
    ├── index.js         # Entry point, API routes, middleware
    ├── Models/          # Mongoose Schemas (User, Requests, Workflows)
    └── uploads/         # Static assets and user uploads
```

## ⚙️ How to Run Locally

### Prerequisites
- Node.js (v18+)
- MongoDB connection string (Atlas or Local)

### 1. Backend Setup
```bash
cd server
npm install
```
Create a `.env` file in the `/server` directory:
```env
PORT=8080
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0...
JWT_SECRET=your_super_secret_jwt_key
```
Start the server:
```bash
npm run dev
```

### 2. Frontend Setup
```bash
cd client
npm install
```
Create a `.env` file in the `/client` directory:
```env
REACT_APP_API_URL=http://localhost:8080
```
Start the client application:
```bash
npm start
```
The React app will typically run on `http://localhost:3000`.

## 🛡️ Security

This project implements rate limiting, password hashing via bcrypt, and securely signed JWT cookies/Authorizations headers mapped over Role-Based endpoints ensuring end-to-end access validation.

## 📄 License
Created for University of Technology and Applied Sciences. All rights reserved.
