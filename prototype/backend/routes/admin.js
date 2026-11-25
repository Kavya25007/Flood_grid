'use strict';
const { db } = require('../db/db');
const { requireRole } = require('../lib/auth');

const csv = (v) => `"${String(v ?? '').replace(/"/g, '""').replace(/^([=+\-@])/, "'$1")}"`; // also blocks CSV formula injection

module.exports = (r) => {
  r.get('/api/admin/stats', requireRole('admin'), () => {
    const by = (col) => Object.fromEntries(db.prepare(`SELECT ${col} k, COUNT(*) n FROM help_requests GROUP BY ${col}`).all().map((x) => [x.k, x.n]));
    const s = by('status'), t = by('type');
    const avg = db.prepare("SELECT AVG((julianday(a.accepted_at)-julianday(r.created_at))*1440) m FROM assignments a JOIN help_requests r ON r.id=a.request_id").get().m;
    const total = (s.OPEN || 0) + (s.ACCEPTED || 0) + (s.DELIVERED || 0);
    return {
      open: s.OPEN || 0, accepted: s.ACCEPTED || 0, delivered: s.DELIVERED || 0, total,
      avgResponseMinutes: avg == null ? null : Math.round(avg * 10) / 10,
      deliveryRate: total ? Math.round(((s.DELIVERED || 0) / total) * 100) : 0,
      volunteers: db.prepare("SELECT COUNT(*) n FROM users WHERE role_id=2").get().n,
      byType: { food: t.food || 0, medical: t.medical || 0, rescue: t.rescue || 0, shelter: t.shelter || 0 },
      criticalOpen: db.prepare("SELECT COUNT(*) n FROM help_requests WHERE status='OPEN' AND urgency='critical'").get().n,
    };
  });
  r.get('/api/admin/audit', requireRole('admin'), ({ query }) => {
    const limit = Math.min(Math.max(+query.get('limit') || 50, 1), 500);
    const action = query.get('action');
    const rows = action
      ? db.prepare('SELECT at,user_name AS user,action,details FROM audit_log WHERE action=? ORDER BY id DESC LIMIT ?').all(action, limit)
      : db.prepare('SELECT at,user_name AS user,action,details FROM audit_log ORDER BY id DESC LIMIT ?').all(limit);
    return { audit: rows };
  });
  r.get('/api/admin/audit.csv', requireRole('admin'), () => {
    const rows = db.prepare('SELECT at,user_name,action,details,ip FROM audit_log ORDER BY id DESC LIMIT 5000').all();
    const body = ['time,user,action,details,ip', ...rows.map((x) => [x.at, x.user_name, x.action, x.details, x.ip].map(csv).join(','))].join('\n');
    return { __raw: body, type: 'text/csv; charset=utf-8', headers: { 'Content-Disposition': 'attachment; filename="floodgrid-audit.csv"' } };
  });
};
