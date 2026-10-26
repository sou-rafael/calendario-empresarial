import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider } from './components/AuthProvider';
import ProtectedRoute from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import Login from './pages/Login';
import Layout from './components/Layout';
import CalendarView from './pages/CalendarView';
import ListView from './pages/ListView';
import DreView from './pages/DreView';
import DashboardView from './pages/DashboardView';
import MobilePocket from './pages/MobilePocket';

function MobileAutoRedirect({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname === '/mobile' || location.pathname === '/login') {
      return;
    }

    const prefersDesktop = sessionStorage.getItem('prefersDesktop') === 'true';
    if (prefersDesktop) {
      return;
    }

    const isMobileScreen = window.innerWidth < 768;
    const isMobileAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isMobileScreen || isMobileAgent) {
      navigate('/mobile', { replace: true });
    }
  }, [location.pathname, navigate]);

  return children;
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <MobileAutoRedirect>
            <Routes>
              <Route path="/login" element={<Login />} />
              
              {/* Rota PWA Pocket Mobile */}
              <Route 
                path="/mobile" 
                element={
                  <ProtectedRoute>
                    <MobilePocket />
                  </ProtectedRoute>
                } 
              />

              {/* Rota Web Desktop Completa */}
              <Route 
                path="/" 
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                } 
              >
                <Route index element={<CalendarView />} />
                <Route path="list" element={<ListView />} />
                <Route path="dre" element={<DreView />} />
                <Route path="dashboard" element={<DashboardView />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </MobileAutoRedirect>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
