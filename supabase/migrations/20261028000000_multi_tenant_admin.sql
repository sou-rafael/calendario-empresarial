-- ==============================================================================
-- KDCONTA — MIGRATION 002: PAINEL DE ADMINISTRAÇÃO MULTI-TENANT (BACKOFFICE)
-- ==============================================================================

-- 1. TABELA DE PERFIS E CONTROLE DE TENANTS (Sincronizada com auth.users)
CREATE TABLE IF NOT EXISTS public.tenant_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  company_name TEXT DEFAULT '',
  system_role TEXT NOT NULL DEFAULT 'user' CHECK (system_role IN ('user', 'super_admin')),
  plan_tier TEXT NOT NULL DEFAULT 'trial' CHECK (plan_tier IN ('trial', 'founder', 'solo', 'pro', 'business')),
  account_status TEXT NOT NULL DEFAULT 'trial' CHECK (account_status IN ('active', 'trial', 'read_only', 'suspended')),
  trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (TIMEZONE('utc', NOW()) + INTERVAL '7 days'),
  features JSONB NOT NULL DEFAULT '{"scanner_pdf": true, "voice_command": true, "dre_view": true, "ai_consultant": false}'::jsonb,
  admin_notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tenant_profiles_role ON public.tenant_profiles(system_role);
CREATE INDEX IF NOT EXISTS idx_tenant_profiles_status ON public.tenant_profiles(account_status, plan_tier);

-- 2. FUNÇÕES AUXILIARES DE SEGURANÇA E PERMISSÃO (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.tenant_profiles
    WHERE id = auth.uid()
      AND system_role = 'super_admin'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_tenant_write_allowed()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
  v_status TEXT;
  v_trial_ends TIMESTAMPTZ;
BEGIN
  SELECT system_role, account_status, trial_ends_at
  INTO v_role, v_status, v_trial_ends
  FROM public.tenant_profiles
  WHERE id = auth.uid();

  -- Fallback seguro caso o perfil ainda não exista
  IF NOT FOUND THEN
    RETURN TRUE;
  END IF;

  -- Super Admin sempre tem permissão total
  IF v_role = 'super_admin' THEN
    RETURN TRUE;
  END IF;

  -- Cliente com assinatura ativa
  IF v_status = 'active' THEN
    RETURN TRUE;
  END IF;

  -- Cliente em período de teste dentro da validade
  IF v_status = 'trial' AND (v_trial_ends IS NULL OR v_trial_ends >= TIMEZONE('utc', NOW())) THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

-- 3. TRIGGER AUTOMÁTICO PARA NOVOS CADASTROS EM auth.users
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_admin BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_profiles WHERE system_role = 'super_admin'
  ) INTO v_has_admin;

  INSERT INTO public.tenant_profiles (
    id,
    email,
    company_name,
    system_role,
    plan_tier,
    account_status,
    trial_ends_at
  ) VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'company_name', split_part(COALESCE(NEW.email, ''), '@', 1)),
    CASE WHEN NOT v_has_admin THEN 'super_admin' ELSE 'user' END,
    CASE WHEN NOT v_has_admin THEN 'founder' ELSE 'trial' END,
    CASE WHEN NOT v_has_admin THEN 'active' ELSE 'trial' END,
    TIMEZONE('utc', NOW()) + INTERVAL '7 days'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = TIMEZONE('utc', NOW());

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- 4. BACKFILL DOS USUÁRIOS JÁ EXISTENTES EM auth.users
INSERT INTO public.tenant_profiles (id, email, company_name, system_role, plan_tier, account_status, trial_ends_at, created_at)
SELECT
  u.id,
  COALESCE(u.email, ''),
  split_part(COALESCE(u.email, ''), '@', 1),
  'user',
  'trial',
  'trial',
  TIMEZONE('utc', NOW()) + INTERVAL '7 days',
  COALESCE(u.created_at, TIMEZONE('utc', NOW()))
FROM auth.users u
ON CONFLICT (id) DO NOTHING;

-- Promove automaticamente o primeiro usuário cadastrado (fundador) a super_admin caso ainda não haja nenhum
UPDATE public.tenant_profiles
SET
  system_role = 'super_admin',
  plan_tier = 'founder',
  account_status = 'active',
  updated_at = TIMEZONE('utc', NOW())
WHERE id = (
  SELECT id FROM public.tenant_profiles ORDER BY created_at ASC LIMIT 1
)
AND NOT EXISTS (
  SELECT 1 FROM public.tenant_profiles WHERE system_role = 'super_admin'
);

-- 5. RLS EM public.tenant_profiles
ALTER TABLE public.tenant_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_profiles_select_own_or_admin" ON public.tenant_profiles;
CREATE POLICY "tenant_profiles_select_own_or_admin" ON public.tenant_profiles
FOR SELECT USING (
  auth.uid() = id OR public.is_super_admin()
);

DROP POLICY IF EXISTS "tenant_profiles_update_super_admin" ON public.tenant_profiles;
CREATE POLICY "tenant_profiles_update_super_admin" ON public.tenant_profiles
FOR UPDATE USING (
  public.is_super_admin()
) WITH CHECK (
  public.is_super_admin()
);

