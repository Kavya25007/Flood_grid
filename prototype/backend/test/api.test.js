'use strict';
process.env.DB_FILE = require('node:path').join(require('node:os').tmpdir(), `fg-test-${process.pid}.db`);
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { seed } = require('../db/seed');
const { createServer } = require('../index');
let srv, base;
before(async () => { seed(true); srv = createServer(); await new Promise((r) => srv.listen(0, r)); base = `http://localhost:${srv.address().port}`; });
after(() => srv.close());
const call = async (m, p, tok, body) => {
  const r = await fetch(base + p, { method: m, headers: { 'Content-Type': 'application/json', ...(tok && { Authorization: 'Bearer ' + tok }) }, body: body && JSON.stringify(body) });
  return { s: r.status, j: await r.json().catch(() => ({})) };
};
const login = async (who) => (await call('POST', '/api/auth/login', null, { email: `${who}@test.com`, password: 'Test@1234' })).j.token;

test('login works, wrong password rejected', async () => {
  assert.ok(await login('citizen'));
  assert.equal((await call('POST', '/api/auth/login', null, { email: 'citizen@test.com', password: 'bad' })).s, 401);
});
test('roles are enforced', async () => {
  const c = await login('citizen'), v = await login('volunteer');
  assert.equal((await call('GET', '/api/admin/stats', c)).s, 403);
  assert.equal((await call('GET', '/api/requests', c)).s, 403);
  assert.equal((await call('POST', '/api/requests', v, {})).s, 403);
  assert.equal((await call('GET', '/api/requests')).s, 401);
});
test('validation: short location and XSS stripped', async () => {
  const c = await login('citizen');
  const bad = await call('POST', '/api/requests', c, { type: 'food', urgency: 'low', location: 'ab', description: '' });
  assert.equal(bad.s, 400); assert.ok(bad.j.errors.location);
  const badPhone = await call('POST', '/api/requests', c, { type: 'food', urgency: 'low', location: 'Aliganj', phone: '12', description: '' });
  assert.equal(badPhone.s, 400); assert.ok(badPhone.j.errors.phone);
  const ok = await call('POST', '/api/requests', c, { type: 'food', urgency: 'low', location: 'Aliganj <script>', phone: '+91 98765 43210', description: '<img onerror=x>' });
  assert.equal(ok.s, 201); assert.ok(!ok.j.request.location.includes('<'));
  assert.equal(ok.j.request.phone, '+91 98765 43210');
});
test('full flow: create -> accept (409 for 2nd volunteer) -> deliver -> stats + audit', async () => {
  const c = await login('citizen'), v = await login('volunteer'), v2 = await login('sana'), a = await login('admin');
  const id = (await call('POST', '/api/requests', c, { type: 'rescue', urgency: 'critical', location: 'Gomti Nagar', description: 'help' })).j.request.id;
  const open = (await call('GET', '/api/requests', v)).j.requests;
  assert.equal(open[0].urgency, 'critical');
  assert.equal((await call('PUT', `/api/requests/${id}/accept`, v)).s, 200);
  assert.equal((await call('PUT', `/api/requests/${id}/accept`, v2)).s, 409);
  assert.equal((await call('PUT', `/api/requests/${id}/deliver`, v2)).s, 403);
  assert.equal((await call('PUT', `/api/requests/${id}/deliver`, v)).j.request.status, 'DELIVERED');
  const st = (await call('GET', '/api/admin/stats', a)).j; assert.ok(st.delivered >= 2 && st.avgResponseMinutes != null);
  const acts = (await call('GET', '/api/admin/audit?limit=50', a)).j.audit.map((x) => x.action);
  for (const x of ['LOGIN', 'REQUEST_CREATED', 'REQUEST_ACCEPTED', 'REQUEST_DELIVERED', 'STATUS_CHANGE']) assert.ok(acts.includes(x), x);
});
test('register + csv export + security headers', async () => {
  const r = await call('POST', '/api/auth/register', null, { name: 'Test User', email: 'new@x.com', password: 'Passw0rd1', role: 'citizen' });
  assert.equal(r.s, 201);
  assert.equal((await call('POST', '/api/auth/register', null, { name: 'T', email: 'bad', password: '1', role: 'admin' })).s, 400);
  const a = await login('admin');
  const res = await fetch(base + '/api/admin/audit.csv', { headers: { Authorization: 'Bearer ' + a } });
  assert.match(await res.text(), /time,user,action/);
  assert.ok((await fetch(base + '/')).headers.get('content-security-policy'));
});
