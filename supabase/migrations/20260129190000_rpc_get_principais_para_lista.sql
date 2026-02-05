-- RPC: principais por cliente (cliente_responsaveis com role 'principal').
-- Usado na lista de clientes para exibir responsável. Respeita visibilidade (responsavel_id ou admin).

CREATE OR REPLACE FUNCTION get_principais_para_lista()
RETURNS TABLE(cliente_id UUID, responsavel_id UUID, responsavel_name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID;
  v_admin BOOLEAN;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN RETURN; END IF;

  SELECT EXISTS (SELECT 1 FROM usuarios u WHERE u.id = v_uid AND u.role = 'admin') INTO v_admin;

  RETURN QUERY
  SELECT DISTINCT ON (c.id) c.id AS cliente_id, cr.responsavel_id, u.name::TEXT AS responsavel_name
  FROM clientes c
  JOIN cliente_responsaveis cr ON cr.cliente_id = c.id AND cr.deleted_at IS NULL
    AND 'principal' = ANY(cr.roles)
  JOIN usuarios u ON u.id = cr.responsavel_id
  WHERE c.deleted_at IS NULL
    AND (c.responsavel_id = v_uid OR v_admin)
  ORDER BY c.id, cr.created_at;
END;
$$;

GRANT EXECUTE ON FUNCTION get_principais_para_lista() TO authenticated;

COMMENT ON FUNCTION get_principais_para_lista() IS 'Principais (cliente_responsaveis) por cliente visível; para lista de clientes.';

NOTIFY pgrst, 'reload schema';
