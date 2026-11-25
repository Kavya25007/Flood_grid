// Run once: node setupProof.js
require('dotenv').config();
const { getPool } = require('./db');

(async () => {
  const pool = await getPool();
  await pool.request().query(`
    IF OBJECT_ID('DeliveryProofs') IS NULL
    CREATE TABLE DeliveryProofs (
      ProofId    INT IDENTITY(1,1) PRIMARY KEY,
      RequestId  INT NOT NULL UNIQUE FOREIGN KEY REFERENCES HelpRequests(RequestId),
      BlobName   VARCHAR(200) NOT NULL,
      UploadedBy INT NOT NULL FOREIGN KEY REFERENCES Users(UserId),
      UploadedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME()
    );
  `);
  console.log('DeliveryProofs table ready');
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
