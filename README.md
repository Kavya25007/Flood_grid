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
| Admin | Manage camps and inventory, view the audit log |

## Current Status

Working end to end:
- Login with role-based access
- Citizen creates a help request
- Volunteer views open requests and accepts one
- Data is stored in Azure SQL
- Backend API is connected to Azure SQL
- Frontend and backend are integrated
- Frontend production build is generated and served by the backend
- Health check confirms that the backend and database are connected

Currently working on:
- End-to-end testing
- Azure App Service deployment and configuration
- Remaining Azure services and final integration

Planned for the final submission:
- Relief camp and stock management with transactions
- Delivery proof upload using Azure Blob Storage
- Activity/event data using Cosmos DB
- Analytics dashboard using Power BI
- Key Vault for secure secret management
- Final cloud security configuration

## Tech Stack

- Frontend: React
- Backend: Node.js, Express
- Database: Azure SQL (relational)
- Authentication: JWT, bcrypt
- Security: Helmet, CORS, rate limiting, parameterized SQL queries
- Planned: Azure Blob Storage, Cosmos DB, Key Vault, App Service, Power BI

## Project Structure

```text
frontend/       React app
backend/        Express API and server
backend/public/ Production frontend build
database/       schema.sql and sample data
README.md
```

## Setup Steps

### 1. Clone the repository

```bash
git clone <REPO_LINK>
cd <REPO_FOLDER>
```

### 2. Database

1. Create an Azure SQL database.
2. In the server firewall settings, allow your IP address.
3. Run `database/schema.sql` to create the tables, then run the sample data script.

### 3. Backend

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` folder (never commit this file):

```env
DB_SERVER=your-server.database.windows.net
DB_NAME=your-database-name
DB_USER=your-username
DB_PASSWORD=your-password
JWT_SECRET=any-long-random-string
PORT=5000
```

Start the server:

```bash
npm start
```

The backend runs on port `5000` by default.

### 4. Frontend

For development:

```bash
cd frontend
npm install
npm run dev
```

For a production build:

```bash
npm run build
```

The generated frontend files are copied to `backend/public` and can be served by the Express backend.

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
| POST | /api/auth/login | Login and receive a token |
| POST | /api/requests | Citizen creates a help request |
| GET | /api/requests | List open requests |
| PUT | /api/requests/:id/accept | Volunteer accepts a request |
| GET | /api/health | Check backend and database connection |

## Security Measures

- Passwords hashed with bcrypt
- JWT-based authentication
- Role-based access control on routes
- Parameterized SQL queries to reduce SQL injection risk
- Input validation for user-provided data
- Helmet security middleware
- CORS configuration
- Rate limiting on login attempts
- Secrets kept in `.env`, which is listed in `.gitignore`
- Azure SQL firewall rule restricting database access
- Audit log of user actions

## Team

- Member 1: Ananya Srivastava, 25LBCS3220
- Member 2: Kavya Kushwaha, 25LBCS3217

## Credits

- React, Express, mssql, bcrypt, jsonwebtoken
- AI tools were used as an aid for planning and drafting, and all code is understood and explainable by the team.
