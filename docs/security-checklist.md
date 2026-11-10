# Security Checklist

| Requirement | Status | Where to see it |
|---|---|---|
| Login with role-based access | Done | `backend/middleware/auth.js`, `ProtectedRoute.jsx` |
| Hashed passwords | Done | bcrypt in `setupUsers.js` and `auth.routes.js` |
| HTTPS | Done on Azure App Service (enforce HTTPS only setting) | App Service, TLS/SSL settings |
| Secrets kept out of repository | Done | `.env` ignored, `.env.example` |
| Input validation (SQL injection, XSS) | Done | `validate.js`, parameterized queries |
| Firewall or network rule on database | Done | Azure SQL server, Networking, firewall rules |
| Activity log | Done | `AuditLog` table, trigger, `/api/admin/audit` |
| Rate limiting and security headers | Done | `helmet`, `express-rate-limit` in `index.js` |
