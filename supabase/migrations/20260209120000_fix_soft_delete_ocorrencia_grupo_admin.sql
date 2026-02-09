-- Fix: permitir que admin exclua qualquer grupo de ocorrência (incl. responsavel_id NULL).
-- Usuário não-admin só pode excluir se for o responsável do grupo.

CREATE OR REPLACE FUNCTION soft_delete_ocorrencia_grupo(grupo_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
  is_admin BOOLEAN;
  row_exists BOOLEAN;
BEGIN
  current_user_id := auth.uid();

  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM usuarios
    WHERE id = current_user_id AND role = 'admin'
  ) INTO is_admin;

  -- Admin pode desativar qualquer grupo (desde que exista e esteja ativo)
  IF is_admin THEN
    UPDATE ocorrencia_grupos
    SET is_active = false, updated_at = NOW()
    WHERE id = grupo_id AND is_active = true;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Grupo não encontrado ou já inativo';
    END IF;
    RETURN;
  END IF;

  -- Não-admin: só pode desativar se for o responsável do grupo
  SELECT EXISTS (
    SELECT 1 FROM ocorrencia_grupos
    WHERE id = grupo_id AND responsavel_id = current_user_id AND is_active = true
  ) INTO row_exists;

  IF NOT row_exists THEN
    RAISE EXCEPTION 'Permissão negada para deletar este grupo de ocorrência';
  END IF;

  UPDATE ocorrencia_grupos
  SET is_active = false, updated_at = NOW()
  WHERE id = grupo_id;
END;
$$;

COMMENT ON FUNCTION soft_delete_ocorrencia_grupo(UUID) IS 'Soft-delete (is_active=false) de grupo de ocorrência. Admin pode excluir qualquer grupo; demais usuários apenas o que têm responsavel_id = auth.uid().';
