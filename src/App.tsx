import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { LoadingScreen } from './components/LoadingScreen';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BackofficeLayout } from './layouts/BackofficeLayout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { PlateRequestsPage } from './pages/PlateRequestsPage';
import { UsersPage } from './pages/UsersPage';

function HomeRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return <Navigate to={user?.role === 'admin' ? '/users' : ['plate_manager', 'technician'].includes(user?.role || '') ? '/plate-requests' : '/login'} replace />;
}

function NotFoundRedirect() {
  return <Navigate to="/" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<ProtectedRoute roles={['admin']} />}>
            <Route element={<BackofficeLayout />}>
              <Route path="/users" element={<UsersPage />} />
              <Route path="/administrators" element={<AdminUsersPage />} />
            </Route>
          </Route>
          <Route element={<ProtectedRoute roles={['admin', 'plate_manager', 'technician']} />}>
            <Route element={<BackofficeLayout />}>
              <Route path="/plate-requests" element={<PlateRequestsPage />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFoundRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
