-- FloodGrid: Azure SQL (T-SQL) version of the schema for the RDBMS / DP-900 part of the project.
CREATE TABLE Roles (RoleId INT PRIMARY KEY, Name NVARCHAR(20) NOT NULL UNIQUE);
CREATE TABLE Users (UserId INT IDENTITY PRIMARY KEY, RoleId INT NOT NULL REFERENCES Roles(RoleId), Name NVARCHAR(80) NOT NULL,
  Email NVARCHAR(255) NOT NULL UNIQUE, PasswordHash NVARCHAR(255) NOT NULL, CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
CREATE TABLE HelpRequests (RequestId INT IDENTITY PRIMARY KEY, CitizenId INT NOT NULL REFERENCES Users(UserId),
  Type NVARCHAR(10) NOT NULL CHECK (Type IN ('food','medical','rescue','shelter')),
  Urgency NVARCHAR(10) NOT NULL CHECK (Urgency IN ('low','medium','high','critical')),
  Location NVARCHAR(200) NOT NULL CHECK (LEN(Location) >= 3), Phone NVARCHAR(25) NULL, Description NVARCHAR(500) NOT NULL DEFAULT '',
  Status NVARCHAR(10) NOT NULL DEFAULT 'OPEN' CHECK (Status IN ('OPEN','ACCEPTED','DELIVERED')), CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
CREATE TABLE Assignments (AssignmentId INT IDENTITY PRIMARY KEY, RequestId INT NOT NULL UNIQUE REFERENCES HelpRequests(RequestId),
  VolunteerId INT NOT NULL REFERENCES Users(UserId), AcceptedAt DATETIME2 NOT NULL, DeliveredAt DATETIME2 NULL);
CREATE TABLE AuditLog (AuditId INT IDENTITY PRIMARY KEY, At DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), UserId INT NULL REFERENCES Users(UserId),
  UserName NVARCHAR(80) NOT NULL DEFAULT 'system', Action NVARCHAR(40) NOT NULL, Details NVARCHAR(400) NOT NULL DEFAULT '', Ip NVARCHAR(64) NULL);
CREATE INDEX IX_Req_Status ON HelpRequests(Status, Urgency);
GO
CREATE VIEW vw_OpenRequests AS
  SELECT r.*, u.Name AS CitizenName, CASE r.Urgency WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END AS UrgencyRank
  FROM HelpRequests r JOIN Users u ON u.UserId = r.CitizenId WHERE r.Status = 'OPEN';
GO
CREATE PROCEDURE sp_AcceptRequest @RequestId INT, @VolunteerId INT AS
BEGIN
  SET NOCOUNT ON; BEGIN TRAN;
  UPDATE HelpRequests SET Status='ACCEPTED' WHERE RequestId=@RequestId AND Status='OPEN';
  IF @@ROWCOUNT = 0 BEGIN ROLLBACK; THROW 50001, 'Request already accepted', 1; END
  INSERT INTO Assignments(RequestId,VolunteerId,AcceptedAt) VALUES (@RequestId,@VolunteerId,SYSUTCDATETIME());
  COMMIT;
END
GO
CREATE TRIGGER trg_StatusChange ON HelpRequests AFTER UPDATE AS
BEGIN
  INSERT INTO AuditLog(Action,Details) SELECT 'STATUS_CHANGE', CONCAT('Request ', i.RequestId, ': ', d.Status, ' -> ', i.Status)
  FROM inserted i JOIN deleted d ON d.RequestId=i.RequestId WHERE i.Status <> d.Status;
END
