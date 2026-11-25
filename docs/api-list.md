# API List

Base URL: `/api`. Protected routes need header `Authorization: Bearer <JWT>`.

| Method | Endpoint | Role | Purpose |
|---|---|---|---|
| GET | /health | public | Server and database health |
| POST | /auth/login | public | Login, returns `{token, role, name}` |
| POST | /requests | citizen | Create a help request |
| GET | /requests/mine | citizen | Own requests with volunteer name |
| GET | /requests | volunteer, admin | Open requests, most urgent first |
| GET | /requests/accepted | volunteer | Requests accepted by me |
| PUT | /requests/:id/accept | volunteer | Accept a request (stored procedure, transaction) |
| PUT | /requests/:id/deliver | volunteer | Mark delivered, optional multipart field `proof` (JPG/PNG, max 5 MB) stored in Blob |
| GET | /admin/stats | admin | Counts by status and type, average response time |
| GET | /admin/audit | admin | Latest 50 audit log entries |
| GET | /requests/:id/proof | admin, ngo, owner, assigned volunteer | Stream delivery proof photo from Blob Storage |
| GET | /ngo/camps | ngo, admin | Camps with their stock |
| GET | /ngo/requests | ngo, admin | Open and accepted requests that can receive relief |
| POST | /ngo/camps | ngo | Create a camp |
| POST | /ngo/stock | ngo | Add stock to a camp (transaction) |
| POST | /ngo/allocate | ngo | Allocate stock to a request (sp_AllocateStock, transaction) |
| GET | /admin/stock | admin | Total stock per item across camps |
