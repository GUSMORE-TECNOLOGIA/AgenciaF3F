-- Criar função RPC para soft delete de cliente
-- Esta função usa SECURITY DEFINER para contornar RLS policies

CREATE OR REPLACE FUNCTION soft_delete_cliente(cliente_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
  is_admin BOOLEAN;
BEGIN
  -- Obter ID do usuário atual
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;
  
  -- Verificar se é admin
  SELECT EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = current_user_id AND role = 'admin'
  ) INTO is_admin;
  
  -- Verificar se pode deletar (é responsável ou admin)
  IF NOT EXISTS (
    SELECT 1 FROM clientes 
    WHERE id = cliente_id 
    AND (
      responsavel_id = current_user_id 
      OR is_admin = true
    )
    AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Permissão negada para deletar este cliente';
  END IF;
  
  -- Fazer soft delete
  UPDATE clientes
  SET deleted_at = NOW()
  WHERE id = cliente_id;
END;
$$;

-- Garantir que a função é executável por usuários autenticados
GRANT EXECUTE ON FUNCTION soft_delete_cliente(UUID) TO authenticated;

-- Comentário explicativo
COMMENT ON FUNCTION soft_delete_cliente(UUID) IS 'Faz soft delete de um cliente, verificando permissões antes de executar';
