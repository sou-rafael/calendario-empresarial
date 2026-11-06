-- ==============================================================================
-- KDCONTA — MIGRATION 003: CONTAS RECORRENTES E PARCELAMENTO FAMILIAR / MENSAL
-- ==============================================================================

-- 1. ADICIONA CAMPOS DE RECORRÊNCIA NA TABELA BILLS
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS recurrence_id UUID;
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS installment_current INTEGER;
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS installment_total INTEGER;

-- 2. ÍNDICE PARA CONSULTAS RÁPIDAS DE SÉRIES RECORRENTES
CREATE INDEX IF NOT EXISTS idx_bills_recurrence ON public.bills(user_id, recurrence_id);
