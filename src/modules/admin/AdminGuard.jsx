import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../components/AuthProvider';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function AdminGuard({ children }) {
  const { user, isSuperAdmin } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isSuperAdmin) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-color)',
        color: 'var(--text-primary)',
        padding: '1.5rem'
      }}>
        <div style={{
          maxWidth: '420px',
          width: '100%',
          background: 'var(--modal-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: '20px',
          padding: '2rem',
          textAlign: 'center',
          boxShadow: 'var(--shadow-lg)'
        }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            background: 'rgba(239, 68, 68, 0.12)',
            color: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem'
          }}>
            <ShieldAlert size={26} />
          </div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            Acesso Restrito ao Super Admin
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
            Esta área é exclusiva para a administração global de tenants da plataforma KdConta.
          </p>
          <button
            onClick={() => navigate('/')}
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', borderRadius: '12px' }}
          >
            <ArrowLeft size={16} />
            Voltar ao Calendário
          </button>
        </div>
      </div>
    );
  }

  return children;
}
