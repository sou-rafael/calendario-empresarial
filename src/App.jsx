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
import LandingPage from './pages/LandingPage';

function MobileAutoRedirect({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Não redireciona se já estiver no mobile, na tela de login ou na landing page
    if (location.pathname === '/mobile' || location.pathname === '/login' || location.pathname === '/landing') {
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
  // Detecta se o visitante está acessando o domínio principal (ex: kdconta.com.br / www.kdconta.com.br)
  // Se estiver em app.kdconta.com.br ou localhost, exibe o aplicativo direto.
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const isMarketingDomain = hostname === 'kdconta.com.br' || hostname === 'www.kdconta.com.br';

  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <MobileAutoRedirect>
            <Routes>
              {/* Rota dedicada da Landing Page (acessível via /landing em qualquer ambiente) */}
              <Route path="/landing" element={<LandingPage />} />

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

              {/* Rota Web Desktop Completa (ou Landing Page se estiver no domínio raiz de vendas) */}
              <Route 
                path="/" 
                element={
                  isMarketingDomain ? (
                    <LandingPage />
                  ) : (
                    <ProtectedRoute>
                      <Layout />
                    </ProtectedRoute>
                  )
                } 
              >
                <Route index element={<CalendarView />} />
                <Route path="list" element={<ListView />} />
                <Route path="dre" element={<DreView />} />
                <Route path="dashboard" element={<DashboardView />} />
              </Route>

              <Route path="*" element={<Navigate to={isMarketingDomain ? "/landing" : "/"} replace />} />
            </Routes>
          </MobileAutoRedirect>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
