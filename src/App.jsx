import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider } from './components/AuthProvider';
import ProtectedRoute from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';

// Lazy loading para separar os chunks e acelerar o carregamento inicial (Landing Page & App)
const LandingPage = lazy(() => import('./pages/LandingPage'));
const Login = lazy(() => import('./pages/Login'));
const Layout = lazy(() => import('./components/Layout'));
const CalendarView = lazy(() => import('./pages/CalendarView'));
const ListView = lazy(() => import('./pages/ListView'));
const DreView = lazy(() => import('./pages/DreView'));
const DashboardView = lazy(() => import('./pages/DashboardView'));
const MobilePocket = lazy(() => import('./pages/MobilePocket'));

function PageLoader() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--bg-color)',
      color: 'var(--accent-primary)',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      fontSize: '0.9rem',
      fontWeight: 600
    }}>
      Carregando KdConta...
    </div>
  );
}

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
            <Suspense fallback={<PageLoader />}>
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
            </Suspense>
          </MobileAutoRedirect>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
