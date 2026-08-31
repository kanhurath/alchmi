import { Navigate, Outlet } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';

function ProtectedRoute() {
  const { token, loading } = useAdminAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: '#f5f3ef',
        fontFamily: "'Josefin Sans', sans-serif", color: '#9a8e78', fontSize: '0.85rem',
        letterSpacing: '0.1em', textTransform: 'uppercase',
      }}>
        Authenticating…
      </div>
    );
  }

  return token ? <Outlet /> : <Navigate to="/admin/login" replace />;
}

export default ProtectedRoute;
