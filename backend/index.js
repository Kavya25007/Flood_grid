require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { getPool } = require('./db');

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '50kb' }));

app.get('/api/health', async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request().query('SELECT 1 AS ok');
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', db: 'not connected' });
  }
});

// brute-force protection on login
app.use('/api/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { message: 'Too many attempts, try later' } }));

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/requests', require('./routes/citizen.routes'));
app.use('/api/requests', require('./routes/volunteer.routes'));
app.use('/api/admin', require('./routes/admin.routes'));

const path = require('path');

app.use(express.static(path.join(__dirname, 'public')));

app.get(/^\/(?!api).*/, (req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));