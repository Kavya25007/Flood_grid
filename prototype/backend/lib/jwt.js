'use strict';
// Minimal HS256 JWT (sign/verify) using Node crypto.
const crypto = require('node:crypto');
const b64 = (b) => Buffer.from(b).toString('base64url');
const sig = (data, secret) => crypto.createHmac('sha256', secret).update(data).digest('base64url');

function sign(payload, secret, expiresIn) {
  const now = Math.floor(Date.now() / 1000);
  const head = b64(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = b64(JSON.stringify({ ...payload, iat: now, exp: now + expiresIn }));
  return `${head}.${body}.${sig(`${head}.${body}`, secret)}`;
}
function verify(token, secret) {
  if (typeof token !== 'string') return null;
  const p = token.split('.');
  if (p.length !== 3) return null;
  const good = Buffer.from(sig(`${p[0]}.${p[1]}`, secret));
  const got = Buffer.from(p[2]);
  if (good.length !== got.length || !crypto.timingSafeEqual(good, got)) return null;
  try {
    const hdr = JSON.parse(Buffer.from(p[0], 'base64url'));
    if (hdr.alg !== 'HS256') return null;
    const body = JSON.parse(Buffer.from(p[1], 'base64url'));
    if (!body.exp || body.exp < Math.floor(Date.now() / 1000)) return null;
    return body;
  } catch { return null; }
}
module.exports = { sign, verify };
