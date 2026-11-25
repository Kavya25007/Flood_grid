import { useState } from 'react';
import api from '../api';

export default function RequestForm({ onCreated }) {
  const [type, setType] = useState('food');
  const [urgency, setUrgency] = useState('medium');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (location.trim().length < 3) return setError('Enter a valid location (at least 3 characters)');
    try {
      await api.post('/requests', { type, urgency, location, description });
      setLocation('');
      setDescription('');
      onCreated();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not submit request');
    }
  };

  return (
    <form onSubmit={submit} className="card" style={{ gap: 14 }}>
      <h2 style={{ margin: 0 }}>New help request</h2>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div className="field" style={{ flex: '1 1 140px', gap: 6 }}>
          <label htmlFor="type"><b>Type</b></label>
          <select id="type" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="food">Food</option>
            <option value="medical">Medical</option>
            <option value="rescue">Rescue</option>
            <option value="shelter">Shelter</option>
          </select>
        </div>
        <div className="field" style={{ flex: '1 1 140px', gap: 6 }}>
          <label htmlFor="urgency"><b>Urgency</b></label>
          <select id="urgency" value={urgency} onChange={(e) => setUrgency(e.target.value)}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>
      <div className="field" style={{ gap: 6 }}>
        <label htmlFor="loc"><b>Location</b></label>
        <input id="loc" placeholder="Ward, area or landmark" value={location} onChange={(e) => setLocation(e.target.value)} />
      </div>
      <div className="field" style={{ gap: 6 }}>
        <label htmlFor="desc"><b>Description</b></label>
        <textarea id="desc" rows={4} placeholder="What do you need?" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      {error && <p className="err">{error}</p>}
      <button type="submit" className="btn">Submit request</button>
    </form>
  );
}
