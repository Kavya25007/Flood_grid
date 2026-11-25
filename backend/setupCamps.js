// Run once: node setupCamps.js  (after setupUsers.js and setupDb.js)
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { sql, getPool } = require('./db');

(async () => {
  const pool = await getPool();
  const text = fs.readFileSync(path.join(__dirname, '..', 'database', 'schema_camps.sql'), 'utf8');
  const batches = text.split(/^\s*GO\s*$/im).map((b) => b.trim()).filter(Boolean);
  for (const b of batches) await pool.request().query(b);
  console.log('camp tables, views and procedure ready');

  // NGO test user
  const hash = await bcrypt.hash('Test@1234', 10);
  await pool.request()
    .input('h', sql.VarChar(100), hash)
    .query(`IF NOT EXISTS (SELECT 1 FROM Users WHERE Email = 'ngo@test.com')
            INSERT INTO Users (FullName, Email, PasswordHash, RoleId)
            SELECT 'Helping Hands NGO', 'ngo@test.com', @h, RoleId FROM Roles WHERE RoleName = 'ngo'`);

  const c = await pool.request().query('SELECT COUNT(*) AS n FROM Camps');
  if (c.recordset[0].n === 0) {
    const u = await pool.request().query("SELECT UserId FROM Users WHERE Email = 'ngo@test.com'");
    const uid = u.recordset[0].UserId;
    const camps = [
      ['Aliganj Relief Camp', 'Aliganj, Lucknow', 200],
      ['Indira Nagar Shelter', 'Indira Nagar, Lucknow', 150],
    ];
    const items = [['Rice', 'kg', 500], ['Drinking water', 'bottles', 1000], ['Medicine kits', 'kits', 80], ['Blankets', 'pieces', 200]];
    for (const [name, loc, cap] of camps) {
      const r = await pool.request()
        .input('n', sql.VarChar(100), name).input('l', sql.VarChar(200), loc)
        .input('c', sql.Int, cap).input('u', sql.Int, uid)
        .query('INSERT INTO Camps (Name, Location, Capacity, CreatedBy) OUTPUT INSERTED.CampId VALUES (@n,@l,@c,@u)');
      const campId = r.recordset[0].CampId;
      for (const [item, unit, qty] of items) {
        const s = await pool.request()
          .input('c', sql.Int, campId).input('i', sql.VarChar(60), item)
          .input('un', sql.VarChar(20), unit).input('q', sql.Int, qty)
          .query('INSERT INTO StockItems (CampId, ItemName, Unit, Quantity) OUTPUT INSERTED.StockId VALUES (@c,@i,@un,@q)');
        await pool.request()
          .input('s', sql.Int, s.recordset[0].StockId).input('q', sql.Int, qty).input('u', sql.Int, uid)
          .query("INSERT INTO StockMovements (StockId, QtyChange, Reason, CreatedBy) VALUES (@s,@q,'ADDED',@u)");
      }
    }
    console.log('seeded 2 camps with stock');
  }
  const t = await pool.request().query('SELECT COUNT(*) AS n FROM vw_StockSummary WHERE StockId IS NOT NULL');
  console.log('stock rows in view:', t.recordset[0].n);
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
