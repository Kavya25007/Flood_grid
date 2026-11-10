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
| PUT | /requests/:id/deliver | volunteer | Mark my accepted request delivered |
| GET | /admin/stats | admin | Counts by status and type, average response time |
| GET | /admin/audit | admin | Latest 50 audit log entries |
