-- =============================================================================
-- Fix: RLS cr_insert sem recursão + trigger para garantir apenas 1 principal
-- =============================================================================
-- Problema: cr_insert WITH CHECK chamava is_responsavel_do_cliente() que faz
-- SELECT em cliente_responsaveis — causando recursão/deadlock no PostgreSQL
-- quando avaliado durante INSERT. Admin não conseguia adicionar 2º responsável.
--
-- Solução:
-- 1) cr_insert simplificado: verifica role direto em usuarios (sem recursão).
-- 2) Trigger enforce_single_principal: garante no banco que só 1 responsável
--    por cliente pode ter role 'principal' ativo (deleted_at IS NULL).
-- =============================================================================

-- 1) Recriar cr_insert sem chamar is_responsavel_do_cliente (evita recursão)
DROP POLICY IF EXISTS "cr_insert" ON public.cliente_responsaveis;

CREATE POLICY "cr_insert" ON public.cliente_responsaveis
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      -- Admin sempre pode inserir
      (SELECT role FROM public.usuarios WHERE id = auth.uid()) = 'admin'
      -- Agente pode inserir se for responsável do cliente (verificação direta, sem recursão)
      OR EXISTS (
        SELECT 1 FROM public.cliente_responsaveis cr2
        WHERE cr2.cliente_id = cliente_responsaveis.cliente_id
          AND cr2.responsavel_id = auth.uid()
          AND cr2.deleted_at IS NULL
      )
    )
  );

-- 2) Trigger: garante apenas 1 responsável principal ativo por cliente
CREATE OR REPLACE FUNCTION public.enforce_single_principal()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Só aplica quando o novo registro inclui role 'principal' e não está soft-deleted
  IF 'principal' = ANY(NEW.roles) AND NEW.deleted_at IS NULL THEN
    -- Remove 'principal' dos outros responsáveis ativos deste cliente
    UPDATE public.cliente_responsaveis
    SET roles = array_remove(roles, 'principal'),
        updated_at = NOW()
    WHERE cliente_id = NEW.cliente_id
      AND id <> NEW.id
      AND deleted_at IS NULL
      AND 'principal' = ANY(roles);
  END IF;
  RETURN NEW;
END;
$$;

-- Remover trigger anterior se existir
DROP TRIGGER IF EXISTS trg_enforce_single_principal ON public.cliente_responsaveis;

-- Criar trigger AFTER INSERT OR UPDATE
CREATE TRIGGER trg_enforce_single_principal
  AFTER INSERT OR UPDATE OF roles, deleted_at
  ON public.cliente_responsaveis
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_single_principal();

NOTIFY pgrst, 'reload schema';
