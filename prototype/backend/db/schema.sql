-- FloodGrid schema (SQLite for local run). Azure SQL version: docs/azure-sql.sql
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS roles (id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role_id INTEGER NOT NULL REFERENCES roles(id),
  name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE IF NOT EXISTS help_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  citizen_id INTEGER NOT NULL REFERENCES users(id),
  type TEXT NOT NULL CHECK (type IN ('food','medical','rescue','shelter')),
  urgency TEXT NOT NULL CHECK (urgency IN ('low','medium','high','critical')),
  location TEXT NOT NULL CHECK (length(location) BETWEEN 3 AND 200),
  phone TEXT CHECK (phone IS NULL OR length(phone) BETWEEN 7 AND 25),
  description TEXT NOT NULL DEFAULT '' CHECK (length(description) <= 500),
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','ACCEPTED','DELIVERED')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE IF NOT EXISTS assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id INTEGER NOT NULL UNIQUE REFERENCES help_requests(id),  -- UNIQUE = only one volunteer per request
  volunteer_id INTEGER NOT NULL REFERENCES users(id),
  accepted_at TEXT NOT NULL, delivered_at TEXT
);
CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  user_id INTEGER REFERENCES users(id), user_name TEXT NOT NULL DEFAULT 'system',
  action TEXT NOT NULL, details TEXT NOT NULL DEFAULT '', ip TEXT
);
CREATE INDEX IF NOT EXISTS ix_req_status ON help_requests(status, urgency);
CREATE INDEX IF NOT EXISTS ix_req_citizen ON help_requests(citizen_id);
CREATE INDEX IF NOT EXISTS ix_audit_at ON audit_log(at DESC);

CREATE VIEW IF NOT EXISTS vw_open_requests AS
  SELECT r.*, u.name AS citizen_name,
    CASE r.urgency WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END AS urgency_rank
  FROM help_requests r JOIN users u ON u.id = r.citizen_id WHERE r.status = 'OPEN';

-- Trigger: every status change is written to the audit log automatically
CREATE TRIGGER IF NOT EXISTS trg_status_change AFTER UPDATE OF status ON help_requests
WHEN OLD.status <> NEW.status
BEGIN
  INSERT INTO audit_log(action, details) VALUES ('STATUS_CHANGE', 'Request ' || NEW.id || ': ' || OLD.status || ' -> ' || NEW.status);
END;
