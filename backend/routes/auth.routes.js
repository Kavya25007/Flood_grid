const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sql, getPool } = require('../db');
const { validateLogin } = require('../middleware/validate');
const { logAction } = require('../utils/audit');

router.post('/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;
    const pool = await getPool();
    const result = await pool.request()
      .input('e', sql.VarChar(150), email)
      .query(`SELECT u.UserId, u.FullName, u.PasswordHash, r.RoleName
              FROM Users u JOIN Roles r ON r.RoleId = u.RoleId
              WHERE u.Email = @e`);
    const user = result.recordset[0];
    if (!user || !(await bcrypt.compare(password, user.PasswordHash))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const token = jwt.sign(
      { id: user.UserId, role: user.RoleName, name: user.FullName },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );
    await logAction(user.UserId, 'LOGIN', null);
    res.json({ token, role: user.RoleName, name: user.FullName });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
