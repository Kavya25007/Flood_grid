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
    if (location.trim().length < 3) return setError('Enter a valid location');
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
    <form onSubmit={submit} style={{ background: 'white', border: '1px solid #ccc', padding: 14, borderRadius: 6, marginBottom: 20 }}>
      <h3 style={{ marginTop: 0 }}>New Help Request</h3>
      <select value={type} onChange={(e) => setType(e.target.value)}>
        <option value="food">Food</option>
        <option value="medical">Medical</option>
        <option value="rescue">Rescue</option>
        <option value="shelter">Shelter</option>
      </select>{' '}
      <select value={urgency} onChange={(e) => setUrgency(e.target.value)}>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
        <option value="critical">Critical</option>
      </select>
      <input style={{ display: 'block', width: '100%', boxSizing: 'border-box', margin: '10px 0', padding: 8 }}
        placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
      <textarea style={{ display: 'block', width: '100%', boxSizing: 'border-box', marginBottom: 10, padding: 8 }}
        placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
      <button type="submit">Submit Request</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </form>
  );
}
