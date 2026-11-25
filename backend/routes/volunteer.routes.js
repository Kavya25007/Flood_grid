const router = require('express').Router();
const multer = require('multer');
const { sql, getPool } = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');
const { logAction } = require('../utils/audit');
const blob = require('../utils/blob');

// Proof photo: JPG or PNG up to 5 MB, kept in memory then sent to Azure Blob Storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (['image/jpeg', 'image/png'].includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPG or PNG images are allowed'));
  },
});
const proofUpload = (req, res, next) =>
  upload.single('proof')(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message });
    next();
  });

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

// Mark my accepted request as delivered, with an optional proof photo
router.put('/:id/deliver', verifyToken, requireRole('volunteer'), proofUpload, async (req, res) => {
  const requestId = parseInt(req.params.id, 10);
  if (Number.isNaN(requestId)) return res.status(400).json({ message: 'Invalid id' });
  try {
    const pool = await getPool();
    const own = await pool.request()
      .input('id', sql.Int, requestId).input('v', sql.Int, req.user.id)
      .query(`SELECT r.Status FROM Assignments a JOIN HelpRequests r ON r.RequestId = a.RequestId
              WHERE a.RequestId = @id AND a.VolunteerId = @v`);
    if (!own.recordset.length) return res.status(403).json({ message: 'Not your request' });
    if (own.recordset[0].Status !== 'ACCEPTED') {
      return res.status(409).json({ message: 'Request is not in accepted state' });
    }

    let proofSaved = false;
    if (req.file && blob.enabled()) {
      try {
        const name = await blob.uploadProof(req.file.buffer, req.file.mimetype, requestId);
        await pool.request()
          .input('r', sql.Int, requestId).input('b', sql.VarChar(200), name).input('u', sql.Int, req.user.id)
          .query('INSERT INTO DeliveryProofs (RequestId, BlobName, UploadedBy) VALUES (@r, @b, @u)');
        proofSaved = true;
      } catch (err) {
        console.error('Proof upload failed:', err.message);
        return res.status(502).json({ message: 'Could not store the proof photo. Try again.' });
      }
    }

    await pool.request().input('id', sql.Int, requestId)
      .query("UPDATE HelpRequests SET Status = 'DELIVERED' WHERE RequestId = @id AND Status = 'ACCEPTED'");
    await pool.request().input('id', sql.Int, requestId)
      .query('UPDATE Assignments SET DeliveredAt = SYSDATETIME() WHERE RequestId = @id');
    await logAction(req.user.id, 'REQUEST_DELIVERED', `Request ${requestId}${proofSaved ? ' with proof' : ''}`);
    res.json({ message: 'Marked delivered', status: 'DELIVERED', proof: proofSaved });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
