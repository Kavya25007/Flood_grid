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

## Final cloud security configuration

| Control | Status |
|---|---|
| No secrets in GitHub (`.env` is git-ignored, `.env.example` has placeholders only) | Done |
| Upload limits: JPG or PNG only, 5 MB maximum, random blob names | Done (code) |
| Role checks on every route (citizen, volunteer, ngo, admin) | Done (code) |
| Stock changes inside transactions, CHECK constraint stops negative stock | Done (code) |
| Audit log in SQL plus activity events to Cosmos DB | Done (code, active when Cosmos env vars are set) |
| Blob container `proofs` private, photos streamed only through an authorised API | Done (code, active when Blob env vars are set) |
| Secrets in Key Vault with managed identity | Documented in docs/azure-setup.md, applied at deployment |
| SQL firewall tightening, HTTPS Only, TLS 1.2 | Documented in docs/azure-setup.md, applied at deployment |
