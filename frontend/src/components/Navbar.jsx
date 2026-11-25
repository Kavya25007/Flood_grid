import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();
  const logout = () => {
    localStorage.clear();
    navigate('/');
  };
  return (
    <div className="nav">
      <div className="brand"><span className="dot" />FloodGrid</div>
      <div>
        {localStorage.getItem('name')} ({localStorage.getItem('role')}){' '}
        <button className="btn l" onClick={logout}>Logout</button>
      </div>
    </div>
  );
}
