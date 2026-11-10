import { useEffect, useState } from 'react';
import api from '../api';
import Navbar from '../components/Navbar';
import RequestForm from '../components/RequestForm';
import RequestCard from '../components/RequestCard';

export default function CitizenDashboard() {
  const [requests, setRequests] = useState([]);

  const load = async () => {
    const { data } = await api.get('/requests/mine');
    setRequests(data);
  };

  useEffect(() => { load(); }, []);

  return (
    <div>
      <Navbar />
      <div style={{ maxWidth: 700, margin: '20px auto', padding: '0 12px' }}>
        <RequestForm onCreated={load} />
        <h2>My Requests</h2>
        {requests.length === 0 && <p>No requests yet.</p>}
        {requests.map((r) => <RequestCard key={r.id} request={r} />)}
      </div>
    </div>
  );
}
