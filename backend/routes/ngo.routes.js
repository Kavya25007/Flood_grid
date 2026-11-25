const router = require('express').Router();
const { sql, getPool } = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');
const { logAction } = require('../utils/audit');

router.use(verifyToken);

const clean = (s) => String(s || '').trim().replace(/[<>]/g, '');
const posInt = (v, max) => Number.isInteger(v) && v > 0 && v <= max;

// Camps with their stock (NGO and admin can read)
router.get('/camps', requireRole('ngo', 'admin'), async (req, res) => {
  try {
    const pool = await getPool();
    const r = await pool.request().query(
      'SELECT CampId, CampName, Location, Capacity, StockId, ItemName, Unit, Quantity FROM vw_StockSummary ORDER BY CampId, ItemName');
    const camps = {};
    for (const row of r.recordset) {
      if (!camps[row.CampId]) {
        camps[row.CampId] = { id: row.CampId, name: row.CampName, location: row.Location, capacity: row.Capacity, stock: [] };
      }
      if (row.StockId) {
        camps[row.CampId].stock.push({ id: row.StockId, item: row.ItemName, unit: row.Unit, quantity: row.Quantity });
      }
    }
    res.json(Object.values(camps));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Requests that can still receive relief (open or accepted)
router.get('/requests', requireRole('ngo', 'admin'), async (req, res) => {
  try {
    const pool = await getPool();
    const r = await pool.request().query(
      `SELECT RequestId AS id, Type AS type, Urgency AS urgency, Location AS location, Status AS status
       FROM HelpRequests WHERE Status IN ('OPEN','ACCEPTED') ORDER BY CreatedAt DESC`);
    res.json(r.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a relief camp
router.post('/camps', requireRole('ngo'), async (req, res) => {
  const name = clean(req.body.name);
  const location = clean(req.body.location);
  const capacity = Number(req.body.capacity);
  if (name.length < 3 || name.length > 100) return res.status(400).json({ message: 'Camp name must be 3-100 characters' });
  if (location.length < 3 || location.length > 200) return res.status(400).json({ message: 'Location must be 3-200 characters' });
  if (!posInt(capacity, 100000)) return res.status(400).json({ message: 'Capacity must be a positive number' });
  try {
    const pool = await getPool();
    const r = await pool.request()
      .input('n', sql.VarChar(100), name).input('l', sql.VarChar(200), location)
      .input('c', sql.Int, capacity).input('u', sql.Int, req.user.id)
      .query('INSERT INTO Camps (Name, Location, Capacity, CreatedBy) OUTPUT INSERTED.CampId VALUES (@n,@l,@c,@u)');
    await logAction(req.user.id, 'CAMP_CREATED', `Camp ${r.recordset[0].CampId} (${name})`);
    res.status(201).json({ id: r.recordset[0].CampId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add stock to a camp (creates the item or increases its quantity) inside a transaction
router.post('/stock', requireRole('ngo'), async (req, res) => {
  const campId = Number(req.body.campId);
  const item = clean(req.body.itemName);
  const unit = clean(req.body.unit);
  const quantity = Number(req.body.quantity);
  if (!posInt(campId, 1e9)) return res.status(400).json({ message: 'Choose a camp' });
  if (item.length < 2 || item.length > 60) return res.status(400).json({ message: 'Item name must be 2-60 characters' });
  if (unit.length < 1 || unit.length > 20) return res.status(400).json({ message: 'Unit must be 1-20 characters' });
  if (!posInt(quantity, 1000000)) return res.status(400).json({ message: 'Quantity must be a positive number' });

  const pool = await getPool();
  const tx = new sql.Transaction(pool);
  try {
    await tx.begin();
    const camp = await new sql.Request(tx).input('c', sql.Int, campId).query('SELECT 1 AS ok FROM Camps WHERE CampId = @c');
    if (!camp.recordset.length) { await tx.rollback(); return res.status(404).json({ message: 'Camp not found' }); }
    const existing = await new sql.Request(tx)
      .input('c', sql.Int, campId).input('i', sql.VarChar(60), item)
      .query('SELECT StockId FROM StockItems WITH (UPDLOCK) WHERE CampId = @c AND ItemName = @i');
    let stockId;
    if (existing.recordset.length) {
      stockId = existing.recordset[0].StockId;
      await new sql.Request(tx).input('s', sql.Int, stockId).input('q', sql.Int, quantity)
        .query('UPDATE StockItems SET Quantity = Quantity + @q WHERE StockId = @s');
    } else {
      const ins = await new sql.Request(tx)
        .input('c', sql.Int, campId).input('i', sql.VarChar(60), item)
        .input('u', sql.VarChar(20), unit).input('q', sql.Int, quantity)
        .query('INSERT INTO StockItems (CampId, ItemName, Unit, Quantity) OUTPUT INSERTED.StockId VALUES (@c,@i,@u,@q)');
      stockId = ins.recordset[0].StockId;
    }
    await new sql.Request(tx)
      .input('s', sql.Int, stockId).input('q', sql.Int, quantity).input('u', sql.Int, req.user.id)
      .query("INSERT INTO StockMovements (StockId, QtyChange, Reason, CreatedBy) VALUES (@s,@q,'ADDED',@u)");
    await tx.commit();
    await logAction(req.user.id, 'STOCK_ADDED', `Stock ${stockId} +${quantity} ${unit} ${item}`);
    res.status(201).json({ stockId });
  } catch (err) {
    console.error(err);
    try { await tx.rollback(); } catch { /* already rolled back */ }
    res.status(500).json({ message: 'Server error' });
  }
});

// Allocate stock to a request (stored procedure with a transaction, never below zero)
router.post('/allocate', requireRole('ngo'), async (req, res) => {
  const stockId = Number(req.body.stockId);
  const requestId = Number(req.body.requestId);
  const quantity = Number(req.body.quantity);
  if (!posInt(stockId, 1e9) || !posInt(requestId, 1e9)) return res.status(400).json({ message: 'Choose a stock item and a request' });
  if (!posInt(quantity, 1000000)) return res.status(400).json({ message: 'Quantity must be a positive number' });
  try {
    const pool = await getPool();
    const reqRow = await pool.request().input('r', sql.Int, requestId)
      .query("SELECT 1 AS ok FROM HelpRequests WHERE RequestId = @r AND Status IN ('OPEN','ACCEPTED')");
    if (!reqRow.recordset.length) return res.status(404).json({ message: 'Request not found or already delivered' });
    const result = await pool.request()
      .input('StockId', sql.Int, stockId).input('Qty', sql.Int, quantity)
      .input('RequestId', sql.Int, requestId).input('UserId', sql.Int, req.user.id)
      .execute('sp_AllocateStock');
    if (result.recordset[0].ok === 0) return res.status(409).json({ message: 'Not enough stock for this allocation' });
    await logAction(req.user.id, 'STOCK_ALLOCATED', `Stock ${stockId} x${quantity} to request ${requestId}`);
    res.json({ message: 'Stock allocated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
