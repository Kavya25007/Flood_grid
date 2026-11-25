'use strict';
// Demo data (dummy only). Run: npm run seed  (use --reset to wipe first)
const { db, audit } = require('./db');
const pw = require('../lib/password');

function seed(reset) {
  if (reset) {
    db.exec('DELETE FROM audit_log; DELETE FROM assignments; DELETE FROM help_requests; DELETE FROM users;');
    try { db.exec("DELETE FROM sqlite_sequence WHERE name IN ('users','help_requests','assignments','audit_log');"); } catch (_) {}
  }
  if (db.prepare('SELECT COUNT(*) c FROM users').get().c) return false;
  const add = db.prepare('INSERT INTO users(role_id,name,email,password_hash) VALUES (?,?,?,?)');
  const h = pw.hash('Test@1234');
  [[1, 'Riya Citizen', 'citizen@test.com'], [2, 'Vikas Volunteer', 'volunteer@test.com'], [3, 'Admin User', 'admin@test.com'],
   [1, 'Neha Kapoor', 'neha@test.com'], [1, 'Arun Pandey', 'arun@test.com'], [1, 'Meera Singh', 'meera@test.com'],
   [2, 'Sana Khan', 'sana@test.com']].forEach(([r, n, e]) => add.run(r, n, e, h));
  const mins = (m) => new Date(Date.now() - m * 60000).toISOString();
  const ins = db.prepare('INSERT INTO help_requests(citizen_id,type,urgency,location,phone,description,status,created_at) VALUES (?,?,?,?,?,?,?,?)');
  const data = [
    [1, 'food', 'high', 'Ward 12, Aliganj', '+91 98765 43210', 'Family of 5 needs dry ration for 3 days', 'DELIVERED', 95],
    [4, 'medical', 'critical', 'Gomti Nagar Sector 2', '+91 98111 22334', 'Elderly person needs insulin, road blocked', 'OPEN', 40],
    [5, 'rescue', 'critical', 'Indira Nagar, Block C', '+91 99222 33445', 'Stuck on first floor, water rising', 'OPEN', 32],
    [6, 'shelter', 'medium', 'Chowk, near Clock Tower', '+91 97333 44556', 'Temporary shelter for 3 people and a child', 'OPEN', 25],
    [1, 'food', 'low', 'Aliganj, Sector H', '+91 98765 43210', 'Drinking water and biscuits', 'OPEN', 18],
    [4, 'medical', 'high', 'Hazratganj, Ashok Marg', '+91 98111 22334', 'Fever medicine for two children', 'ACCEPTED', 60],
  ];
  for (const d of data) ins.run(d[0], d[1], d[2], d[3], d[4], d[5], 'OPEN', mins(d[7]));
  db.prepare("UPDATE help_requests SET status='DELIVERED' WHERE id=1").run();
  db.prepare("UPDATE help_requests SET status='ACCEPTED' WHERE id=6").run();
  db.prepare('INSERT INTO assignments(request_id,volunteer_id,accepted_at,delivered_at) VALUES (1,2,?,?)').run(mins(83), mins(60));
  db.prepare('INSERT INTO assignments(request_id,volunteer_id,accepted_at) VALUES (6,7,?)').run(mins(48));
  db.exec('DELETE FROM audit_log');
  audit({ id: 1, name: 'Riya Citizen' }, 'LOGIN', 'Signed in as citizen');
  audit({ id: 1, name: 'Riya Citizen' }, 'REQUEST_CREATED', 'Request 1 (food, high)');
  audit({ id: 2, name: 'Vikas Volunteer' }, 'REQUEST_ACCEPTED', 'Request 1');
  audit({ id: 2, name: 'Vikas Volunteer' }, 'REQUEST_DELIVERED', 'Request 1');
  return true;
}
module.exports = { seed };
if (require.main === module) { console.log(seed(process.argv.includes('--reset')) ? 'Seeded demo data.' : 'Data already present (use --reset).'); }
