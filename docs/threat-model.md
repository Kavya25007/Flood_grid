# Threat Model (one page)

**System:** React frontend, Express API, Azure SQL. Users: citizen, volunteer, admin.
**Assets:** user accounts, help requests (location data), audit log, secrets (DB password, JWT secret).

| # | Threat | Where | Mitigation |
|---|---|---|---|
| 1 | SQL injection | All API inputs | Parameterized queries only (`.input()`), type checks, stored procedure for accept |
| 2 | Cross-site scripting (XSS) | Request description and location | Server strips `<` and `>`, React escapes output, helmet security headers |
| 3 | Password theft | Users table | Passwords stored as bcrypt hashes (cost 10), never returned by the API |
| 4 | Brute-force login | POST /auth/login | Rate limit of 20 attempts per 15 minutes, generic error message |
| 5 | Stolen or forged token | Browser to API | JWT signed with secret, 2 hour expiry, verified on every request |
| 6 | Privilege escalation | API routes | Role check middleware (`requireRole`) on each route, frontend ProtectedRoute |
| 7 | Secret leakage | Git repository | `.env` in `.gitignore`, `.env.example` has no values, production secrets go in Azure Key Vault |
| 8 | Database exposed to internet | Azure SQL | Firewall rules allow only known IPs and Azure services, encrypted connection (TLS) |
| 9 | Tampering with records | AuditLog | Trigger writes every status change, application logs login, create and accept actions |
| 10 | Double acceptance of one request | Accept flow | Transaction inside `sp_AcceptRequest`, unique constraint on `Assignments.RequestId` |

**Residual risk:** token is kept in browser localStorage (acceptable for a college project; httpOnly cookies are the next step).
