'use strict';
const { db, audit } = require('../db/db');
const pw = require('../lib/password');
const jwt = require('../lib/jwt');
const config = require('../config');
const { HttpError } = require('../lib/http');
const { registerInput, clean } = require('../lib/validate');
const { requireAuth } = require('../lib/auth');

const issue = (u) => ({
  token: jwt.sign({ sub: u.id, role: u.role }, config.JWT_SECRET, config.JWT_EXPIRES),
  expiresIn: config.JWT_EXPIRES,
  user: { id: u.id, name: u.name, email: u.email, role: u.role },
});
// Dummy hash so unknown emails take the same time as wrong passwords (no user enumeration)
const DUMMY = pw.hash('not-a-real-password');

module.exports = (r) => {
  r.post('/api/auth/login', ({ body, ip }) => {
    const email = clean(body.email).toLowerCase();
    const u = db.prepare('SELECT u.id,u.name,u.email,u.password_hash,r.name role FROM users u JOIN roles r ON r.id=u.role_id WHERE email=?').get(email);
    const ok = pw.compare(String(body.password || ''), u ? u.password_hash : DUMMY);
    if (!u || !ok) { audit(null, 'LOGIN_FAILED', `Failed login for ${email.slice(0, 60)}`, ip); throw new HttpError(401, 'Wrong email or password.'); }
    audit(u, 'LOGIN', `Signed in as ${u.role}`, ip);
    return issue(u);
  });
  r.post('/api/auth/register', ({ body, ip }) => {
    const { errors, value } = registerInput(body);
    if (Object.keys(errors).length) throw new HttpError(400, 'Please fix the highlighted fields.', { errors });
    if (db.prepare('SELECT 1 FROM users WHERE email=?').get(value.email)) throw new HttpError(409, 'This email is already registered.');
    const rid = value.role === 'volunteer' ? 2 : 1;
    const info = db.prepare('INSERT INTO users(role_id,name,email,password_hash) VALUES (?,?,?,?)').run(rid, value.name, value.email, pw.hash(value.password));
    const u = { id: Number(info.lastInsertRowid), name: value.name, email: value.email, role: value.role };
    audit(u, 'USER_REGISTERED', `New ${u.role} account`, ip);
    return [201, issue(u)];
  });
  r.get('/api/auth/me', requireAuth, ({ req }) => ({ user: req.user }));
};
