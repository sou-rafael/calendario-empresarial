import { supabase } from '../../lib/supabase';

export const PLAN_CONFIG = {
  trial: {
    label: 'Trial Gratuito (7 dias)',
    shortLabel: 'Trial 7d',
    price: 0,
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.3)'
  },
  founder: {
    label: 'Membro Fundador (R$ 19,90)',
    shortLabel: 'Founder · R$ 19,90',
    price: 19.90,
    color: '#818cf8',
    bg: 'rgba(99, 102, 241, 0.14)',
    border: 'rgba(99, 102, 241, 0.35)'
  },
  solo: {
    label: 'KdConta Solo (R$ 29,90)',
    shortLabel: 'Solo · R$ 29,90',
    price: 29.90,
    color: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.12)',
    border: 'rgba(56, 189, 248, 0.3)'
  },
  pro: {
    label: 'KdConta Pro (R$ 59,90)',
    shortLabel: 'Pro · R$ 59,90',
    price: 59.90,
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(16, 185, 129, 0.3)'
  },
  business: {
    label: 'KdConta Business (R$ 119,90)',
    shortLabel: 'Business · R$ 119,90',
    price: 119.90,
    color: '#ec4899',
    bg: 'rgba(236, 72, 153, 0.12)',
    border: 'rgba(236, 72, 153, 0.3)'
  }
};

export const STATUS_CONFIG = {
  active: {
    label: 'Ativo (Liberado)',
    shortLabel: 'Ativo',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(16, 185, 129, 0.3)'
  },
  trial: {
    label: 'Em Teste (7 dias)',
    shortLabel: 'Em Teste',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.3)'
  },
  read_only: {
    label: 'Somente Leitura',
    shortLabel: 'Só Leitura',
    color: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.12)',
    border: 'rgba(56, 189, 248, 0.3)'
  },
  suspended: {
    label: 'Suspenso / Bloqueado',
    shortLabel: 'Suspenso',
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.12)',
    border: 'rgba(239, 68, 68, 0.3)'
  }
};

export const FEATURE_LIST = [
  { key: 'scanner_pdf', label: 'Scanner de Boletos (PDF / Câmera)', desc: 'Importação automática FEBRABAN e anexo no Storage' },
  { key: 'voice_command', label: 'Lançamento por Comando de Voz', desc: 'Transcrição de áudio e agendamento rápido' },
  { key: 'dre_view', label: 'DRE Gerencial Mensal', desc: 'Relatório de resultado líquido por competência' },
  { key: 'ai_consultant', label: 'Consultor IA Conversacional (Early Access)', desc: 'Acesso antecipado ao assistente inteligente' }
];

export async function fetchTenantsOverview() {
  const { data, error } = await supabase.rpc('admin_get_tenants_overview');

  if (error) {
    // Detecta se a migration 20261028000000_multi_tenant_admin.sql ainda não foi executada no banco
    if (
      error.code === 'PGRST202' ||
      error.code === '42883' ||
      error.message?.includes('admin_get_tenants_overview') ||
      error.message?.includes('tenant_profiles')
    ) {
      return { data: [], migrationRequired: true, error: null };
    }
    throw error;
  }

  return { data: data || [], migrationRequired: false, error: null };
}

export async function updateTenantAccess(payload) {
  const { data, error } = await supabase.rpc('admin_update_tenant_access', {
    p_tenant_id: payload.id,
    p_company_name: payload.company_name,
    p_system_role: payload.system_role,
    p_plan_tier: payload.plan_tier,
    p_account_status: payload.account_status,
    p_trial_ends_at: payload.trial_ends_at,
    p_features: payload.features,
    p_admin_notes: payload.admin_notes
  });

  if (error) throw error;
  return data;
}
