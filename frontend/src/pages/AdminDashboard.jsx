import { useEffect, useState } from 'react';
import api from '../api';
import Navbar from '../components/Navbar';

const count = (list, label) => (list.find((x) => x.label === label) || { value: 0 }).value;

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [audit, setAudit] = useState([]);
  const [stock, setStock] = useState([]);

  useEffect(() => {
    api.get('/admin/stats').then((r) => setStats(r.data)).catch(() => {});
    api.get('/admin/audit').then((r) => setAudit(r.data)).catch(() => {});
    api.get('/admin/stock').then((r) => setStock(r.data)).catch(() => {});
  }, []);

  const maxType = stats ? Math.max(1, ...stats.byType.map((t) => t.value)) : 1;

  return (
    <div>
      <Navbar />
      <div className="wrap col1">
        <h1 style={{ margin: 0 }}>Admin dashboard</h1>
        {stats && (
          <div className="stats">
            <div className="stat"><span className="muted">Open</span><b style={{ color: '#B26A00' }}>{count(stats.byStatus, 'OPEN')}</b></div>
            <div className="stat"><span className="muted">Accepted</span><b style={{ color: '#1F5FD0' }}>{count(stats.byStatus, 'ACCEPTED')}</b></div>
            <div className="stat"><span className="muted">Delivered</span><b style={{ color: '#0E7A3A' }}>{count(stats.byStatus, 'DELIVERED')}</b></div>
            <div className="stat dark"><span style={{ color: '#B9C7DB' }}>Average response time</span><b style={{ color: '#F5A524' }}>{stats.avgResponseMinutes} min</b></div>
          </div>
        )}

        {stats && (
          <div className="card">
            <h2 style={{ margin: 0 }}>Requests by type</h2>
            {stats.byType.length === 0 && <p className="muted">No data yet.</p>}
            {stats.byType.map((t) => (
              <div key={t.label} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ width: 90, textTransform: 'capitalize' }}>{t.label}</span>
                <div className="bar"><i style={{ width: `${(t.value / maxType) * 100}%` }} /></div>
                <b style={{ width: 28 }}>{t.value}</b>
              </div>
            ))}
          </div>
        )}

        <div className="card">
          <h2 style={{ margin: 0 }}>Relief stock across camps</h2>
          {stock.length === 0 && <p className="muted">No stock recorded yet.</p>}
          {stock.length > 0 && (
            <div className="scroll">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ textAlign: 'left' }}><th>Item</th><th>Total</th><th>Camps</th></tr></thead>
                <tbody>
                  {stock.map((s) => (
                    <tr key={s.item} style={{ borderTop: '1px solid #D5DEEA' }}>
                      <td style={{ padding: '10px 0' }}>{s.item}</td><td>{s.quantity} {s.unit}</td><td>{s.camps}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <h2 style={{ margin: 0 }}>Audit log (latest 50)</h2>
          <div className="scroll">
            <table style={{ width: '100%', minWidth: 640, borderCollapse: 'collapse' }}>
              <thead><tr style={{ textAlign: 'left' }}><th>Time</th><th>User</th><th>Action</th><th>Details</th></tr></thead>
              <tbody>
                {audit.map((a) => (
                  <tr key={a.id} style={{ borderTop: '1px solid #D5DEEA' }}>
                    <td style={{ padding: '10px 8px 10px 0' }}>{new Date(a.createdAt).toLocaleString()}</td>
                    <td>{a.who}</td><td><b>{a.action}</b></td><td>{a.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
