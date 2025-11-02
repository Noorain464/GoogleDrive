import { Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { apiService } from '@/services/apiService';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (token) {
      apiService.setToken(token);
    }
  }, [token]);

  if (!token || !user.id) {
    // Redirect to auth page if there's no token or user
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

export default PrivateRoute;