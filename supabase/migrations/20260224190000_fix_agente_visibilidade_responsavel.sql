-- Corrige visibilidade do agente: após 20260224180000, apenas cliente_responsaveis era considerado.
-- Clientes que tinham apenas clientes.responsavel_id preenchido deixaram de ser visíveis para o agente.
-- 1) Fallback em is_responsavel_do_cliente: considerar também clientes.responsavel_id = auth.uid()
-- 2) Backfill: inserir em cliente_responsaveis (principal) onde clientes.responsavel_id está preenchido e ainda não existe vínculo.

-- 1) is_responsavel_do_cliente: incluir fallback para clientes.responsavel_id (compatibilidade até backfill/dados migrados)
CREATE OR REPLACE FUNCTION public.is_responsavel_do_cliente(p_cliente_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    public.is_admin(),
    EXISTS (
      SELECT 1 FROM public.cliente_responsaveis cr
      WHERE cr.cliente_id = p_cliente_id
        AND cr.responsavel_id = auth.uid()
        AND cr.deleted_at IS NULL
    ),
    COALESCE(
      (SELECT (c.responsavel_id = auth.uid())
       FROM public.clientes c
       WHERE c.id = p_cliente_id AND c.deleted_at IS NULL
       LIMIT 1),
      false
    )
  );
$$;

COMMENT ON FUNCTION public.is_responsavel_do_cliente(uuid) IS 'True se o usuário atual é admin, está em cliente_responsaveis para o cliente, ou é o responsavel_id legado em clientes (fallback até migração completa).';

-- 2) Backfill: cliente_responsaveis a partir de clientes.responsavel_id (apenas onde ainda não existe principal)
-- Respeita validate_single_principal_per_cliente: só insere se o cliente ainda não tem nenhum responsável com role principal.
INSERT INTO public.cliente_responsaveis (cliente_id, responsavel_id, roles, observacao, deleted_at, created_at, updated_at)
SELECT
  c.id,
  c.responsavel_id,
  ARRAY['principal']::text[],
  NULL,
  NULL,
  NOW(),
  NOW()
FROM public.clientes c
WHERE c.responsavel_id IS NOT NULL
  AND c.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.cliente_responsaveis cr
    WHERE cr.cliente_id = c.id
      AND cr.deleted_at IS NULL
      AND 'principal' = ANY(cr.roles)
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.cliente_responsaveis cr
    WHERE cr.cliente_id = c.id
      AND cr.responsavel_id = c.responsavel_id
      AND cr.deleted_at IS NULL
  )
ON CONFLICT (cliente_id, responsavel_id) DO UPDATE SET
  deleted_at = NULL,
  roles = ARRAY['principal']::text[],
  updated_at = NOW();

NOTIFY pgrst, 'reload schema';
