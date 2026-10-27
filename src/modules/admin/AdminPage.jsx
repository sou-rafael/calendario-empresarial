import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../components/AuthProvider';
import {
  Shield, Users, DollarSign, Clock, Database, Search, RefreshCw,
  ArrowLeft, Sun, Moon, Settings2, CheckCircle2, Ban, Sparkles, AlertTriangle, FileText
} from 'lucide-react';
import { PLAN_CONFIG, STATUS_CONFIG, fetchTenantsOverview, updateTenantAccess } from './adminService';
import AdminTenantModal from './AdminTenantModal';

export default function AdminPage() {
  const { user, refreshTenantProfile } = useAuth();
  const navigate = useNavigate();

  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [migrationRequired, setMigrationRequired] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Filtros e Busca
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');

  // Modal de Edição
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Tema Claro / Escuro
  const [isLightMode, setIsLightMode] = useState(() => localStorage.getItem('theme') === 'light');

  useEffect(() => {
    if (isLightMode) {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
  }, [isLightMode]);

  const toggleTheme = () => {
    const next = !isLightMode;
    setIsLightMode(next);
    localStorage.setItem('theme', next ? 'light' : 'dark');
  };

  const loadTenants = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetchTenantsOverview();
      setTenants(res.data || []);
      setMigrationRequired(Boolean(res.migrationRequired));
    } catch (err) {
      setErrorMsg(err.message || 'Erro ao carregar lista de clientes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTenants();
  }, []);

  // Cálculo de dias restantes do trial
  const getTrialInfo = (tenant) => {
    if (!tenant.trial_ends_at) return { daysLeft: 7, expired: false };
    const diffMs = new Date(tenant.trial_ends_at).getTime() - Date.now();
    const daysLeft = Math.ceil(diffMs / 86400000);
    return { daysLeft, expired: daysLeft < 0 };
  };

  // KPIs agregados da plataforma
  const metrics = useMemo(() => {
    let activeCount = 0;
    let trialCount = 0;
    let expiredOrSuspendedCount = 0;
    let mrr = 0;
    let totalBills = 0;
    let totalAttachments = 0;

    tenants.forEach((t) => {
      totalBills += Number(t.bills_count || 0);
      totalAttachments += Number(t.attachments_count || 0);

      const { expired } = getTrialInfo(t);
      if (t.account_status === 'suspended' || (t.account_status === 'trial' && expired)) {
        expiredOrSuspendedCount++;
      } else if (t.account_status === 'trial') {
        trialCount++;
      } else if (t.account_status === 'active') {
        activeCount++;
        const plan = PLAN_CONFIG[t.plan_tier];
        if (plan) mrr += plan.price;
      }
    });

    return {
      total: tenants.length,
      activeCount,
      trialCount,
      expiredOrSuspendedCount,
      mrr,
      totalBills,
      totalAttachments
    };
  }, [tenants]);

  // Lista filtrada
  const filteredTenants = useMemo(() => {
    return tenants.filter((t) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (t.email || '').toLowerCase().includes(q) ||
        (t.company_name || '').toLowerCase().includes(q) ||
        (t.admin_notes || '').toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (planFilter !== 'all' && t.plan_tier !== planFilter) return false;

      if (statusFilter !== 'all') {
        const { expired } = getTrialInfo(t);
        if (statusFilter === 'expired_or_suspended') {
          return t.account_status === 'suspended' || (t.account_status === 'trial' && expired);
        }
        return t.account_status === statusFilter;
      }

      return true;
    });
  }, [tenants, searchQuery, statusFilter, planFilter]);

  const handleSaveTenant = async (payload) => {
    await updateTenantAccess(payload);
    await loadTenants();
    await refreshTenantProfile();
  };

  // Ações rápidas na linha da tabela
  const handleQuickAction = async (tenant, actionType) => {
    try {
      const basePayload = {
        id: tenant.id,
        company_name: tenant.company_name || '',
        system_role: tenant.system_role || 'user',
        plan_tier: tenant.plan_tier || 'trial',
        account_status: tenant.account_status || 'trial',
        trial_ends_at: tenant.trial_ends_at,
        features: tenant.features || { scanner_pdf: true, voice_command: true, dre_view: true, ai_consultant: false },
        admin_notes: tenant.admin_notes || ''
      };

      if (actionType === 'activate_founder') {
        basePayload.plan_tier = 'founder';
        basePayload.account_status = 'active';
      } else if (actionType === 'extend_7d') {
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + 7);
        basePayload.account_status = 'trial';
        basePayload.trial_ends_at = nextDate.toISOString();
      } else if (actionType === 'toggle_suspend') {
        if (tenant.id === user?.id) {
          alert('Você não pode suspender a sua própria conta de Super Admin.');
          return;
        }
        basePayload.account_status = tenant.account_status === 'suspended' ? 'active' : 'suspended';
      }

      await handleSaveTenant(basePayload);
    } catch (err) {
      alert('Erro ao executar ação rápida: ' + err.message);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg-color)',
      color: 'var(--text-primary)',
      padding: '1.5rem 2rem',
      maxWidth: '1400px',
      margin: '0 auto'
    }}>
      {/* Topbar do Backoffice */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        paddingBottom: '1.25rem',
        marginBottom: '1.5rem',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)'
          }}>
            <Shield size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                KdConta Backoffice
              </h1>
              <span style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '999px',
                background: 'rgba(99, 102, 241, 0.15)',
                color: 'var(--accent-primary)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                textTransform: 'uppercase'
              }}>
                Multi-Tenant Admin
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
              Controle central de clientes, assinaturas, períodos de teste (7 dias) e permissões de módulos
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <button
            onClick={toggleTheme}
            className="btn btn-outline"
            style={{ padding: '0.55rem 0.8rem', borderRadius: '12px' }}
            title="Alternar tema"
          >
            {isLightMode ? <Moon size={16} /> : <Sun size={16} />}
          </button>

          <button
            onClick={loadTenants}
            className="btn btn-outline"
            style={{ padding: '0.55rem 0.9rem', borderRadius: '12px' }}
          >
            <RefreshCw size={15} />
            Atualizar
          </button>

          <button
            onClick={() => navigate('/')}
            className="btn btn-primary"
            style={{ padding: '0.55rem 1rem', borderRadius: '12px' }}
          >
            <ArrowLeft size={16} />
            Ir para o Calendário
          </button>
        </div>
      </header>

      {/* Aviso caso a Migration 002 ainda não tenha sido rodada no Supabase */}
      {migrationRequired && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          borderRadius: '16px',
          padding: '1.25rem 1.5rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '1rem'
        }}>
          <AlertTriangle size={24} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: '0 0 0.35rem', color: '#f59e0b' }}>
              Ação Necessária no Banco: Executar Migration Multi-Tenant (002)
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              Para ativar a listagem global de clientes e o controle de permissões em produção, abra o <strong>SQL Editor do Supabase</strong> e execute o arquivo{' '}
              <code>supabase/migrations/20261028000000_multi_tenant_admin.sql</code>. Ele criará a tabela <code>tenant_profiles</code>, as funções RPC blindadas e promoverá sua conta a <strong>Super Admin</strong> automaticamente.
            </p>
          </div>
        </div>
      )}

      {errorMsg && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          color: '#ef4444',
          padding: '1rem',
          borderRadius: '12px',
          marginBottom: '1.5rem',
          fontSize: '0.85rem',
          fontWeight: 600
        }}>
          {errorMsg}
        </div>
      )}

      {/* Cards de KPIs Globais */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '1.15rem 1.25rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Total de Clientes (Tenants)</span>
            <Users size={18} color="#818cf8" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{metrics.total}</div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {metrics.activeCount} ativos · {metrics.trialCount} em período de teste
          </div>
        </div>

        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '1.15rem 1.25rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>MRR Estimado (Assinaturas)</span>
            <DollarSign size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981' }}>
            {metrics.mrr.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Baseado nos clientes com status Ativo
          </div>
        </div>

        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '1.15rem 1.25rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Trials & Atenção Comercial</span>
            <Clock size={18} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f59e0b' }}>
            {metrics.trialCount} <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>em teste</span>
          </div>
          <div style={{ fontSize: '0.74rem', color: metrics.expiredOrSuspendedCount > 0 ? '#ef4444' : 'var(--text-muted)', marginTop: '0.25rem' }}>
            {metrics.expiredOrSuspendedCount} expirados ou suspensos
          </div>
        </div>

        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '1.15rem 1.25rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Volume na Nuvem (Supabase)</span>
            <Database size={18} color="#38bdf8" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>
            {metrics.totalBills} <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-muted)' }}>contas</span>
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {metrics.totalAttachments} boletos armazenados no bucket privado
          </div>
        </div>
      </div>

      {/* Barra de Busca e Filtros */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.75rem',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        padding: '0.9rem 1.1rem',
        marginBottom: '1.25rem'
      }}>
        <div style={{ position: 'relative', flex: '1 1 280px' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="input-field"
            placeholder="Buscar cliente por e-mail, empresa ou anotação..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', paddingLeft: '36px' }}
          />
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
          <select
            className="input-field"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ minWidth: '170px' }}
          >
            <option value="all">Todos os Status</option>
            <option value="active">🟢 Ativos</option>
            <option value="trial">🟡 Em Teste (Trial)</option>
            <option value="read_only">🔵 Somente Leitura</option>
            <option value="expired_or_suspended">🔴 Vencidos / Suspensos</option>
          </select>

          <select
            className="input-field"
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            style={{ minWidth: '170px' }}
          >
            <option value="all">Todos os Planos</option>
            {Object.entries(PLAN_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>{cfg.shortLabel}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabela de Tenants */}
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '18px',
        overflowX: 'auto'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <th style={{ padding: '0.95rem 1.2rem' }}>Cliente / Tenant</th>
              <th style={{ padding: '0.95rem 1rem' }}>Plano (Tier)</th>
              <th style={{ padding: '0.95rem 1rem' }}>Status & Trial</th>
              <th style={{ padding: '0.95rem 1rem' }}>Uso & Recursos</th>
              <th style={{ padding: '0.95rem 1rem' }}>Último Acesso</th>
              <th style={{ padding: '0.95rem 1.2rem', textAlign: 'right' }}>Ações Rápidas</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Carregando clientes da plataforma...
                </td>
              </tr>
            ) : filteredTenants.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Nenhum cliente encontrado para os filtros selecionados.
                </td>
              </tr>
            ) : (
              filteredTenants.map((tenant) => {
                const plan = PLAN_CONFIG[tenant.plan_tier] || PLAN_CONFIG.trial;
                const status = STATUS_CONFIG[tenant.account_status] || STATUS_CONFIG.trial;
                const { daysLeft, expired } = getTrialInfo(tenant);
                const isSelf = tenant.id === user?.id;

                return (
                  <tr
                    key={tenant.id}
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      transition: 'background 0.15s'
                    }}
                  >
                    {/* Identificação */}
                    <td style={{ padding: '1rem 1.2rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '10px',
                          background: tenant.system_role === 'super_admin'
                            ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
                            : 'var(--bg-primary)',
                          border: '1px solid var(--border-color)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          color: tenant.system_role === 'super_admin' ? '#fff' : 'var(--text-primary)',
                          fontSize: '0.85rem',
                          flexShrink: 0
                        }}>
                          {(tenant.company_name || tenant.email || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                              {tenant.company_name || tenant.email?.split('@')[0]}
                            </span>
                            {tenant.system_role === 'super_admin' && (
                              <span style={{
                                fontSize: '0.62rem',
                                fontWeight: 800,
                                padding: '1px 6px',
                                borderRadius: '6px',
                                background: 'rgba(99, 102, 241, 0.18)',
                                color: '#818cf8',
                                textTransform: 'uppercase'
                              }}>
                                Super Admin
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                            {tenant.email}
                          </div>
                          {tenant.admin_notes && (
                            <div style={{ fontSize: '0.68rem', color: 'var(--accent-primary)', marginTop: '2px' }}>
                              📝 {tenant.admin_notes}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Plano */}
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        borderRadius: '999px',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        color: plan.color,
                        background: plan.bg,
                        border: `1px solid ${plan.border}`
                      }}>
                        {plan.shortLabel}
                      </span>
                    </td>

                    {/* Status & Validade do Trial */}
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 9px',
                          borderRadius: '999px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          color: tenant.account_status === 'trial' && expired ? '#ef4444' : status.color,
                          background: tenant.account_status === 'trial' && expired ? 'rgba(239, 68, 68, 0.12)' : status.bg,
                          border: `1px solid ${tenant.account_status === 'trial' && expired ? 'rgba(239, 68, 68, 0.3)' : status.border}`
                        }}>
                          {tenant.account_status === 'trial' && expired ? 'Trial Expirado' : status.shortLabel}
                        </span>

                        {tenant.account_status === 'trial' && (
                          <span style={{ fontSize: '0.7rem', color: expired ? '#ef4444' : 'var(--text-muted)', fontWeight: 600 }}>
                            {expired ? `Venceu há ${Math.abs(daysLeft)}d` : `${daysLeft} dia(s) restante(s)`}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Uso & Recursos */}
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {tenant.bills_count || 0} lançamentos
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <FileText size={12} /> {tenant.attachments_count || 0} boletos no Storage
                      </div>
                    </td>

                    {/* Último Acesso */}
                    <td style={{ padding: '1rem', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                      <div>
                        {tenant.last_sign_in_at
                          ? new Date(tenant.last_sign_in_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
                          : 'Sem login recente'}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                        Criado em {new Date(tenant.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </td>

                    {/* Ações Rápidas */}
                    <td style={{ padding: '1rem 1.2rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        {tenant.plan_tier === 'trial' && (
                          <button
                            onClick={() => handleQuickAction(tenant, 'activate_founder')}
                            title="Ativar Plano Membro Fundador (R$ 19,90)"
                            style={{
                              background: 'rgba(16, 185, 129, 0.12)',
                              border: '1px solid rgba(16, 185, 129, 0.3)',
                              color: '#10b981',
                              borderRadius: '8px',
                              padding: '5px 8px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Sparkles size={13} />
                            Ativar Founder
                          </button>
                        )}

                        {tenant.account_status === 'trial' && (
                          <button
                            onClick={() => handleQuickAction(tenant, 'extend_7d')}
                            title="Renovar mais 7 dias de teste gratuito"
                            style={{
                              background: 'rgba(245, 158, 11, 0.12)',
                              border: '1px solid rgba(245, 158, 11, 0.3)',
                              color: '#f59e0b',
                              borderRadius: '8px',
                              padding: '5px 8px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            +7d
                          </button>
                        )}

                        {!isSelf && (
                          <button
                            onClick={() => handleQuickAction(tenant, 'toggle_suspend')}
                            title={tenant.account_status === 'suspended' ? 'Liberar acesso do cliente' : 'Suspender acesso do cliente'}
                            style={{
                              background: tenant.account_status === 'suspended' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.1)',
                              border: `1px solid ${tenant.account_status === 'suspended' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.28)'}`,
                              color: tenant.account_status === 'suspended' ? '#10b981' : '#ef4444',
                              borderRadius: '8px',
                              padding: '5px 8px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            {tenant.account_status === 'suspended' ? <CheckCircle2 size={13} /> : <Ban size={13} />}
                            {tenant.account_status === 'suspended' ? 'Liberar' : 'Suspender'}
                          </button>
                        )}

                        <button
                          onClick={() => { setSelectedTenant(tenant); setIsModalOpen(true); }}
                          style={{
                            background: 'var(--bg-primary)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-primary)',
                            borderRadius: '8px',
                            padding: '5px 10px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                        >
                          <Settings2 size={14} color="var(--accent-primary)" />
                          Permissões
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Edição Completa */}
      <AdminTenantModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        tenant={selectedTenant}
        currentUserId={user?.id}
        onSave={handleSaveTenant}
      />
    </div>
  );
}
