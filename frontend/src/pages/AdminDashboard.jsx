import { useEffect, useState } from 'react';
import api from '../api';
import Navbar from '../components/Navbar';

const box = { background: 'white', border: '1px solid #ccc', borderRadius: 6, padding: 14, marginBottom: 16 };

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [audit, setAudit] = useState([]);

  useEffect(() => {
    api.get('/admin/stats').then((r) => setStats(r.data)).catch(() => {});
    api.get('/admin/audit').then((r) => setAudit(r.data)).catch(() => {});
  }, []);

  return (
    <div>
      <Navbar />
      <div style={{ maxWidth: 900, margin: '20px auto', padding: '0 12px' }}>
        <h2>Admin Dashboard</h2>
        {stats && (
          <div style={box}>
            <b>Requests by status:</b>{' '}
            {stats.byStatus.map((s) => `${s.label}: ${s.value}`).join(' | ') || 'none'}
            <br /><b>Requests by type:</b>{' '}
            {stats.byType.map((s) => `${s.label}: ${s.value}`).join(' | ') || 'none'}
            <br /><b>Average response time:</b> {stats.avgResponseMinutes} min
          </div>
        )}
        <div style={box}>
          <h3 style={{ marginTop: 0 }}>Audit Log (latest 50)</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead><tr style={{ textAlign: 'left' }}><th>Time</th><th>User</th><th>Action</th><th>Details</th></tr></thead>
            <tbody>
              {audit.map((a) => (
                <tr key={a.id} style={{ borderTop: '1px solid #eee' }}>
                  <td>{new Date(a.createdAt).toLocaleString()}</td>
                  <td>{a.who}</td><td>{a.action}</td><td>{a.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
