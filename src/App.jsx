import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './components/AuthProvider';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Layout from './components/Layout';
import CalendarView from './pages/CalendarView';
import ListView from './pages/ListView';
import DreView from './pages/DreView';
import DashboardView from './pages/DashboardView';
import MobilePocket from './pages/MobilePocket';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
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
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
