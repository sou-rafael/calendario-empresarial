import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../components/AuthProvider';
import { ShieldAlert, ArrowLeft, Copy, Check, RefreshCw } from 'lucide-react';

export default function AdminGuard({ children }) {
  const { user, tenantProfile, isSuperAdmin, refreshTenantProfile } = useAuth();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isSuperAdmin) {
    const sqlCommand = `UPDATE public.tenant_profiles SET system_role = 'super_admin', plan_tier = 'founder', account_status = 'active' WHERE email = '${user.email}';`;

    const handleCopy = () => {
      navigator.clipboard.writeText(sqlCommand);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    };

    const handleRecheck = async () => {
      setChecking(true);
      await refreshTenantProfile();
      setChecking(false);
    };

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
          maxWidth: '520px',
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
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.5 }}>
            Você está conectado como <strong>{user.email}</strong> (nível atual: <code>{tenantProfile?.system_role || 'user'}</code>).
            Como havia mais de um usuário no banco, promova este seu e-mail para <strong>Super Admin</strong> rodando o comando abaixo no SQL Editor do Supabase:
          </p>

          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '0.85rem',
            textAlign: 'left',
            fontSize: '0.76rem',
            fontFamily: 'monospace',
            color: 'var(--accent-primary)',
            wordBreak: 'break-all',
            marginBottom: '1rem'
          }}>
            {sqlCommand}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <button
              onClick={handleCopy}
              className="btn btn-outline"
              style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', borderRadius: '12px' }}
            >
              {copied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
              {copied ? 'Comando SQL Copiado!' : 'Copiar Comando SQL'}
            </button>

            <button
              onClick={handleRecheck}
              disabled={checking}
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', borderRadius: '12px' }}
            >
              <RefreshCw size={16} />
              {checking ? 'Verificando permissão...' : 'Já executei no Supabase · Liberar Painel'}
            </button>

            <button
              onClick={() => navigate('/')}
              className="btn btn-outline"
              style={{ width: '100%', justifyContent: 'center', padding: '0.7rem', borderRadius: '12px', border: 'none', color: 'var(--text-muted)' }}
            >
              <ArrowLeft size={16} />
              Voltar ao Calendário
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
