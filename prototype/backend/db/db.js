'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const config = require('../config');

fs.mkdirSync(path.dirname(config.DB_FILE), { recursive: true });
const db = new DatabaseSync(config.DB_FILE);
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
db.exec(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));
try { db.exec('ALTER TABLE help_requests ADD COLUMN phone TEXT;'); } catch (_) {}
for (const [id, n] of [[1, 'citizen'], [2, 'volunteer'], [3, 'admin']])
  db.prepare('INSERT OR IGNORE INTO roles(id,name) VALUES (?,?)').run(id, n);

/** Run fn inside a transaction (BEGIN IMMEDIATE = write lock, like SQL Server SERIALIZABLE). */
function tx(fn) {
  db.exec('BEGIN IMMEDIATE');
  try { const r = fn(); db.exec('COMMIT'); return r; }
  catch (e) { db.exec('ROLLBACK'); throw e; }
}
function audit(user, action, details, ip) {
  db.prepare('INSERT INTO audit_log(user_id,user_name,action,details,ip) VALUES (?,?,?,?,?)')
    .run(user ? user.id : null, user ? user.name : 'system', action, details || '', ip || null);
}
module.exports = { db, tx, audit };
