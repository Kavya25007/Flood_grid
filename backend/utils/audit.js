const { sql, getPool } = require('../db');

async function logAction(userId, action, details) {
  try {
    const pool = await getPool();
    await pool.request()
      .input('u', sql.Int, userId)
      .input('a', sql.VarChar(50), action)
      .input('d', sql.VarChar(300), details || null)
      .query('INSERT INTO AuditLog (UserId, Action, Details) VALUES (@u, @a, @d)');
  } catch (err) {
    console.error('Audit log failed:', err.message);
  }
}

module.exports = { logAction };
