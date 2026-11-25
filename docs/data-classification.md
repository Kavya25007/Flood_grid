# Data Classification (DP-900)

| Data | Type | Stored in |
|---|---|---|
| Users, Roles, HelpRequests, Assignments, AuditLog, Camps, StockItems, StockMovements, DeliveryProofs (blob name only) | Structured | Azure SQL Database |
| Activity events as JSON documents (login, create, accept) | Semi-structured | Azure Cosmos DB (container `events`, partition key /userId) |
| Delivery proof photos | Unstructured | Azure Blob Storage (private container `proofs`) |
| Analytics (requests by status and type, response time) | Derived from structured data | Power BI report on Azure SQL |

All data is dummy data. No real personal data is stored.
