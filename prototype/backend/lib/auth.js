'use strict';
const jwt = require('./jwt');
const { HttpError } = require('./http');
const config = require('../config');
const { db } = require('../db/db');

/** Reads Bearer token (or ?token= for EventSource), loads the user, attaches req.user. */
function authenticate(req) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : new URL(req.url, 'http://x').searchParams.get('token');
  const p = jwt.verify(token, config.JWT_SECRET);
  if (!p) throw new HttpError(401, 'Please log in again (session missing or expired).');
  const u = db.prepare('SELECT u.id,u.name,u.email,r.name role FROM users u JOIN roles r ON r.id=u.role_id WHERE u.id=?').get(p.sub);
  if (!u) throw new HttpError(401, 'Account not found.');
  req.user = { ...u, exp: p.exp };
}
const requireAuth = (ctx) => authenticate(ctx.req);
const requireRole = (...roles) => (ctx) => {
  authenticate(ctx.req);
  if (!roles.includes(ctx.req.user.role)) throw new HttpError(403, 'Your role is not allowed to do this.');
};
module.exports = { requireAuth, requireRole };
