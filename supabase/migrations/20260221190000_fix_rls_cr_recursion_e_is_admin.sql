-- Correção: recursão infinita na policy cr_insert de cliente_responsaveis
-- O erro "infinite recursion detected in policy for relation cliente_responsaveis"
-- ocorria porque cr_insert consultava a própria tabela via EXISTS, disparando cr_select.

-- Função SECURITY DEFINER para verificar responsável ativo sem passar pela RLS
CREATE OR REPLACE FUNCTION public.is_responsavel_ativo(p_cliente_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.cliente_responsaveis cr
    WHERE cr.cliente_id = p_cliente_id
      AND cr.responsavel_id = p_user_id
      AND cr.deleted_at IS NULL
  );
$$;

-- cr_insert: sem recursão — usa funções SECURITY DEFINER
DROP POLICY IF EXISTS cr_insert ON public.cliente_responsaveis;

CREATE POLICY cr_insert ON public.cliente_responsaveis
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      is_admin()
      OR is_responsavel_ativo(cliente_responsaveis.cliente_id, auth.uid())
    )
  );

-- cr_select: usar is_admin() em vez de subquery inline
DROP POLICY IF EXISTS cr_select ON public.cliente_responsaveis;

CREATE POLICY cr_select ON public.cliente_responsaveis
  FOR SELECT
  USING (
    is_admin()
    OR is_responsavel_do_cliente(cliente_id)
  );

-- cr_update: usar is_admin() em vez de subquery inline
DROP POLICY IF EXISTS cr_update ON public.cliente_responsaveis;

CREATE POLICY cr_update ON public.cliente_responsaveis
  FOR UPDATE
  USING (
    is_admin()
    OR is_responsavel_do_cliente(cliente_id)
  )
  WITH CHECK (
    is_admin()
    OR is_responsavel_do_cliente(cliente_id)
  );

-- cr_delete: usar is_admin() em vez de subquery inline
DROP POLICY IF EXISTS cr_delete ON public.cliente_responsaveis;

CREATE POLICY cr_delete ON public.cliente_responsaveis
  FOR DELETE
  USING (
    is_admin()
  );
