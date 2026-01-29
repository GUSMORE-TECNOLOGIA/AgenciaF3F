-- Permitir que qualquer usuário autenticado delete cliente sem responsável.
-- Admin ou responsável continuam podendo deletar nos demais casos.

CREATE OR REPLACE FUNCTION soft_delete_cliente(cliente_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_is_admin BOOLEAN;
  v_can_delete BOOLEAN := false;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM usuarios u
    WHERE u.id = v_user_id AND u.role = 'admin'
  ) INTO v_is_admin;

  SELECT EXISTS (
    SELECT 1 FROM clientes c
    WHERE c.id = soft_delete_cliente.cliente_id
      AND c.deleted_at IS NULL
      AND (
        v_is_admin
        OR (c.responsavel_id IS NOT NULL AND c.responsavel_id = v_user_id)
        OR (c.responsavel_id IS NULL)
      )
  ) INTO v_can_delete;

  IF NOT v_can_delete THEN
    RAISE EXCEPTION 'Permissão negada para deletar este cliente';
  END IF;

  UPDATE cliente_links       SET deleted_at = NOW() WHERE cliente_id = soft_delete_cliente.cliente_id AND deleted_at IS NULL;
  UPDATE cliente_responsaveis SET deleted_at = NOW() WHERE cliente_id = soft_delete_cliente.cliente_id AND deleted_at IS NULL;
  UPDATE cliente_planos      SET deleted_at = NOW() WHERE cliente_id = soft_delete_cliente.cliente_id AND deleted_at IS NULL;
  UPDATE cliente_servicos    SET deleted_at = NOW() WHERE cliente_id = soft_delete_cliente.cliente_id AND deleted_at IS NULL;
  UPDATE transacoes          SET deleted_at = NOW() WHERE cliente_id = soft_delete_cliente.cliente_id AND deleted_at IS NULL;
  UPDATE ocorrencias         SET deleted_at = NOW() WHERE cliente_id = soft_delete_cliente.cliente_id AND deleted_at IS NULL;
  UPDATE atendimentos        SET deleted_at = NOW() WHERE cliente_id = soft_delete_cliente.cliente_id AND deleted_at IS NULL;

  UPDATE clientes SET deleted_at = NOW() WHERE id = soft_delete_cliente.cliente_id;
END;
$$;

GRANT EXECUTE ON FUNCTION soft_delete_cliente(UUID) TO authenticated;

COMMENT ON FUNCTION soft_delete_cliente(UUID) IS 'Soft delete de cliente e relacionados. Admin ou responsável. Clientes sem responsável: qualquer usuário autenticado.';

NOTIFY pgrst, 'reload schema';
