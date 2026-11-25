'use strict';
const http = require('node:http');
const config = require('./config');
const { Router, HttpError, readJson, send, serveStatic, } = require('./lib/http');
const { limiter } = require('./lib/ratelimit');
const { requireAuth } = require('./lib/auth');
const events = require('./lib/events');
const { seed } = require('./db/seed');

const router = new Router();
router.get('/api/health', () => ({ ok: true, time: new Date().toISOString() }));
router.get('/api/stream', requireAuth, ({ res }) => { events.subscribe(res); return { __stream: true }; });
require('./routes/auth')(router);
require('./routes/requests')(router);
require('./routes/admin')(router);

const loginLimit = limiter({ windowMs: 15 * 60_000, max: 20 });   // brute-force protection
const apiLimit = limiter({ windowMs: 60_000, max: 300 });

function createServer() {
  return http.createServer(async (req, res) => {
    const ip = req.socket.remoteAddress;
    const url = new URL(req.url, 'http://localhost');
    try {
      if (!url.pathname.startsWith('/api/')) {
        if (req.method !== 'GET') throw new HttpError(405, 'Method not allowed');
        return serveStatic(config.CLIENT_DIR, url.pathname, res);
      }
      const rl = apiLimit(ip); if (!rl.ok) throw new HttpError(429, 'Too many requests. Slow down.');
      if (/^\/api\/auth\/(login|register)$/.test(url.pathname)) {
        const l = loginLimit(ip); if (!l.ok) throw new HttpError(429, `Too many attempts. Try again in ${l.retry}s.`);
      }
      const m = router.match(req.method, url.pathname);
      if (!m) throw new HttpError(404, 'API route not found');
      const ctx = { req, res, ip, params: m.params, query: url.searchParams,
        body: ['POST', 'PUT'].includes(req.method) ? await readJson(req) : {} };
      let out;
      for (const h of m.r.handlers) { const x = await h(ctx); if (x !== undefined) out = x; }
      if (out && out.__stream) return;
      if (out && out.__raw !== undefined) return send(res, 200, out.__raw, { 'Content-Type': out.type, ...out.headers });
      if (Array.isArray(out)) return send(res, out[0], out[1]);
      send(res, 200, out ?? { ok: true });
    } catch (e) {
      if (e instanceof HttpError) return send(res, e.status, { error: e.message, ...(e.extra || {}) });
      console.error(e);
      send(res, 500, { error: 'Something went wrong on our side.' });
    }
  });
}
module.exports = { createServer };
if (require.main === module) {
  if (seed(false)) console.log('Demo data seeded.');
  createServer().listen(config.PORT, () => console.log(`FloodGrid running -> http://localhost:${config.PORT}`));
}
