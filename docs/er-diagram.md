# ER Diagram

```mermaid
erDiagram
  Roles ||--o{ Users : has
  Users ||--o{ HelpRequests : creates
  HelpRequests ||--o| Assignments : "assigned via"
  Users ||--o{ Assignments : accepts
  Users ||--o{ AuditLog : performs

  Roles { int RoleId PK
    varchar RoleName UK }
  Users { int UserId PK
    varchar FullName
    varchar Email UK
    varchar PasswordHash
    int RoleId FK }
  HelpRequests { int RequestId PK
    int CitizenId FK
    varchar Type
    varchar Urgency
    varchar Location
    varchar Status }
  Assignments { int AssignmentId PK
    int RequestId FK
    int VolunteerId FK
    datetime AcceptedAt
    datetime DeliveredAt }
  AuditLog { int LogId PK
    int UserId FK
    varchar Action
    varchar Details }
```

**Normalization (3NF):** every table has a single primary key and each non-key column depends only on that key. Role names live in `Roles`, not in `Users`. The volunteer for a request lives in `Assignments`, not in `HelpRequests`.

**Constraints:** foreign keys on all relations, CHECK on `Type`, `Urgency`, `Status`, UNIQUE on `Users.Email` and `Assignments.RequestId`.
**Indexes:** `IX_HelpRequests_Status`, `IX_HelpRequests_Citizen`.
**View:** `vw_OpenRequests`. **Stored procedure with transaction:** `sp_AcceptRequest`. **Trigger:** `trg_RequestStatusAudit`.
