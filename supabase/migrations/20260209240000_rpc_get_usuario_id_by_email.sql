-- Lookup de usuario por email para vincular equipe_membros (user_id null).
-- RPC com SECURITY DEFINER contorna RLS em usuarios; só retorna id se is_admin().
-- Em produção, SELECT direto em usuarios pode ser bloqueado por RLS para o token do cliente.

CREATE OR REPLACE FUNCTION get_usuario_id_by_email(p_email TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;
  IF NOT is_admin() THEN
    RETURN NULL;
  END IF;
  SELECT id INTO v_id
  FROM usuarios
  WHERE email ILIKE NULLIF(trim(p_email), '')
  LIMIT 1;
  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION get_usuario_id_by_email(TEXT) TO authenticated;
COMMENT ON FUNCTION get_usuario_id_by_email(TEXT) IS 'Retorna id do usuario pelo email; só para admin (is_admin); usado ao vincular membro da equipe.';
