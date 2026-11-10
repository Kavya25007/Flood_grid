import { useEffect, useState } from 'react';
import api from '../api';
import Navbar from '../components/Navbar';
import RequestCard from '../components/RequestCard';

export default function VolunteerDashboard() {
  const [open, setOpen] = useState([]);
  const [mine, setMine] = useState([]);
  const [message, setMessage] = useState('');

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

  const act = async (id, action, okText) => {
    try {
      await api.put(`/requests/${id}/${action}`);
      setMessage(`Request #${id} ${okText}`);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Action failed');
    }
    load();
  };

  return (
    <div>
      <Navbar />
      <div style={{ maxWidth: 700, margin: '20px auto', padding: '0 12px' }}>
        {message && <p><b>{message}</b></p>}
        <h2>Open Requests</h2>
        {open.length === 0 && <p>No open requests.</p>}
        {open.map((r) => (
          <RequestCard key={r.id} request={r}>
            <button onClick={() => act(r.id, 'accept', 'accepted')}>Accept</button>
          </RequestCard>
        ))}
        <h2>My Accepted Requests</h2>
        {mine.length === 0 && <p>Nothing accepted yet.</p>}
        {mine.map((r) => (
          <RequestCard key={r.id} request={r}>
            {r.status === 'ACCEPTED' && (
              <button onClick={() => act(r.id, 'deliver', 'marked delivered')}>Mark Delivered</button>
            )}
          </RequestCard>
        ))}
      </div>
    </div>
  );
}
