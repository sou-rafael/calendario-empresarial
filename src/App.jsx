import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider } from './components/AuthProvider';
import ProtectedRoute from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';

// Lazy loading para separar os chunks e acelerar o carregamento inicial (Landing Page, App e Backoffice Admin)
const LandingPage = lazy(() => import('./pages/LandingPage'));
const Login = lazy(() => import('./pages/Login'));
const Layout = lazy(() => import('./components/Layout'));
const CalendarView = lazy(() => import('./pages/CalendarView'));
const ListView = lazy(() => import('./pages/ListView'));
const DreView = lazy(() => import('./pages/DreView'));
const DashboardView = lazy(() => import('./pages/DashboardView'));
const MobilePocket = lazy(() => import('./pages/MobilePocket'));

// Módulo Administrativo Multi-Tenant Isolado (100% desacoplado e carregado apenas sob demanda)
const AdminGuard = lazy(() => import('./modules/admin/AdminGuard'));
const AdminPage = lazy(() => import('./modules/admin/AdminPage'));

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
    const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
    const isAdminDomain = hostname === 'admin.kdconta.com.br';

    // Não redireciona se já estiver no mobile, login, landing page ou no painel admin
    if (
      isAdminDomain ||
      location.pathname === '/mobile' ||
      location.pathname === '/login' ||
      location.pathname === '/landing' ||
      location.pathname.startsWith('/admin')
    ) {
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
  // Detecta o subdomínio de acesso:
  // - kdconta.com.br / www.kdconta.com.br -> Landing Page Pública
  // - admin.kdconta.com.br -> Backoffice Administrativo Multi-Tenant
  // - app.kdconta.com.br / localhost -> Aplicação SaaS
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const isMarketingDomain = hostname === 'kdconta.com.br' || hostname === 'www.kdconta.com.br';
  const isAdminDomain = hostname === 'admin.kdconta.com.br';

  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <MobileAutoRedirect>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Rota dedicada da Landing Page */}
                <Route path="/landing" element={<LandingPage />} />

                <Route path="/login" element={<Login />} />

                {/* Rota dedicada do Módulo de Administração Multi-Tenant */}
                <Route
                  path="/admin"
                  element={
                    <AdminGuard>
                      <AdminPage />
                    </AdminGuard>
                  }
                />

                {/* Rota PWA Pocket Mobile */}
                <Route 
                  path="/mobile" 
                  element={
                    <ProtectedRoute>
                      <MobilePocket />
                    </ProtectedRoute>
                  } 
                />

                {/* Rota Raiz Dinâmica conforme Subdomínio */}
                <Route 
                  path="/" 
                  element={
                    isMarketingDomain ? (
                      <LandingPage />
                    ) : isAdminDomain ? (
                      <AdminGuard>
                        <AdminPage />
                      </AdminGuard>
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

                <Route
                  path="*"
                  element={
                    <Navigate
                      to={isMarketingDomain ? "/landing" : isAdminDomain ? "/admin" : "/"}
                      replace
                    />
                  }
                />
              </Routes>
            </Suspense>
          </MobileAutoRedirect>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
