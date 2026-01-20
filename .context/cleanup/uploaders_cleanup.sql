-- Cleanup: remover objetos F3F criados no projeto errado (Uploaders)
-- ATENCAO: execute somente no projeto Uploaders.
-- Este script tenta remover apenas estruturas do F3F.

BEGIN;

-- Remover tabelas (ordem por dependencia)
DROP TABLE IF EXISTS public.contrato_status_historico CASCADE;
DROP TABLE IF EXISTS public.plano_servicos CASCADE;
DROP TABLE IF EXISTS public.cliente_servicos CASCADE;
DROP TABLE IF EXISTS public.cliente_planos CASCADE;
DROP TABLE IF EXISTS public.planos CASCADE;
DROP TABLE IF EXISTS public.servicos CASCADE;
DROP TABLE IF EXISTS public.servicos_prestados CASCADE;
DROP TABLE IF EXISTS public.transacoes CASCADE;
DROP TABLE IF EXISTS public.ocorrencias CASCADE;
DROP TABLE IF EXISTS public.ocorrencia_tipos CASCADE;
DROP TABLE IF EXISTS public.ocorrencia_grupos CASCADE;
DROP TABLE IF EXISTS public.atendimentos CASCADE;
DROP TABLE IF EXISTS public.cliente_responsaveis CASCADE;
DROP TABLE IF EXISTS public.equipe_membros CASCADE;
DROP TABLE IF EXISTS public.clientes CASCADE;
DROP TABLE IF EXISTS public.usuarios CASCADE;

-- Remover funcoes criadas pelas migrations
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.validate_single_principal_per_cliente() CASCADE;
DROP FUNCTION IF EXISTS public.registrar_mudanca_status_contrato() CASCADE;

-- Limpar registro de migrations se existir
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'supabase_migrations'
      AND table_name = 'schema_migrations'
  ) THEN
    DELETE FROM supabase_migrations.schema_migrations
    WHERE version IN (
      '20260115114000',
      '20260115120000',
      '20260115170000',
      '20260115180000',
      '20260116000000',
      '20260117000000',
      '20260117010000'
    );
  END IF;
END $$;

COMMIT;
