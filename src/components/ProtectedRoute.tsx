import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { LoadingScreen } from './LoadingScreen';
import { useAuth } from '../context/AuthContext';
import type { AuthUser } from '../lib/auth';

export function ProtectedRoute({ roles = ['admin'] }: { roles?: Array<AuthUser['role']> }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
