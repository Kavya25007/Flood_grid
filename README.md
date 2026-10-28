# FloodGrid: Secure Disaster Relief Coordination Platform

FloodGrid is a web platform that helps coordinate flood relief. Affected citizens raise help requests, volunteers accept and fulfil them, and every action is saved in a database with an audit trail.

> Integrated Full-Stack Project (System Design, RDBMS, DP-900, Cloud Security)

## Problem

During floods, relief coordination happens over scattered WhatsApp messages and phone calls. This causes missed or duplicate requests, wrongly allocated stock and no accountability. FloodGrid brings everything into one secure system.

## Users and Roles

| Role | What they can do |
|---|---|
| Citizen | Raise help requests and track their status |
| Volunteer | View open requests and accept them |
| NGO | Manage relief stock and deliveries (planned) |
| Admin | Manage camps and inventory, view the audit log (planned) |

## Current Status (Mid Review)

Working end to end:
- Login with role-based access
- Citizen creates a help request
- Volunteer views open requests and accepts one
- Data is stored in Azure SQL and the action is recorded in the audit log

Planned for the final submission:
- Relief camp and stock management with transactions
- Delivery proof upload (Azure Blob Storage)
- Analytics dashboard (Power BI)
- Cloud deployment (Azure App Service)

## Tech Stack

- Frontend: React
- Backend: Node.js, Express
- Database: Azure SQL (relational)
- Planned: Azure Blob Storage, Cosmos DB, Key Vault, App Service, Power BI

## Project Structure

```
frontend/    React app
backend/     Express API
database/    schema.sql and sample data
README.md
```

## Setup Steps

### 1. Clone the repository
```
git clone <REPO_LINK>
cd <REPO_FOLDER>
```

### 2. Database
1. Create an Azure SQL database.
2. In the server firewall settings, allow your IP address.
3. Run `database/schema.sql` to create the tables, then run the sample data script.

### 3. Backend
```
cd backend
npm install
```
Create a `.env` file in the `backend` folder (never commit this file):
```
DB_SERVER=your-server.database.windows.net
DB_NAME=your-database-name
DB_USER=your-username
DB_PASSWORD=your-password
JWT_SECRET=any-long-random-string
PORT=5000
```
Start the server:
```
npm start
```

### 4. Frontend
```
cd frontend
npm install
npm start
```
The app opens at `http://localhost:3000`.

## Test Logins (dummy data only)

| Role | Email | Password |
|---|---|---|
| Citizen | citizen@test.com | Test@1234 |
| Volunteer | volunteer@test.com | Test@1234 |
| Admin | admin@test.com | Test@1234 |

(Replace with the exact accounts from your sample data.)

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | /login | Login and receive a token |
| POST | /requests | Citizen creates a help request |
| GET | /requests | List open requests |
| PUT | /requests/:id/accept | Volunteer accepts a request |

## Security Measures

- Passwords hashed with bcrypt
- Role-based access control on routes
- Input validation against SQL injection and XSS (parameterized queries)
- Secrets kept in `.env`, which is listed in `.gitignore`
- Azure SQL firewall rule restricting database access
- Audit log of user actions

## Team

- Member 1: Ananya Srivastava, 25LBCS3220
- Member 2: Kavya Kushwaha, 25LBCS3217

## Credits

- React, Express, mssql, bcrypt, jsonwebtoken
- AI tools were used as an aid for planning and drafting, and all code is understood and explainable by the team.
