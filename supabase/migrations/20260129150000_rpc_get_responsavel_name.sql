-- RPC para obter o nome do responsável (usuário) por ID.
-- Usa SECURITY DEFINER para contornar RLS em usuarios (só pode ver próprio perfil).
-- Retorna o nome apenas se o usuário atual puder ver algum cliente com esse responsavel_id.

CREATE OR REPLACE FUNCTION get_responsavel_name(p_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
  is_admin BOOLEAN;
  out_name TEXT;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM usuarios u WHERE u.id = current_user_id AND u.role = 'admin'
  ) INTO is_admin;

  -- Só retornar nome se o usuário pode ver algum cliente com esse responsavel
  IF NOT EXISTS (
    SELECT 1 FROM clientes c
    WHERE c.responsavel_id = p_id
      AND c.deleted_at IS NULL
      AND (c.responsavel_id = current_user_id OR is_admin)
  ) THEN
    RETURN NULL;
  END IF;

  SELECT u.name INTO out_name FROM usuarios u WHERE u.id = p_id;
  RETURN out_name;
END;
$$;

COMMENT ON FUNCTION get_responsavel_name(UUID) IS 'Retorna o name do usuario (responsavel) por ID; só se o chamador puder ver algum cliente com esse responsavel.';

NOTIFY pgrst, 'reload schema';
