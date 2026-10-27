import React, { useState, useEffect } from 'react';
import { X, Shield, Calendar, CheckCircle2, Sparkles, Save, Clock } from 'lucide-react';
import { PLAN_CONFIG, STATUS_CONFIG, FEATURE_LIST } from './adminService';

export default function AdminTenantModal({ isOpen, onClose, tenant, currentUserId, onSave }) {
  const [companyName, setCompanyName] = useState('');
  const [systemRole, setSystemRole] = useState('user');
  const [planTier, setPlanTier] = useState('trial');
  const [accountStatus, setAccountStatus] = useState('trial');
  const [trialEndsAt, setTrialEndsAt] = useState('');
  const [features, setFeatures] = useState({
    scanner_pdf: true,
    voice_command: true,
    dre_view: true,
    ai_consultant: false
  });
  const [adminNotes, setAdminNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (tenant) {
      setCompanyName(tenant.company_name || '');
      setSystemRole(tenant.system_role || 'user');
      setPlanTier(tenant.plan_tier || 'trial');
      setAccountStatus(tenant.account_status || 'trial');
      setTrialEndsAt(
        tenant.trial_ends_at
          ? new Date(tenant.trial_ends_at).toISOString().slice(0, 10)
          : new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
      );
      setFeatures({
        scanner_pdf: true,
        voice_command: true,
        dre_view: true,
        ai_consultant: false,
        ...(tenant.features || {})
      });
      setAdminNotes(tenant.admin_notes || '');
    }
  }, [tenant]);

  if (!isOpen || !tenant) return null;

  const isSelf = tenant.id === currentUserId;

  const extendTrialDays = (days) => {
    const baseDate = trialEndsAt && new Date(trialEndsAt) > new Date()
      ? new Date(trialEndsAt)
      : new Date();
    baseDate.setDate(baseDate.getDate() + days);
    setTrialEndsAt(baseDate.toISOString().slice(0, 10));
    setAccountStatus('trial');
  };

  const toggleFeature = (key) => {
    setFeatures(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        id: tenant.id,
        company_name: companyName.trim(),
        system_role: systemRole,
        plan_tier: planTier,
        account_status: accountStatus,
        trial_ends_at: trialEndsAt ? new Date(`${trialEndsAt}T23:59:59Z`).toISOString() : null,
        features,
        admin_notes: adminNotes.trim()
      });
      onClose();
    } catch (err) {
      alert('Erro ao salvar alterações do cliente: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '600px',
          width: '95%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '1.75rem',
          borderRadius: '20px'
        }}
      >
        {/* Cabeçalho */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div>
            <span style={{
              fontSize: '0.7rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--accent-primary)'
            }}>
              Controle de Tenant · Permissão & Assinatura
            </span>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0.2rem 0', color: 'var(--text-primary)' }}>
              {tenant.email}
            </h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              UUID: {tenant.id}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              borderRadius: '10px',
              padding: '6px',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {/* Nome da Empresa e Papel no Sistema */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '0.85rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
                Empresa / Identificação
              </label>
              <input
                type="text"
                className="input-field"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Nome da empresa ou cliente"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
                Nível no Sistema (Role)
              </label>
              <select
                className="input-field"
                value={systemRole}
                onChange={(e) => setSystemRole(e.target.value)}
                disabled={isSelf}
                style={{ width: '100%' }}
              >
                <option value="user">Cliente Padrão (Tenant)</option>
                <option value="super_admin">🛡️ Super Administrador</option>
              </select>
            </div>
          </div>

          {/* Plano e Status de Acesso */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
                Plano Comercial (Tier)
              </label>
              <select
                className="input-field"
                value={planTier}
                onChange={(e) => {
                  const newPlan = e.target.value;
                  setPlanTier(newPlan);
                  if (newPlan !== 'trial' && accountStatus === 'trial') {
                    setAccountStatus('active');
                  }
                }}
                style={{ width: '100%' }}
              >
                {Object.entries(PLAN_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key}>{cfg.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
                Status de Acesso
              </label>
              <select
                className="input-field"
                value={accountStatus}
                onChange={(e) => setAccountStatus(e.target.value)}
                disabled={isSelf}
                style={{ width: '100%' }}
              >
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key}>{cfg.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Controle de Expiração do Período de Teste */}
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '14px',
            padding: '0.9rem 1rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={15} color="var(--accent-primary)" />
                Data Limite do Período de Teste (Trial)
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[7, 15, 30].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => extendTrialDays(d)}
                    style={{
                      background: 'rgba(99, 102, 241, 0.12)',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      color: 'var(--accent-primary)',
                      borderRadius: '8px',
                      padding: '3px 8px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    +{d} dias
                  </button>
                ))}
              </div>
            </div>
            <input
              type="date"
              className="input-field"
              value={trialEndsAt}
              onChange={(e) => setTrialEndsAt(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          {/* Módulos Liberados (Feature Flags por Tenant) */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
              Módulos e Funcionalidades Liberadas para este Cliente
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
              {FEATURE_LIST.map((feat) => {
                const enabled = Boolean(features[feat.key]);
                return (
                  <div
                    key={feat.key}
                    onClick={() => toggleFeature(feat.key)}
                    style={{
                      padding: '0.7rem 0.85rem',
                      borderRadius: '12px',
                      border: enabled ? '1px solid rgba(99, 102, 241, 0.45)' : '1px solid var(--border-color)',
                      background: enabled ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.6rem',
                      transition: 'all 0.15s'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={() => {}}
                      style={{ marginTop: '3px', accentColor: '#6366f1' }}
                    />
                    <div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {feat.label}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.35 }}>
                        {feat.desc}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Anotações Internas do Admin */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
              Anotações Internas (Visível apenas no Backoffice)
            </label>
            <textarea
              className="input-field"
              rows={2}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Ex: Cliente entrou no lote de fundadores, pagou via Pix anual em 27/10..."
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>

          {/* Rodapé */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={onClose} className="btn btn-outline">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="btn btn-primary">
              <Save size={16} />
              {saving ? 'Salvando...' : 'Salvar Permissões'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
