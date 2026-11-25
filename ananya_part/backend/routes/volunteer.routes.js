const router = require('express').Router();
const { sql, getPool } = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');
const { logAction } = require('../utils/audit');

// Open requests, most urgent first (uses the vw_OpenRequests view)
router.get('/', verifyToken, requireRole('volunteer', 'admin'), async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT RequestId AS id, Type AS type, Urgency AS urgency, Location AS location,
             Description AS description, CitizenName AS citizenName, 'OPEN' AS status
      FROM vw_OpenRequests
      ORDER BY CASE Urgency WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
               CreatedAt`);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Requests this volunteer has accepted
router.get('/accepted', verifyToken, requireRole('volunteer'), async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('v', sql.Int, req.user.id)
      .query(`SELECT r.RequestId AS id, r.Type AS type, r.Urgency AS urgency, r.Location AS location,
                     r.Description AS description, r.Status AS status
              FROM Assignments a JOIN HelpRequests r ON r.RequestId = a.RequestId
              WHERE a.VolunteerId = @v ORDER BY a.AcceptedAt DESC`);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Accept a request: stored procedure runs the transaction
router.put('/:id/accept', verifyToken, requireRole('volunteer'), async (req, res) => {
  const requestId = parseInt(req.params.id, 10);
  if (Number.isNaN(requestId)) return res.status(400).json({ message: 'Invalid id' });
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('RequestId', sql.Int, requestId)
      .input('VolunteerId', sql.Int, req.user.id)
      .execute('sp_AcceptRequest');
    if (result.recordset[0].ok === 0) {
      return res.status(409).json({ message: 'Request already accepted or not found' });
    }
    await logAction(req.user.id, 'REQUEST_ACCEPTED', `Request ${requestId}`);
    res.json({ message: 'Request accepted', status: 'ACCEPTED' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark my accepted request as delivered
router.put('/:id/deliver', verifyToken, requireRole('volunteer'), async (req, res) => {
  const requestId = parseInt(req.params.id, 10);
  if (Number.isNaN(requestId)) return res.status(400).json({ message: 'Invalid id' });
  try {
    const pool = await getPool();
    const own = await pool.request()
      .input('id', sql.Int, requestId).input('v', sql.Int, req.user.id)
      .query('SELECT 1 AS ok FROM Assignments WHERE RequestId = @id AND VolunteerId = @v');
    if (!own.recordset.length) return res.status(403).json({ message: 'Not your request' });
    const upd = await pool.request().input('id', sql.Int, requestId)
      .query("UPDATE HelpRequests SET Status = 'DELIVERED' WHERE RequestId = @id AND Status = 'ACCEPTED'");
    if (upd.rowsAffected[0] === 0) return res.status(409).json({ message: 'Request is not in accepted state' });
    await pool.request().input('id', sql.Int, requestId)
      .query('UPDATE Assignments SET DeliveredAt = SYSDATETIME() WHERE RequestId = @id');
    await logAction(req.user.id, 'REQUEST_DELIVERED', `Request ${requestId}`);
    res.json({ message: 'Marked delivered', status: 'DELIVERED' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
