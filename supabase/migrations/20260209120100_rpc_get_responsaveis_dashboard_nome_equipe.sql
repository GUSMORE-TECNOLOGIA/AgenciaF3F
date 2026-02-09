-- BUG-07: Retornar nome a partir de equipe_membros.nome_completo quando existir vínculo,
-- senão fallback para usuarios.name (dashboard exibe nome "oficial" da equipe).

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
  SELECT DISTINCT u.id,
    COALESCE(
      (SELECT em.nome_completo FROM equipe_membros em WHERE em.user_id = u.id AND em.deleted_at IS NULL LIMIT 1),
      u.name
    ) AS name
  FROM usuarios u
  WHERE EXISTS (
    SELECT 1 FROM clientes c
    WHERE c.responsavel_id = u.id
      AND c.deleted_at IS NULL
      AND (c.responsavel_id = current_user_id OR is_admin)
  );
END;
$$;

COMMENT ON FUNCTION get_responsaveis_para_dashboard() IS 'Lista id e name de responsáveis visíveis (dashboard). Nome vem de equipe_membros.nome_completo quando houver vínculo, senão usuarios.name.';
