'use strict';
// In-memory sliding-window rate limiter keyed by IP.
function limiter({ windowMs, max }) {
  const hits = new Map();
  setInterval(() => { const now = Date.now(); for (const [k, v] of hits) if (v.reset < now) hits.delete(k); }, windowMs).unref();
  return (key) => {
    const now = Date.now();
    let h = hits.get(key);
    if (!h || h.reset < now) { h = { n: 0, reset: now + windowMs }; hits.set(key, h); }
    h.n++;
    return { ok: h.n <= max, retry: Math.ceil((h.reset - now) / 1000) };
  };
}
module.exports = { limiter };
