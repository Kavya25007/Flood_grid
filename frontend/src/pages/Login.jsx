import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      localStorage.setItem('name', data.name);
      if (['citizen', 'volunteer', 'admin'].includes(data.role)) navigate('/' + data.role);
      else setError('This role has no dashboard yet');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  const field = { width: '100%', boxSizing: 'border-box', marginBottom: 10, padding: 8 };
  return (
    <div style={{ maxWidth: 360, margin: '80px auto', background: 'white', padding: 24, borderRadius: 8 }}>
      <h2 style={{ marginTop: 0 }}>FloodGrid Login</h2>
      <form onSubmit={handleSubmit}>
        <input style={field} type="email" placeholder="Email" value={email}
          onChange={(e) => setEmail(e.target.value)} required />
        <input style={field} type="password" placeholder="Password" value={password}
          onChange={(e) => setPassword(e.target.value)} required />
        <button style={{ padding: '8px 16px' }} type="submit">Login</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
