import { useEffect, useState } from 'react';
import api from '../api';
import Navbar from '../components/Navbar';

export default function NGODashboard() {
  const [camps, setCamps] = useState([]);
  const [requests, setRequests] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [camp, setCamp] = useState({ name: '', location: '', capacity: '' });
  const [stock, setStock] = useState({ campId: '', itemName: '', unit: '', quantity: '' });
  const [alloc, setAlloc] = useState({ stockId: '', requestId: '', quantity: '' });

  const load = async () => {
    try {
      const [c, r] = await Promise.all([api.get('/ngo/camps'), api.get('/ngo/requests')]);
      setCamps(c.data);
      setRequests(r.data);
    } catch {
      setError('Could not load camps');
    }
  };
  useEffect(() => { load(); }, []);

  const send = async (fn, ok, reset) => {
    setMessage(''); setError('');
    try {
      await fn();
      setMessage(ok);
      reset();
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    }
  };

  const addCamp = (e) => {
    e.preventDefault();
    send(() => api.post('/ngo/camps', { ...camp, capacity: Number(camp.capacity) }),
      'Camp created', () => setCamp({ name: '', location: '', capacity: '' }));
  };
  const addStock = (e) => {
    e.preventDefault();
    send(() => api.post('/ngo/stock', { ...stock, campId: Number(stock.campId), quantity: Number(stock.quantity) }),
      'Stock added', () => setStock({ ...stock, itemName: '', unit: '', quantity: '' }));
  };
  const allocate = (e) => {
    e.preventDefault();
    send(() => api.post('/ngo/allocate', {
      stockId: Number(alloc.stockId), requestId: Number(alloc.requestId), quantity: Number(alloc.quantity),
    }), 'Stock allocated to request', () => setAlloc({ stockId: '', requestId: '', quantity: '' }));
  };

  const items = camps.flatMap((c) => c.stock.map((s) => ({ ...s, camp: c.name })));

  return (
    <div>
      <Navbar />
      <div className="wrap">
        {message && <div className="msg">{message}</div>}
        {error && <div className="err" style={{ width: '100%' }}>{error}</div>}

        <div className="col">
          <h2 style={{ margin: 0 }}>Relief camps and stock</h2>
          {camps.length === 0 && <p className="muted">No camps yet. Create one.</p>}
          {camps.map((c) => (
            <div className="card" key={c.id}>
              <div className="row">
                <b style={{ fontSize: 20 }}>{c.name}</b>
                <span className="chip medium">Capacity {c.capacity}</span>
              </div>
              <span className="muted">{c.location}</span>
              <div className="scroll">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr style={{ textAlign: 'left' }}><th>Item</th><th>Quantity</th></tr></thead>
                  <tbody>
                    {c.stock.map((s) => (
                      <tr key={s.id} style={{ borderTop: '1px solid #D5DEEA' }}>
                        <td style={{ padding: '8px 0' }}>{s.item}</td>
                        <td>{s.quantity} {s.unit}</td>
                      </tr>
                    ))}
                    {c.stock.length === 0 && <tr><td colSpan={2} className="muted">No stock yet</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        <div className="col">
          <form className="card" onSubmit={addCamp}>
            <h3 style={{ margin: 0 }}>New camp</h3>
            <input placeholder="Camp name" value={camp.name} onChange={(e) => setCamp({ ...camp, name: e.target.value })} />
            <input placeholder="Location" value={camp.location} onChange={(e) => setCamp({ ...camp, location: e.target.value })} />
            <input type="number" min="1" placeholder="Capacity (people)" value={camp.capacity} onChange={(e) => setCamp({ ...camp, capacity: e.target.value })} />
            <button className="btn" type="submit">Create camp</button>
          </form>

          <form className="card" onSubmit={addStock}>
            <h3 style={{ margin: 0 }}>Add stock</h3>
            <select value={stock.campId} onChange={(e) => setStock({ ...stock, campId: e.target.value })}>
              <option value="">Choose camp</option>
              {camps.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input placeholder="Item (e.g. Rice)" value={stock.itemName} onChange={(e) => setStock({ ...stock, itemName: e.target.value })} />
            <input placeholder="Unit (e.g. kg)" value={stock.unit} onChange={(e) => setStock({ ...stock, unit: e.target.value })} />
            <input type="number" min="1" placeholder="Quantity" value={stock.quantity} onChange={(e) => setStock({ ...stock, quantity: e.target.value })} />
            <button className="btn" type="submit">Add stock</button>
          </form>

          <form className="card" onSubmit={allocate}>
            <h3 style={{ margin: 0 }}>Allocate stock to a request</h3>
            <select value={alloc.stockId} onChange={(e) => setAlloc({ ...alloc, stockId: e.target.value })}>
              <option value="">Choose item</option>
              {items.map((s) => <option key={s.id} value={s.id}>{s.camp}: {s.item} ({s.quantity} {s.unit})</option>)}
            </select>
            <select value={alloc.requestId} onChange={(e) => setAlloc({ ...alloc, requestId: e.target.value })}>
              <option value="">Choose request</option>
              {requests.map((r) => <option key={r.id} value={r.id}>#{r.id} {r.type} ({r.urgency}) {r.location}</option>)}
            </select>
            <input type="number" min="1" placeholder="Quantity" value={alloc.quantity} onChange={(e) => setAlloc({ ...alloc, quantity: e.target.value })} />
            <button className="btn o" type="submit">Allocate</button>
          </form>
        </div>
      </div>
    </div>
  );
}
