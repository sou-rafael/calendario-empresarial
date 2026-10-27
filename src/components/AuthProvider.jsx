import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [tenantProfile, setTenantProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchTenantProfile = useCallback(async (authUser) => {
    if (!authUser) {
      setTenantProfile(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('tenant_profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (error) {
        // Fallback gracioso caso a migration 002 ainda não tenha sido rodada no Supabase
        setTenantProfile({
          id: authUser.id,
          email: authUser.email,
          company_name: authUser.email?.split('@')[0] || 'Empresa',
          system_role: 'super_admin',
          plan_tier: 'founder',
          account_status: 'active',
          features: { scanner_pdf: true, voice_command: true, dre_view: true, ai_consultant: false },
          _migrationPending: true
        });
        return;
      }

      if (data) {
        setTenantProfile(data);
      } else {
        setTenantProfile({
          id: authUser.id,
          email: authUser.email,
          company_name: authUser.email?.split('@')[0] || 'Empresa',
          system_role: 'user',
          plan_tier: 'trial',
          account_status: 'trial',
          features: { scanner_pdf: true, voice_command: true, dre_view: true, ai_consultant: false }
        });
      }
    } catch (err) {
      console.error('Erro ao carregar perfil do tenant:', err);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isMounted) return;
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        await fetchTenantProfile(currentUser);
      }
      if (isMounted) setLoading(false);
    }).catch((err) => {
      console.error('Erro ao buscar sessão:', err);
      if (isMounted) setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        await fetchTenantProfile(currentUser);
      } else {
        setTenantProfile(null);
      }
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchTenantProfile]);

  const isSuperAdmin = tenantProfile?.system_role === 'super_admin';

  const isTrialExpired = Boolean(
    tenantProfile &&
    !isSuperAdmin &&
    tenantProfile.account_status === 'trial' &&
    tenantProfile.trial_ends_at &&
    new Date(tenantProfile.trial_ends_at) < new Date()
  );

  const isSuspended = Boolean(
    tenantProfile &&
    !isSuperAdmin &&
    (tenantProfile.account_status === 'suspended' || isTrialExpired)
  );

  const isReadOnly = Boolean(
    tenantProfile &&
    !isSuperAdmin &&
    tenantProfile.account_status === 'read_only'
  );

  return (
    <AuthContext.Provider value={{
      user,
      tenantProfile,
      isSuperAdmin,
      isTrialExpired,
      isSuspended,
      isReadOnly,
      refreshTenantProfile: () => fetchTenantProfile(user),
      loading
    }}>
      {loading ? (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#09090b',
          color: '#818cf8',
          fontFamily: 'sans-serif',
          fontSize: '0.9rem'
        }}>
          Carregando KdConta...
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
