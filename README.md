<div align="center">
# 🌊 FloodGrid
 
### Secure Disaster Relief Coordination Platform
 
*One secure system for flood help requests, volunteers, relief camps and stock.*
 
![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-1F6FEB)
![Node](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-0C1B33)
![Azure SQL](https://img.shields.io/badge/Database-Azure%20SQL-F5A524)
![Security](https://img.shields.io/badge/Auth-JWT%20%2B%20bcrypt-0E7A3A)
 
*Integrated Full-Stack Project: System Design · RDBMS · DP-900 · Cloud Security*
 
</div>
---
 
## 📌 Problem
 
During floods, relief coordination happens over scattered WhatsApp messages and phone calls. This causes **missed or duplicate requests, wrongly allocated stock and no accountability**.
 
FloodGrid brings everything into one secure system: citizens raise requests, volunteers accept and deliver them, NGOs manage camps and stock, and every action is stored with an audit trail.
 
## ✨ Features
 
| Area | What it does |
|---|---|
| 🔐 Role-based login | Citizen, Volunteer, NGO and Admin each see only their own screen |
| 🆘 Help requests | Type (food, medical, rescue, shelter), urgency and location, tracked as OPEN → ACCEPTED → DELIVERED |
| 🙋 Volunteer workflow | Open requests sorted by urgency, accept safely (no double accept), mark delivered with an optional proof photo |
| 🏕️ Camps and stock | NGO creates camps, adds stock and allocates it to requests. Stock can never go below zero |
| 📸 Delivery proof | JPG/PNG photo (max 5 MB) stored in Azure Blob Storage, shown only to people allowed to see it |
| 📊 Admin dashboard | Counts, average response time, requests by type, total stock and the latest audit log |
| 🧾 Audit trail | Every important action is logged in SQL, and as a JSON event in Cosmos DB |
 
## 👥 Users and Roles
 
| Role | What they can do |
|---|---|
| **Citizen** | Raise help requests and track their status |
| **Volunteer** | View open requests, accept one, mark it delivered with proof |
| **NGO** | Create relief camps, add stock, allocate stock to requests |
| **Admin** | View analytics, total stock and the audit log |
 
## 🏗️ Architecture
 
```text
 React (Vite)  ──HTTPS──►  Node.js / Express API  ──►  Azure SQL Database
 role dashboards              JWT · RBAC · validation      requests, camps, stock, audit
                                    │
                                    ├──►  Azure Blob Storage   delivery proof photos
                                    ├──►  Azure Cosmos DB      activity events (JSON)
                                    └──►  Azure Key Vault      secrets (managed identity)
 
 Power BI  ◄──  reporting views in Azure SQL
```
 
The built frontend is served by the same Express app, so the whole project runs on **one Azure App Service URL**.
 
## 🗄️ Database Design (Azure SQL)
 
| Table | Purpose |
|---|---|
| `Roles`, `Users` | Accounts and roles |
| `HelpRequests`, `Assignments` | Requests and which volunteer accepted them |
| `DeliveryProofs` | Blob name of each proof photo |
| `Camps`, `StockItems`, `StockMovements` | Relief camps, stock per camp, and every stock change |
| `AuditLog` | Who did what and when |
 
- **Views:** `vw_OpenRequests`, `vw_StockSummary`, `vw_PowerBI_Requests`, `vw_PowerBI_Stock`
- **Stored procedures with transactions:** `sp_AcceptRequest`, `sp_AllocateStock`
- **Trigger:** `trg_RequestStatusAudit` writes every status change to the audit log
- **Constraints:** primary and foreign keys, CHECK on type, urgency, status and quantity, UNIQUE on email and on one assignment per request
- Details: [`docs/er-diagram.md`](docs/er-diagram.md)
## ☁️ Azure Services
 
| Service | Use | Status |
|---|---|---|
| Azure SQL Database | Main relational data | Live |
| Azure App Service | Hosts frontend and backend on one URL | Live |
| Azure Blob Storage | Private container for proof photos | Implemented in code, switches on with environment variables |
| Azure Cosmos DB (NoSQL) | Activity events, partition key `/userId` | Implemented in code, switches on with environment variables |
| Azure Key Vault | Secrets through managed identity | Setup steps in [`docs/azure-setup.md`](docs/azure-setup.md) |
| Power BI | Analytics on the SQL views | Guide in [`docs/powerbi-guide.md`](docs/powerbi-guide.md) |
 
Without the Blob and Cosmos settings the app still works normally. Photo upload and event logging are simply skipped.
 
## 🔒 Security Measures
 
- Passwords hashed with bcrypt, JWT authentication
- Role-based access control on every route
- Parameterized SQL queries, input validation, upload type and size limits
- Helmet, CORS and rate limiting on login
- Transactions for accepting requests and moving stock
- Audit log for user actions
- Secrets only in `.env` (git-ignored) or Key Vault, never in the repository
- Azure SQL firewall rules and HTTPS only
- More: [`docs/threat-model.md`](docs/threat-model.md), [`docs/security-checklist.md`](docs/security-checklist.md), [`docs/data-classification.md`](docs/data-classification.md)
## 🧰 Tech Stack
 
| Layer | Tools |
|---|---|
| Frontend | React, Vite, react-router-dom, axios |
| Backend | Node.js, Express 5, mssql, multer |
| Database | Azure SQL (T-SQL) |
| Cloud | App Service, Blob Storage, Cosmos DB, Key Vault, Power BI |
| Security | JWT, bcryptjs, helmet, express-rate-limit, cors |
 
## 📁 Project Structure
 
```text
frontend/        React app (pages, components, theme)
backend/         Express API, routes, middleware, setup scripts
backend/public/  Production frontend build served by Express
database/        schema.sql, schema_camps.sql
docs/            architecture, ER diagram, API list, security, Azure and Power BI guides
prototype/       3D prototype of the platform
```
 
## 🚀 Run Locally
 
**1. Clone**
 
```bash
git clone https://github.com/Kavya25007/Flood_grid.git
cd Flood_grid
```
 
**2. Backend**
 
```bash
cd backend
npm install
```
 
Create `backend/.env` (never commit it):
 
```env
DB_SERVER=your-server.database.windows.net
DB_NAME=your-database-name
DB_USER=your-username
DB_PASSWORD=your-password
JWT_SECRET=any-long-random-string
PORT=5000
```
 
Optional, for proof photos and events:
 
```env
AZURE_STORAGE_CONNECTION_STRING=...
BLOB_CONTAINER=proofs
COSMOS_ENDPOINT=...
COSMOS_KEY=...
```
 
Create tables and sample data once, then start:
 
```bash
node setupUsers.js
node setupDb.js
node setupProof.js     # optional, proof photo table
node setupCamps.js     # optional, camps, stock and NGO user
npm start
```
 
**3. Frontend**
 
```bash
cd frontend
npm install
npm run dev        # development
npm run build      # production build, copy dist to backend/public
```
 
## 🔑 Test Logins (dummy data only)
 
| Role | Email | Password |
|---|---|---|
| Citizen | citizen@test.com | Test@1234 |
| Volunteer | volunteer@test.com | Test@1234 |
| Admin | admin@test.com | Test@1234 |
| NGO (after `setupCamps.js`) | ngo@test.com | Test@1234 |
 
## 🔌 API Overview
 
| Method | Endpoint | Role | Purpose |
|---|---|---|---|
| POST | `/api/auth/login` | public | Login, returns token |
| POST | `/api/requests` | citizen | Create a help request |
| GET | `/api/requests/mine` | citizen | Own requests |
| GET | `/api/requests` | volunteer, admin | Open requests, most urgent first |
| PUT | `/api/requests/:id/accept` | volunteer | Accept (transaction) |
| PUT | `/api/requests/:id/deliver` | volunteer | Deliver, optional proof photo |
| GET | `/api/requests/:id/proof` | allowed roles | View proof photo |
| GET/POST | `/api/ngo/...` | ngo | Camps, stock, allocation |
| GET | `/api/admin/stats`, `/stock`, `/audit` | admin | Analytics and audit log |
| GET | `/api/health` | public | Backend and database status |
 
Full list: [`docs/api-list.md`](docs/api-list.md)
 
## 👩‍💻 Team
 
| Member | UID |
|---|---|
| Ananya Srivastava | 25LBCS3220 |
| Kavya Kushwaha | 25LBCS3217 |
 
Both members committed to this repository.
 
## 🙏 Credits
 
React, Express, mssql, bcrypt, jsonwebtoken. AI tools were used as an aid for planning and drafting, and all code is understood and explainable by the team.
 