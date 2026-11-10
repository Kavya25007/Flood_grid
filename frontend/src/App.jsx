import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import CitizenDashboard from './pages/CitizenDashboard';
import VolunteerDashboard from './pages/VolunteerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/citizen" element={<ProtectedRoute role="citizen"><CitizenDashboard /></ProtectedRoute>} />
        <Route path="/volunteer" element={<ProtectedRoute role="volunteer"><VolunteerDashboard /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
