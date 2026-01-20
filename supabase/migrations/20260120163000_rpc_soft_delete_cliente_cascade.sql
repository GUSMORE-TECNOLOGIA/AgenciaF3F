-- Atualizar função RPC para soft delete de cliente com CASCADE
-- Faz soft delete de todos os dados relacionados ao cliente

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
  
  -- Fazer soft delete CASCADE de todos os dados relacionados
  
  -- 1. Links do cliente
  UPDATE cliente_links
  SET deleted_at = NOW()
  WHERE cliente_id = cliente_id
  AND deleted_at IS NULL;
  
  -- 2. Responsáveis do cliente
  UPDATE cliente_responsaveis
  SET deleted_at = NOW()
  WHERE cliente_id = cliente_id
  AND deleted_at IS NULL;
  
  -- 3. Contratos de planos do cliente
  UPDATE cliente_planos
  SET deleted_at = NOW()
  WHERE cliente_id = cliente_id
  AND deleted_at IS NULL;
  
  -- 4. Contratos de serviços do cliente
  UPDATE cliente_servicos
  SET deleted_at = NOW()
  WHERE cliente_id = cliente_id
  AND deleted_at IS NULL;
  
  -- 5. Transações financeiras do cliente
  UPDATE transacoes
  SET deleted_at = NOW()
  WHERE cliente_id = cliente_id
  AND deleted_at IS NULL;
  
  -- 6. Ocorrências do cliente
  UPDATE ocorrencias
  SET deleted_at = NOW()
  WHERE cliente_id = cliente_id
  AND deleted_at IS NULL;
  
  -- 7. Atendimentos do cliente
  UPDATE atendimentos
  SET deleted_at = NOW()
  WHERE cliente_id = cliente_id
  AND deleted_at IS NULL;
  
  -- 8. Por último, fazer soft delete do cliente
  UPDATE clientes
  SET deleted_at = NOW()
  WHERE id = cliente_id;
END;
$$;

-- Comentário explicativo atualizado
COMMENT ON FUNCTION soft_delete_cliente(UUID) IS 'Faz soft delete de um cliente e todos os seus dados relacionados (links, responsáveis, contratos, transações, ocorrências, atendimentos), verificando permissões antes de executar';

NOTIFY pgrst, 'reload schema';
