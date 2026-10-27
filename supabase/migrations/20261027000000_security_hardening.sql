-- ==============================================================================
-- KDCONTA — MIGRATION 001: HARDENING DE SEGURANÇA E ISOLAMENTO MULTI-TENANT
-- ==============================================================================

-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABELA CATEGORIES (Sincronizada com context e DEFAULT auth.uid())
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid() NOT NULL,
  name TEXT NOT NULL CHECK (char_length(name) <= 100),
  color TEXT DEFAULT '#6366f1',
  context TEXT DEFAULT 'empresarial' CHECK (context IN ('empresarial', 'pessoal')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

ALTER TABLE public.categories ALTER COLUMN user_id SET DEFAULT auth.uid();

-- 3. TABELA BILLS (Sincronizada com todos os campos do frontend e DEFAULT auth.uid())
CREATE TABLE IF NOT EXISTS public.bills (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid() NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  description TEXT NOT NULL CHECK (char_length(description) <= 255),
  amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  date DATE NOT NULL,
  status TEXT DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Pago')),
  type TEXT DEFAULT 'despesa' CHECK (type IN ('despesa', 'receita')),
  context TEXT DEFAULT 'empresarial' CHECK (context IN ('empresarial', 'pessoal')),
  barcode TEXT CHECK (barcode IS NULL OR char_length(barcode) <= 60),
  file_url TEXT,
  file_name TEXT,
  person TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

ALTER TABLE public.bills ALTER COLUMN user_id SET DEFAULT auth.uid();

-- 4. ÍNDICES DE PERFORMANCE E DEFESA CONTRA DoS
CREATE INDEX IF NOT EXISTS idx_categories_user ON public.categories(user_id, context);
CREATE INDEX IF NOT EXISTS idx_bills_user ON public.bills(user_id, context, date);
CREATE INDEX IF NOT EXISTS idx_bills_category ON public.bills(category_id);

-- 5. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;

-- 6. POLÍTICAS RLS PARA CATEGORIES
DROP POLICY IF EXISTS "Usuários podem ver suas próprias categorias" ON public.categories;
DROP POLICY IF EXISTS "Usuários podem inserir suas próprias categorias" ON public.categories;
DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias categorias" ON public.categories;
DROP POLICY IF EXISTS "Usuários podem deletar suas próprias categorias" ON public.categories;
DROP POLICY IF EXISTS "categories_select_own" ON public.categories;
DROP POLICY IF EXISTS "categories_insert_own" ON public.categories;
DROP POLICY IF EXISTS "categories_update_own" ON public.categories;
DROP POLICY IF EXISTS "categories_delete_own" ON public.categories;

CREATE POLICY "categories_select_own" ON public.categories
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "categories_insert_own" ON public.categories
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "categories_update_own" ON public.categories
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "categories_delete_own" ON public.categories
FOR DELETE USING (auth.uid() = user_id);

-- 7. POLÍTICAS RLS PARA BILLS (Com validação cruzada de category_id do mesmo tenant)
DROP POLICY IF EXISTS "Usuários podem ver suas próprias contas" ON public.bills;
DROP POLICY IF EXISTS "Usuários podem inserir suas próprias contas" ON public.bills;
DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias contas" ON public.bills;
DROP POLICY IF EXISTS "Usuários podem deletar suas próprias contas" ON public.bills;
DROP POLICY IF EXISTS "bills_select_own" ON public.bills;
DROP POLICY IF EXISTS "bills_insert_own" ON public.bills;
DROP POLICY IF EXISTS "bills_update_own" ON public.bills;
DROP POLICY IF EXISTS "bills_delete_own" ON public.bills;

CREATE POLICY "bills_select_own" ON public.bills
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "bills_insert_own" ON public.bills
FOR INSERT WITH CHECK (
  auth.uid() = user_id AND
  (category_id IS NULL OR EXISTS (
    SELECT 1 FROM public.categories c WHERE c.id = category_id AND c.user_id = auth.uid()
  ))
);

CREATE POLICY "bills_update_own" ON public.bills
FOR UPDATE USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id AND
  (category_id IS NULL OR EXISTS (
    SELECT 1 FROM public.categories c WHERE c.id = category_id AND c.user_id = auth.uid()
  ))
);

CREATE POLICY "bills_delete_own" ON public.bills
FOR DELETE USING (auth.uid() = user_id);

-- ==============================================================================
-- 8. STORAGE HARDENING: BUCKET PRIVADO 'boletos' E POLÍTICAS DE ACESSO
-- Nota: Não executamos ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY
-- pois já vem habilitado nativamente no Supabase.
-- ==============================================================================

-- Converte URLs públicas legadas de file_url para apenas o filePath relativo
UPDATE public.bills
SET file_url = regexp_replace(file_url, '^https?://[^/]+/storage/v1/object/public/boletos/', '')
WHERE file_url LIKE '%/storage/v1/object/public/boletos/%';

-- Configura o bucket 'boletos' como PRIVADO (public = false) com limites de segurança
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'boletos',
  'boletos',
  false,
  10485760, -- 10 MB limite máximo por arquivo
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

-- Políticas em storage.objects para isolamento por pasta do usuário (user_id/*)
DROP POLICY IF EXISTS "storage_boletos_select_own" ON storage.objects;
CREATE POLICY "storage_boletos_select_own" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'boletos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "storage_boletos_insert_own" ON storage.objects;
CREATE POLICY "storage_boletos_insert_own" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'boletos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "storage_boletos_update_own" ON storage.objects;
CREATE POLICY "storage_boletos_update_own" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'boletos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "storage_boletos_delete_own" ON storage.objects;
CREATE POLICY "storage_boletos_delete_own" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'boletos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
