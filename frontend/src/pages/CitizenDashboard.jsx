import { useEffect, useState } from 'react';
import api from '../api';
import Navbar from '../components/Navbar';
import RequestForm from '../components/RequestForm';
import RequestCard from '../components/RequestCard';

export default function CitizenDashboard() {
  const [requests, setRequests] = useState([]);

  const load = async () => {
    try {
      const { data } = await api.get('/requests/mine');
      setRequests(data);
    } catch { /* keep old list */ }
  };

  useEffect(() => { load(); }, []);

  return (
    <div>
      <Navbar />
      <div className="wrap">
        <div className="col"><RequestForm onCreated={load} /></div>
        <div className="col" style={{ flex: '1.4 1 420px' }}>
          <h2 style={{ margin: 0 }}>My requests</h2>
          {requests.length === 0 && <p className="muted">No requests yet.</p>}
          {requests.map((r) => (
            <RequestCard key={r.id} request={{ ...r, volunteer: r.volunteer || (r.status === 'OPEN' ? 'Waiting for a volunteer' : '') }} />
          ))}
        </div>
      </div>
    </div>
  );
}
