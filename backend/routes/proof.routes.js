const router = require('express').Router();
const { sql, getPool } = require('../db');
const { verifyToken } = require('../middleware/auth');
const blob = require('../utils/blob');

// Stream a delivery proof photo. Allowed: the citizen who asked, the volunteer who delivered, admin, ngo.
router.get('/:id/proof', verifyToken, async (req, res) => {
  const requestId = parseInt(req.params.id, 10);
  if (Number.isNaN(requestId)) return res.status(400).json({ message: 'Invalid id' });
  try {
    if (!blob.enabled()) return res.status(404).json({ message: 'Proof storage is not configured' });
    const pool = await getPool();
    const r = await pool.request().input('id', sql.Int, requestId).query(`
      SELECT p.BlobName, h.CitizenId, a.VolunteerId
      FROM DeliveryProofs p
      JOIN HelpRequests h ON h.RequestId = p.RequestId
      LEFT JOIN Assignments a ON a.RequestId = p.RequestId
      WHERE p.RequestId = @id`);
    const row = r.recordset[0];
    if (!row) return res.status(404).json({ message: 'No proof uploaded for this request' });
    const { id, role } = req.user;
    const allowed = role === 'admin' || role === 'ngo' || row.CitizenId === id || row.VolunteerId === id;
    if (!allowed) return res.status(403).json({ message: 'Access denied' });
    const dl = await blob.downloadProof(row.BlobName);
    res.setHeader('Content-Type', dl.contentType || 'image/jpeg');
    res.setHeader('Cache-Control', 'private, max-age=300');
    dl.readableStreamBody.pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
