# Data Classification (DP-900)

| Data | Type | Stored in |
|---|---|---|
| Users, Roles, HelpRequests, Assignments, AuditLog | Structured | Azure SQL Database |
| Activity events as JSON documents (login, create, accept) | Semi-structured | Azure Cosmos DB (planned container `events`) |
| Delivery proof photos | Unstructured | Azure Blob Storage (planned container `proofs`) |
| Analytics (requests by status and type, response time) | Derived from structured data | Power BI report on Azure SQL |

All data is dummy data. No real personal data is stored.
