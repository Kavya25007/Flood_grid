-- FloodGrid schema (3NF). Roles and Users are created by backend/setupUsers.js
-- This file documents the request-side tables, view, procedure and trigger.

CREATE TABLE HelpRequests (
  RequestId   INT IDENTITY(1,1) PRIMARY KEY,
  CitizenId   INT NOT NULL FOREIGN KEY REFERENCES Users(UserId),
  Type        VARCHAR(20)  NOT NULL CHECK (Type IN ('food','medical','rescue','shelter')),
  Urgency     VARCHAR(10)  NOT NULL CHECK (Urgency IN ('low','medium','high','critical')),
  Location    VARCHAR(200) NOT NULL,
  Description VARCHAR(500) NULL,
  Status      VARCHAR(15)  NOT NULL DEFAULT 'OPEN' CHECK (Status IN ('OPEN','ACCEPTED','DELIVERED')),
  CreatedAt   DATETIME2    NOT NULL DEFAULT SYSDATETIME()
);
CREATE INDEX IX_HelpRequests_Status   ON HelpRequests(Status);
CREATE INDEX IX_HelpRequests_Citizen  ON HelpRequests(CitizenId);

CREATE TABLE Assignments (
  AssignmentId INT IDENTITY(1,1) PRIMARY KEY,
  RequestId    INT NOT NULL UNIQUE FOREIGN KEY REFERENCES HelpRequests(RequestId),
  VolunteerId  INT NOT NULL FOREIGN KEY REFERENCES Users(UserId),
  AcceptedAt   DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
  DeliveredAt  DATETIME2 NULL
);

CREATE TABLE AuditLog (
  LogId     INT IDENTITY(1,1) PRIMARY KEY,
  UserId    INT NULL FOREIGN KEY REFERENCES Users(UserId),
  Action    VARCHAR(50) NOT NULL,
  Details   VARCHAR(300) NULL,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);
GO

-- View: open requests with citizen name (join)
CREATE OR ALTER VIEW vw_OpenRequests AS
SELECT r.RequestId, r.Type, r.Urgency, r.Location, r.Description, r.CreatedAt, u.FullName AS CitizenName
FROM HelpRequests r JOIN Users u ON u.UserId = r.CitizenId
WHERE r.Status = 'OPEN';
GO

-- Stored procedure with a transaction: safe accept (no two volunteers get the same request)
CREATE OR ALTER PROCEDURE sp_AcceptRequest @RequestId INT, @VolunteerId INT AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    BEGIN TRAN;
    UPDATE HelpRequests SET Status = 'ACCEPTED' WHERE RequestId = @RequestId AND Status = 'OPEN';
    IF @@ROWCOUNT = 0 BEGIN ROLLBACK; SELECT 0 AS ok; RETURN; END
    INSERT INTO Assignments (RequestId, VolunteerId) VALUES (@RequestId, @VolunteerId);
    COMMIT;
    SELECT 1 AS ok;
  END TRY
  BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK;
    THROW;
  END CATCH
END
GO

-- Trigger: every status change is written to the audit log
CREATE OR ALTER TRIGGER trg_RequestStatusAudit ON HelpRequests AFTER UPDATE AS
BEGIN
  INSERT INTO AuditLog (UserId, Action, Details)
  SELECT NULL, 'STATUS_CHANGE', CONCAT('Request ', i.RequestId, ': ', d.Status, ' -> ', i.Status)
  FROM inserted i JOIN deleted d ON i.RequestId = d.RequestId
  WHERE i.Status <> d.Status;
END
GO