-- 6. REFORÇO DAS POLÍTICAS DE ESCRITA EM BILLS E CATEGORIES (RESPEITANDO BLOQUEIO/READ-ONLY DO TENANT)
DROP POLICY IF EXISTS "categories_insert_own" ON public.categories;
CREATE POLICY "categories_insert_own" ON public.categories
FOR INSERT WITH CHECK (
  auth.uid() = user_id AND public.is_tenant_write_allowed()
);

DROP POLICY IF EXISTS "categories_update_own" ON public.categories;
CREATE POLICY "categories_update_own" ON public.categories
FOR UPDATE USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id AND public.is_tenant_write_allowed()
);

DROP POLICY IF EXISTS "categories_delete_own" ON public.categories;
CREATE POLICY "categories_delete_own" ON public.categories
FOR DELETE USING (
  auth.uid() = user_id AND public.is_tenant_write_allowed()
);

DROP POLICY IF EXISTS "bills_insert_own" ON public.bills;
CREATE POLICY "bills_insert_own" ON public.bills
FOR INSERT WITH CHECK (
  auth.uid() = user_id AND
  public.is_tenant_write_allowed() AND
  (category_id IS NULL OR EXISTS (
    SELECT 1 FROM public.categories c WHERE c.id = category_id AND c.user_id = auth.uid()
  ))
);

DROP POLICY IF EXISTS "bills_update_own" ON public.bills;
CREATE POLICY "bills_update_own" ON public.bills
FOR UPDATE USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id AND
  public.is_tenant_write_allowed() AND
  (category_id IS NULL OR EXISTS (
    SELECT 1 FROM public.categories c WHERE c.id = category_id AND c.user_id = auth.uid()
  ))
);

DROP POLICY IF EXISTS "bills_delete_own" ON public.bills;
CREATE POLICY "bills_delete_own" ON public.bills
FOR DELETE USING (
  auth.uid() = user_id AND public.is_tenant_write_allowed()
);

-- ==============================================================================
-- 7. FUNÇÕES RPC EXCLUSIVAS DO PAINEL DE ADMINISTRAÇÃO (BACKOFFICE)
-- ==============================================================================

-- 7.1. Listar todos os tenants com métricas agregadas (sem expor valores/descrições financeiras privadas)
CREATE OR REPLACE FUNCTION public.admin_get_tenants_overview()
RETURNS TABLE (
  id UUID,
  email TEXT,
  company_name TEXT,
  system_role TEXT,
  plan_tier TEXT,
  account_status TEXT,
  trial_ends_at TIMESTAMPTZ,
  features JSONB,
  admin_notes TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ,
  bills_count BIGINT,
  attachments_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Acesso negado: apenas Super Administradores podem consultar a visão global de tenants.';
  END IF;

  RETURN QUERY
  SELECT
    tp.id,
    tp.email,
    tp.company_name,
    tp.system_role,
    tp.plan_tier,
    tp.account_status,
    tp.trial_ends_at,
    tp.features,
    tp.admin_notes,
    tp.created_at,
    tp.updated_at,
    au.last_sign_in_at,
    COALESCE(b.bills_total, 0) AS bills_count,
    COALESCE(b.attachments_total, 0) AS attachments_count
  FROM public.tenant_profiles tp
  LEFT JOIN auth.users au ON au.id = tp.id
  LEFT JOIN (
    SELECT
      user_id,
      COUNT(*)::BIGINT AS bills_total,
      COUNT(*) FILTER (WHERE file_url IS NOT NULL AND file_url <> '')::BIGINT AS attachments_total
    FROM public.bills
    GROUP BY user_id
  ) b ON b.user_id = tp.id
  ORDER BY tp.created_at DESC;
END;
$$;

-- 7.2. Atualizar plano, status, trial, permissões e notas de um tenant específico
CREATE OR REPLACE FUNCTION public.admin_update_tenant_access(
  p_tenant_id UUID,
  p_company_name TEXT,
  p_system_role TEXT,
  p_plan_tier TEXT,
  p_account_status TEXT,
  p_trial_ends_at TIMESTAMPTZ,
  p_features JSONB,
  p_admin_notes TEXT
)
RETURNS public.tenant_profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated public.tenant_profiles;
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Acesso negado: apenas Super Administradores podem alterar permissões de tenants.';
  END IF;

  -- Proteção contra auto-bloqueio acidental do próprio Super Admin logado
  IF p_tenant_id = auth.uid() AND (p_system_role <> 'super_admin' OR p_account_status IN ('suspended', 'read_only')) THEN
    RAISE EXCEPTION 'Operação bloqueada: você não pode remover seu próprio privilégio de Super Admin nem suspender sua própria conta.';
  END IF;

  UPDATE public.tenant_profiles
  SET
    company_name = COALESCE(p_company_name, company_name),
    system_role = COALESCE(p_system_role, system_role),
    plan_tier = COALESCE(p_plan_tier, plan_tier),
    account_status = COALESCE(p_account_status, account_status),
    trial_ends_at = p_trial_ends_at,
    features = COALESCE(p_features, features),
    admin_notes = COALESCE(p_admin_notes, admin_notes),
    updated_at = TIMEZONE('utc', NOW())
  WHERE id = p_tenant_id
  RETURNING * INTO v_updated;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tenant não encontrado.';
  END IF;

  RETURN v_updated;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_tenants_overview() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_tenant_access(UUID, TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ, JSONB, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_tenant_write_allowed() TO authenticated;
