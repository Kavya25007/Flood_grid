'use strict';
const { db, tx, audit } = require('../db/db');
const { HttpError } = require('../lib/http');
const { requestInput } = require('../lib/validate');
const { requireRole } = require('../lib/auth');
const events = require('../lib/events');

const SELECT = `SELECT r.id, r.type, r.urgency, r.location, r.phone, r.description, r.status, r.created_at AS createdAt,
  c.name AS citizen, v.name AS volunteer, a.accepted_at AS acceptedAt, a.delivered_at AS deliveredAt
  FROM help_requests r JOIN users c ON c.id=r.citizen_id
  LEFT JOIN assignments a ON a.request_id=r.id LEFT JOIN users v ON v.id=a.volunteer_id`;
const RANK = "CASE r.urgency WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END";
const one = (id) => db.prepare(SELECT + ' WHERE r.id=?').get(id);

module.exports = (r) => {
  r.post('/api/requests', requireRole('citizen'), ({ req, body, ip }) => {
    const { errors, value } = requestInput(body);
    if (Object.keys(errors).length) throw new HttpError(400, 'Please fix the highlighted fields.', { errors });
    const info = db.prepare('INSERT INTO help_requests(citizen_id,type,urgency,location,phone,description) VALUES (?,?,?,?,?,?)')
      .run(req.user.id, value.type, value.urgency, value.location, value.phone, value.description);
    const id = Number(info.lastInsertRowid);
    audit(req.user, 'REQUEST_CREATED', `Request ${id} (${value.type}, ${value.urgency})`, ip);
    events.publish('request', { id, status: 'OPEN', urgency: value.urgency });
    return [201, { request: one(id) }];
  });
  r.get('/api/requests/mine', requireRole('citizen'), ({ req }) =>
    ({ requests: db.prepare(SELECT + ' WHERE r.citizen_id=? ORDER BY r.id DESC').all(req.user.id) }));

  // open requests, most urgent first, then oldest first
  r.get('/api/requests', requireRole('volunteer', 'admin'), () =>
    ({ requests: db.prepare(SELECT + ` WHERE r.status='OPEN' ORDER BY ${RANK}, r.created_at`).all() }));
  r.get('/api/requests/accepted', requireRole('volunteer'), ({ req }) =>
    ({ requests: db.prepare(SELECT + ' WHERE a.volunteer_id=? ORDER BY r.status, r.id DESC').all(req.user.id) }));

  // Accept = atomic transaction. The WHERE status='OPEN' guard + UNIQUE(request_id) means only ONE volunteer can win.
  r.put('/api/requests/:id/accept', requireRole('volunteer'), ({ req, params, ip }) => {
    const id = +params.id;
    tx(() => {
      const upd = db.prepare("UPDATE help_requests SET status='ACCEPTED' WHERE id=? AND status='OPEN'").run(id);
      if (!upd.changes) {
        const exists = db.prepare('SELECT 1 FROM help_requests WHERE id=?').get(id);
        throw new HttpError(exists ? 409 : 404, exists ? 'Too late: another volunteer already accepted this request.' : 'Request not found.');
      }
      db.prepare('INSERT INTO assignments(request_id,volunteer_id,accepted_at) VALUES (?,?,?)').run(id, req.user.id, new Date().toISOString());
    });
    audit(req.user, 'REQUEST_ACCEPTED', `Request ${id}`, ip);
    events.publish('request', { id, status: 'ACCEPTED' });
    return { message: `You accepted request #${id}. Please reach the location safely.`, request: one(id) };
  });
  r.put('/api/requests/:id/deliver', requireRole('volunteer'), ({ req, params, ip }) => {
    const id = +params.id;
    tx(() => {
      const a = db.prepare('SELECT volunteer_id FROM assignments WHERE request_id=?').get(id);
      if (!a || a.volunteer_id !== req.user.id) throw new HttpError(403, 'Only the volunteer who accepted this request can deliver it.');
      const upd = db.prepare("UPDATE help_requests SET status='DELIVERED' WHERE id=? AND status='ACCEPTED'").run(id);
      if (!upd.changes) throw new HttpError(409, 'This request is not in ACCEPTED state.');
      db.prepare('UPDATE assignments SET delivered_at=? WHERE request_id=?').run(new Date().toISOString(), id);
    });
    audit(req.user, 'REQUEST_DELIVERED', `Request ${id}`, ip);
    events.publish('request', { id, status: 'DELIVERED' });
    return { message: `Request #${id} marked as delivered. Thank you!`, request: one(id) };
  });
};
