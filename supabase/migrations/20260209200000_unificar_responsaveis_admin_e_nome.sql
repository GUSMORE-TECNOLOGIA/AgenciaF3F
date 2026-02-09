-- Unificar: dashboard e RLS de cliente_responsaveis usam is_admin() e nome completo.
-- Resolve: gráfico do dashboard com nomes errados; filtro "Todos os responsáveis" com "Administrador";
--          impossibilidade de vincular responsável (admin por perfil não passava na RLS).

-- 1) get_responsaveis_para_dashboard: usar is_admin() (perfil admin) e nome_completo (equipe).
CREATE OR REPLACE FUNCTION get_responsaveis_para_dashboard()
RETURNS TABLE(id UUID, name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
  v_admin BOOLEAN;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RETURN;
  END IF;

  SELECT is_admin() INTO v_admin;

  RETURN QUERY
  SELECT DISTINCT u.id,
    COALESCE(
      (SELECT em.nome_completo FROM equipe_membros em WHERE em.user_id = u.id AND em.deleted_at IS NULL LIMIT 1),
      u.name
    )::TEXT AS name
  FROM usuarios u
  WHERE (
    EXISTS (
      SELECT 1 FROM clientes c
      WHERE c.responsavel_id = u.id
        AND c.deleted_at IS NULL
        AND (c.responsavel_id = current_user_id OR v_admin)
    )
    OR EXISTS (
      SELECT 1 FROM cliente_responsaveis cr
      JOIN clientes c ON c.id = cr.cliente_id AND c.deleted_at IS NULL
      WHERE cr.responsavel_id = u.id AND cr.deleted_at IS NULL
        AND (c.responsavel_id = current_user_id OR v_admin)
    )
  );
END;
$$;

COMMENT ON FUNCTION get_responsaveis_para_dashboard() IS 'Responsáveis visíveis no dashboard; nome = equipe_membros.nome_completo ou usuarios.name; usa is_admin() para perfil Administrador.';

-- 2) RLS cliente_responsaveis: usar is_admin() para que admin por perfil possa inserir/ver/atualizar.
DROP POLICY IF EXISTS "cliente_responsaveis_select" ON public.cliente_responsaveis;
CREATE POLICY "cliente_responsaveis_select" ON public.cliente_responsaveis
  FOR SELECT USING (
    (
      EXISTS (
        SELECT 1 FROM public.clientes
        WHERE clientes.id = cliente_responsaveis.cliente_id
          AND clientes.responsavel_id = auth.uid()
          AND clientes.deleted_at IS NULL
      )
      OR is_admin()
    )
    AND cliente_responsaveis.deleted_at IS NULL
  );

DROP POLICY IF EXISTS "cliente_responsaveis_insert" ON public.cliente_responsaveis;
CREATE POLICY "cliente_responsaveis_insert" ON public.cliente_responsaveis
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clientes
      WHERE clientes.id = cliente_responsaveis.cliente_id
        AND clientes.responsavel_id = auth.uid()
        AND clientes.deleted_at IS NULL
    )
    OR is_admin()
  );

DROP POLICY IF EXISTS "cliente_responsaveis_update" ON public.cliente_responsaveis;
CREATE POLICY "cliente_responsaveis_update" ON public.cliente_responsaveis
  FOR UPDATE USING (
    (
      EXISTS (
        SELECT 1 FROM public.clientes
        WHERE clientes.id = cliente_responsaveis.cliente_id
          AND clientes.responsavel_id = auth.uid()
          AND clientes.deleted_at IS NULL
      )
      OR is_admin()
    )
    AND cliente_responsaveis.deleted_at IS NULL
  );
