import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const ROLES = ['citizen', 'volunteer', 'ngo', 'admin'];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const signIn = async (mail, pass) => {
    setError('');
    try {
      const { data } = await api.post('/auth/login', { email: mail, password: pass });
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      localStorage.setItem('name', data.name);
      if (ROLES.includes(data.role)) navigate('/' + data.role);
      else setError('This role has no dashboard yet');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    signIn(email, password);
  };

  return (
    <div className="login">
      <div className="left">
        <div className="brand"><span className="dot" />FloodGrid</div>
        <h1 style={{ fontSize: 48, lineHeight: 1.1 }}>One place to coordinate flood relief</h1>
        <p style={{ color: '#B9C7DB', fontSize: 20, lineHeight: 1.5, margin: 0 }}>
          Citizens ask for help, volunteers respond, NGOs manage camps and stock, and admins see
          everything with a full audit trail.
        </p>
      </div>
      <div className="right">
        <form className="form" onSubmit={handleSubmit}>
          <h2 style={{ fontSize: 30 }}>Sign in</h2>
          <div>
            <label htmlFor="em">Email</label>
            <input id="em" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label htmlFor="pw">Password</label>
            <input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <p className="err">{error}</p>}
          <button className="btn" type="submit">Login</button>
          <p className="muted" style={{ margin: 0 }}>
            Passwords are hashed with bcrypt. Sessions use a JWT that expires in 2 hours.
          </p>
        </form>
      </div>
    </div>
  );
}
