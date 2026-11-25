-- Relief camps and stock (NGO module). Safe to run more than once.

IF OBJECT_ID('Camps') IS NULL
CREATE TABLE Camps (
  CampId    INT IDENTITY(1,1) PRIMARY KEY,
  Name      VARCHAR(100) NOT NULL,
  Location  VARCHAR(200) NOT NULL,
  Capacity  INT NOT NULL CHECK (Capacity > 0),
  CreatedBy INT NOT NULL FOREIGN KEY REFERENCES Users(UserId),
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);
GO

IF OBJECT_ID('StockItems') IS NULL
CREATE TABLE StockItems (
  StockId  INT IDENTITY(1,1) PRIMARY KEY,
  CampId   INT NOT NULL FOREIGN KEY REFERENCES Camps(CampId),
  ItemName VARCHAR(60) NOT NULL,
  Unit     VARCHAR(20) NOT NULL,
  Quantity INT NOT NULL CHECK (Quantity >= 0),
  CONSTRAINT UQ_StockItems_Camp_Item UNIQUE (CampId, ItemName)
);
GO

IF OBJECT_ID('StockMovements') IS NULL
CREATE TABLE StockMovements (
  MovementId INT IDENTITY(1,1) PRIMARY KEY,
  StockId    INT NOT NULL FOREIGN KEY REFERENCES StockItems(StockId),
  RequestId  INT NULL FOREIGN KEY REFERENCES HelpRequests(RequestId),
  QtyChange  INT NOT NULL,
  Reason     VARCHAR(20) NOT NULL CHECK (Reason IN ('ADDED','ALLOCATED')),
  CreatedBy  INT NOT NULL FOREIGN KEY REFERENCES Users(UserId),
  CreatedAt  DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_StockItems_Camp')
CREATE INDEX IX_StockItems_Camp ON StockItems(CampId);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_StockMovements_Stock')
CREATE INDEX IX_StockMovements_Stock ON StockMovements(StockId);
GO

-- View: stock per camp (join)
CREATE OR ALTER VIEW vw_StockSummary AS
SELECT c.CampId, c.Name AS CampName, c.Location, c.Capacity,
       s.StockId, s.ItemName, s.Unit, s.Quantity
FROM Camps c LEFT JOIN StockItems s ON s.CampId = c.CampId;
GO

-- View for the Power BI report: one row per request with timings in minutes
CREATE OR ALTER VIEW vw_PowerBI_Requests AS
SELECT r.RequestId, r.Type, r.Urgency, r.Status, r.Location, r.CreatedAt,
       a.AcceptedAt, a.DeliveredAt,
       DATEDIFF(MINUTE, r.CreatedAt, a.AcceptedAt)   AS ResponseMinutes,
       DATEDIFF(MINUTE, a.AcceptedAt, a.DeliveredAt) AS DeliveryMinutes
FROM HelpRequests r LEFT JOIN Assignments a ON a.RequestId = r.RequestId;
GO

-- View for the Power BI report: stock movements per camp and item
CREATE OR ALTER VIEW vw_PowerBI_Stock AS
SELECT c.Name AS CampName, s.ItemName, s.Unit, s.Quantity AS CurrentQuantity,
       m.Reason, m.QtyChange, m.CreatedAt AS MovementAt
FROM StockItems s
JOIN Camps c ON c.CampId = s.CampId
LEFT JOIN StockMovements m ON m.StockId = s.StockId;
GO

-- Stored procedure with a transaction: allocate stock to a request without going below zero
CREATE OR ALTER PROCEDURE sp_AllocateStock
  @StockId INT, @Qty INT, @RequestId INT, @UserId INT
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    BEGIN TRAN;
    UPDATE StockItems SET Quantity = Quantity - @Qty
    WHERE StockId = @StockId AND Quantity >= @Qty;
    IF @@ROWCOUNT = 0 BEGIN ROLLBACK; SELECT 0 AS ok; RETURN; END
    INSERT INTO StockMovements (StockId, RequestId, QtyChange, Reason, CreatedBy)
    VALUES (@StockId, @RequestId, -@Qty, 'ALLOCATED', @UserId);
    COMMIT;
    SELECT 1 AS ok;
  END TRY
  BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK;
    THROW;
  END CATCH
END
GO
