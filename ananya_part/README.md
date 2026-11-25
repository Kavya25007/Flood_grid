# FloodGrid: Secure Disaster Relief Coordination Platform

Team: Ananya Srivastava, Kavya Kushwaha

FloodGrid coordinates flood relief. Citizens raise help requests, volunteers accept and deliver them, and admins see analytics and a full audit log. Built for the Integrated Full-Stack Project (System Design, RDBMS, DP-900, Cloud Security).

## Features
- Login with roles: citizen, volunteer, admin (JWT, bcrypt)
- Citizen: create help request (type, urgency, location), track status
- Volunteer: open requests sorted by urgency, accept (transaction), mark delivered
- Admin: stats (by status, type, average response time) and audit log
- Audit trail through an application log and a database trigger

## Tech stack
React (Vite), Node.js + Express, Azure SQL. Planned: Azure Blob Storage, Cosmos DB, Power BI, App Service.

## Project structure
```
frontend/   React app
backend/    Express API (routes, middleware, utils)
database/   schema.sql (tables, view, stored procedure, trigger)
docs/       ER diagram, architecture, API list, threat model, security checklist, data classification
```

## Setup
1. Clone the repo.
2. Backend: `cd backend`, `npm install`, copy `.env.example` to `.env` and fill values.
3. Database (once): `node setupUsers.js` then `node setupDb.js`
4. Start API: `npm start` and check http://localhost:5000/api/health
5. Frontend: `cd frontend`, `npm install`, `npm run dev`, open http://localhost:5173

## Test logins (dummy data)
| Role | Email | Password |
|---|---|---|
| Citizen | citizen@test.com | Test@1234 |
| Volunteer | volunteer@test.com | Test@1234 |
| Admin | admin@test.com | Test@1234 |

## Documents
See the `docs/` folder.

## Credits
React, Express, mssql, bcryptjs, jsonwebtoken, helmet, express-rate-limit, axios, react-router-dom. AI tools (Claude) were used as an aid for planning and code drafting; both members have reviewed the code and can explain it.
