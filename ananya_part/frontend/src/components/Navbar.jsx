import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();
  const logout = () => {
    localStorage.clear();
    navigate('/');
  };
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: 12, background: '#0b5ed7', color: 'white' }}>
      <b>FloodGrid</b>
      <span>
        {localStorage.getItem('name')} ({localStorage.getItem('role')}){' '}
        <button onClick={logout}>Logout</button>
      </span>
    </div>
  );
}
