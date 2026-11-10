const router = require('express').Router();
const { sql, getPool } = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validate');
const { logAction } = require('../utils/audit');

// Citizen creates a help request
router.post('/', verifyToken, requireRole('citizen'), validateRequest, async (req, res) => {
  try {
    const { type, urgency, location, description } = req.body;
    const pool = await getPool();
    const result = await pool.request()
      .input('c', sql.Int, req.user.id)
      .input('t', sql.VarChar(20), type)
      .input('u', sql.VarChar(10), urgency)
      .input('l', sql.VarChar(200), location)
      .input('d', sql.VarChar(500), description)
      .query(`INSERT INTO HelpRequests (CitizenId, Type, Urgency, Location, Description)
              OUTPUT INSERTED.RequestId
              VALUES (@c, @t, @u, @l, @d)`);
    const id = result.recordset[0].RequestId;
    await logAction(req.user.id, 'REQUEST_CREATED', `Request ${id} (${type}, ${urgency})`);
    res.status(201).json({ id, status: 'OPEN' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Citizen sees own requests
router.get('/mine', verifyToken, requireRole('citizen'), async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('c', sql.Int, req.user.id)
      .query(`SELECT r.RequestId AS id, r.Type AS type, r.Urgency AS urgency, r.Location AS location,
                     r.Description AS description, r.Status AS status, v.FullName AS volunteer
              FROM HelpRequests r
              LEFT JOIN Assignments a ON a.RequestId = r.RequestId
              LEFT JOIN Users v ON v.UserId = a.VolunteerId
              WHERE r.CitizenId = @c ORDER BY r.CreatedAt DESC`);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
