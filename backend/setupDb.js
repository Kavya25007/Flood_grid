// Run once: node setupDb.js   (needs Users table from setupUsers.js first)
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { sql, getPool } = require('./db');

(async () => {
  const pool = await getPool();
  const text = fs.readFileSync(path.join(__dirname, '..', 'database', 'schema.sql'), 'utf8');
  const batches = text.split(/^\s*GO\s*$/im).map((b) => b.trim()).filter(Boolean);

  // First batch holds the three CREATE TABLEs; run each only if missing
  const tables = batches[0].split(/;\s*\n(?=CREATE TABLE)/i);
  for (const stmt of tables) {
    const name = /CREATE TABLE (\w+)/i.exec(stmt)[1];
    const exists = await pool.request().query(`SELECT OBJECT_ID('${name}') AS id`);
    if (!exists.recordset[0].id) {
      await pool.request().query(stmt);
      console.log('created table', name);
    } else console.log('table exists', name);
  }
  for (const b of batches.slice(1)) {
    await pool.request().query(b);
  }
  console.log('view, procedure and trigger ready');

  const c = await pool.request().query('SELECT COUNT(*) AS n FROM HelpRequests');
  if (c.recordset[0].n === 0) {
    const u = await pool.request().query("SELECT UserId FROM Users WHERE Email='citizen@test.com'");
    const cid = u.recordset[0].UserId;
    const seed = [
      ['food', 'high', 'Ward 12, Aliganj', 'Family of 5 needs dry ration'],
      ['medical', 'critical', 'Ward 4, Chowk', 'Elderly person needs insulin'],
      ['rescue', 'critical', 'Gomti Nagar Sector 2', 'Stuck on first floor, water rising'],
      ['shelter', 'medium', 'Indira Nagar', 'Need temporary shelter for 3 people'],
      ['food', 'low', 'Rajajipuram', 'Drinking water needed'],
    ];
    for (const [t, ug, l, d] of seed) {
      await pool.request()
        .input('c', sql.Int, cid).input('t', sql.VarChar(20), t).input('u', sql.VarChar(10), ug)
        .input('l', sql.VarChar(200), l).input('d', sql.VarChar(500), d)
        .query('INSERT INTO HelpRequests (CitizenId, Type, Urgency, Location, Description) VALUES (@c,@t,@u,@l,@d)');
    }
    console.log('seeded 5 requests');
  }
  const open = await pool.request().query('SELECT COUNT(*) AS n FROM vw_OpenRequests');
  console.log('open requests in view:', open.recordset[0].n);
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
