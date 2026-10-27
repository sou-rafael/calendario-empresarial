import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { supabase } from '../lib/supabase';
import { ShieldAlert, LogOut, Sparkles } from 'lucide-react';

export default function ProtectedRoute({ children }) {
  const { user, tenantProfile, isSuspended, isTrialExpired } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (isSuspended) {
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
          maxWidth: '460px',
          width: '100%',
          background: 'var(--modal-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: '20px',
          padding: '2rem',
          boxShadow: 'var(--shadow-lg)',
          textAlign: 'center'
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: isTrialExpired ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            color: isTrialExpired ? '#f59e0b' : '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem'
          }}>
            <ShieldAlert size={28} />
          </div>

          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            {isTrialExpired ? 'Período de Teste Encerrado' : 'Acesso Temporariamente Suspenso'}
          </h2>

          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            {isTrialExpired
              ? `Os seus 7 dias gratuitos de avaliação para a conta ${tenantProfile?.email || user.email} chegaram ao fim. Seus dados continuam salvos e protegidos.`
              : `O acesso da conta ${tenantProfile?.email || user.email} encontra-se pausado pela administração do sistema.`}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button
              onClick={() => navigate('/landing#precos')}
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '0.85rem', borderRadius: '12px', fontWeight: 700 }}
            >
              <Sparkles size={18} />
              Ver Planos de Assinatura
            </button>

            <button
              onClick={() => supabase.auth.signOut()}
              className="btn btn-outline"
              style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', borderRadius: '12px' }}
            >
              <LogOut size={16} />
              Sair da Conta
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
