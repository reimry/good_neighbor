import { Navigate } from 'react-router-dom';
import { useInternalAuth } from '../contexts/InternalAuthContext';

const InternalPrivateRoute = ({ children }) => {
  const { user, loading } = useInternalAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Завантаження...</div>
      </div>
    );
  }

  if (!user || user.role !== 'super_admin') {
    return <Navigate to="/internal/login" replace />;
  }

  return children;
};

export default InternalPrivateRoute;
