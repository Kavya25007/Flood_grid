import { useEffect, useState } from 'react';
import api from '../api';
import Navbar from '../components/Navbar';
import RequestCard from '../components/RequestCard';

export default function VolunteerDashboard() {
  const [open, setOpen] = useState([]);
  const [mine, setMine] = useState([]);
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState({});

  const load = async () => {
    try {
      const [a, b] = await Promise.all([api.get('/requests'), api.get('/requests/accepted')]);
      setOpen(a.data);
      setMine(b.data);
    } catch {
      setMessage('Could not load requests');
    }
  };

  useEffect(() => { load(); }, []);

  const accept = async (id) => {
    try {
      await api.put(`/requests/${id}/accept`);
      setMessage(`Request #${id} accepted`);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to accept');
    }
    load();
  };

  const deliver = async (id) => {
    const form = new FormData();
    if (files[id]) form.append('proof', files[id]);
    try {
      const { data } = await api.put(`/requests/${id}/deliver`, form);
      setMessage(`Request #${id} marked delivered${data.proof ? ' with proof photo' : ''}`);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to mark delivered');
    }
    load();
  };

  return (
    <div>
      <Navbar />
      <div className="wrap">
        {message && <div className="msg">{message}</div>}
        <div className="col">
          <h2 style={{ fontSize: 26 }}>Open requests, most urgent first</h2>
          {open.length === 0 && <p className="body">No open requests right now.</p>}
          {open.map((r) => (
            <RequestCard key={r.id} request={r}>
              <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => accept(r.id)}>Accept</button>
            </RequestCard>
          ))}
        </div>
        <div className="col">
          <h2 style={{ fontSize: 26 }}>My accepted requests</h2>
          {mine.length === 0 && <p className="body">Nothing accepted yet.</p>}
          {mine.map((r) => (
            <RequestCard key={r.id} request={r}>
              {r.status === 'ACCEPTED' && (
                <>
                  <div className="field">
                    <label htmlFor={`proof-${r.id}`}>Proof photo (JPG or PNG, optional)</label>
                    <input id={`proof-${r.id}`} type="file" accept="image/jpeg,image/png"
                      style={{ height: 'auto', padding: 8 }}
                      onChange={(e) => setFiles({ ...files, [r.id]: e.target.files[0] })} />
                  </div>
                  <button className="btn o" style={{ alignSelf: 'flex-start' }} onClick={() => deliver(r.id)}>
                    Mark delivered
                  </button>
                </>
              )}
            </RequestCard>
          ))}
        </div>
      </div>
    </div>
  );
}
