-- RPC para listar responsáveis visíveis ao usuário (id + name).
-- Usado no dashboard para "Clientes por responsável" e métricas financeiras por responsável.
-- Retorna apenas usuarios que são responsavel_id de algum cliente que o usuário pode ver.

CREATE OR REPLACE FUNCTION get_responsaveis_para_dashboard()
RETURNS TABLE(id UUID, name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
  is_admin BOOLEAN;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM usuarios u WHERE u.id = current_user_id AND u.role = 'admin'
  ) INTO is_admin;

  RETURN QUERY
  SELECT DISTINCT u.id, u.name
  FROM usuarios u
  WHERE EXISTS (
    SELECT 1 FROM clientes c
    WHERE c.responsavel_id = u.id
      AND c.deleted_at IS NULL
      AND (c.responsavel_id = current_user_id OR is_admin)
  );
END;
$$;

COMMENT ON FUNCTION get_responsaveis_para_dashboard() IS 'Lista id e name de usuarios que são responsavel de algum cliente visível ao usuário (dashboard).';

NOTIFY pgrst, 'reload schema';
