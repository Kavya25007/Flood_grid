const router = require('express').Router();
const { getPool } = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken, requireRole('admin'));

// Analytics for the admin dashboard
router.get('/stats', async (req, res) => {
  try {
    const pool = await getPool();
    const byStatus = await pool.request().query(
      'SELECT Status AS label, COUNT(*) AS value FROM HelpRequests GROUP BY Status');
    const byType = await pool.request().query(
      'SELECT Type AS label, COUNT(*) AS value FROM HelpRequests GROUP BY Type');
    const avg = await pool.request().query(
      'SELECT AVG(DATEDIFF(MINUTE, r.CreatedAt, a.AcceptedAt)) AS avgMinutes FROM Assignments a JOIN HelpRequests r ON r.RequestId = a.RequestId');
    res.json({
      byStatus: byStatus.recordset,
      byType: byType.recordset,
      avgResponseMinutes: avg.recordset[0].avgMinutes || 0,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Latest audit log entries
router.get('/audit', async (req, res) => {
  try {
    const pool = await getPool();
    const r = await pool.request().query(`
      SELECT TOP 50 l.LogId AS id, ISNULL(u.FullName, 'system') AS who, l.Action AS action,
             l.Details AS details, l.CreatedAt AS createdAt
      FROM AuditLog l LEFT JOIN Users u ON u.UserId = l.UserId
      ORDER BY l.LogId DESC`);
    res.json(r.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
