-- Adicionar função RPC para soft delete de cliente_links
-- Esta função foi adicionada posteriormente à migration principal de RPC

CREATE OR REPLACE FUNCTION soft_delete_cliente_link(link_id UUID)
RETURNS void
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
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;
  
  SELECT EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = current_user_id AND role = 'admin'
  ) INTO is_admin;
  
  IF NOT EXISTS (
    SELECT 1 FROM cliente_links cl
    JOIN clientes c ON cl.cliente_id = c.id
    WHERE cl.id = link_id 
    AND (
      c.responsavel_id = current_user_id 
      OR is_admin = true
    )
    AND cl.deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Permissão negada para deletar este link';
  END IF;
  
  UPDATE cliente_links
  SET deleted_at = NOW()
  WHERE id = link_id;
END;
$$;

GRANT EXECUTE ON FUNCTION soft_delete_cliente_link(UUID) TO authenticated;

COMMENT ON FUNCTION soft_delete_cliente_link(UUID) IS 'Faz soft delete de um link do cliente, verificando permissões antes de executar';
