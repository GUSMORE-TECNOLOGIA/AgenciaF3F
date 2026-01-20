-- Criar funções RPC para soft delete de todos os módulos
-- Estas funções usam SECURITY DEFINER para contornar RLS policies

-- ============================================================================
-- OCORRÊNCIAS
-- ============================================================================

CREATE OR REPLACE FUNCTION soft_delete_ocorrencia(ocorrencia_id UUID)
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
    SELECT 1 FROM ocorrencias 
    WHERE id = ocorrencia_id 
    AND (
      responsavel_id = current_user_id 
      OR is_admin = true
    )
    AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Permissão negada para deletar esta ocorrência';
  END IF;
  
  UPDATE ocorrencias
  SET deleted_at = NOW()
  WHERE id = ocorrencia_id;
END;
$$;

GRANT EXECUTE ON FUNCTION soft_delete_ocorrencia(UUID) TO authenticated;

-- ============================================================================
-- GRUPOS DE OCORRÊNCIAS (usa is_active ao invés de deleted_at)
-- ============================================================================

CREATE OR REPLACE FUNCTION soft_delete_ocorrencia_grupo(grupo_id UUID)
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
    SELECT 1 FROM ocorrencia_grupos 
    WHERE id = grupo_id 
    AND (
      responsavel_id = current_user_id 
      OR is_admin = true
    )
    AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Permissão negada para deletar este grupo de ocorrência';
  END IF;
  
  UPDATE ocorrencia_grupos
  SET is_active = false, updated_at = NOW()
  WHERE id = grupo_id;
END;
$$;

GRANT EXECUTE ON FUNCTION soft_delete_ocorrencia_grupo(UUID) TO authenticated;

-- ============================================================================
-- TIPOS DE OCORRÊNCIAS (usa is_active ao invés de deleted_at)
-- ============================================================================

CREATE OR REPLACE FUNCTION soft_delete_ocorrencia_tipo(tipo_id UUID)
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
    SELECT 1 FROM ocorrencia_tipos ot
    JOIN ocorrencia_grupos og ON ot.grupo_id = og.id
    WHERE ot.id = tipo_id 
    AND (
      og.responsavel_id = current_user_id 
      OR is_admin = true
    )
    AND ot.is_active = true
  ) THEN
    RAISE EXCEPTION 'Permissão negada para deletar este tipo de ocorrência';
  END IF;
  
  UPDATE ocorrencia_tipos
  SET is_active = false, updated_at = NOW()
  WHERE id = tipo_id;
END;
$$;

GRANT EXECUTE ON FUNCTION soft_delete_ocorrencia_tipo(UUID) TO authenticated;

-- ============================================================================
-- EQUIPE MEMBROS
-- ============================================================================

CREATE OR REPLACE FUNCTION soft_delete_equipe_membro(membro_id UUID)
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
  
  IF NOT is_admin THEN
    RAISE EXCEPTION 'Apenas administradores podem deletar membros da equipe';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM equipe_membros 
    WHERE id = membro_id 
    AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Membro da equipe não encontrado ou já deletado';
  END IF;
  
  UPDATE equipe_membros
  SET deleted_at = NOW()
  WHERE id = membro_id;
END;
$$;

GRANT EXECUTE ON FUNCTION soft_delete_equipe_membro(UUID) TO authenticated;

-- ============================================================================
-- SERVIÇOS
-- ============================================================================

CREATE OR REPLACE FUNCTION soft_delete_servico(servico_id UUID)
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
  
  IF NOT is_admin THEN
    RAISE EXCEPTION 'Apenas administradores podem deletar serviços';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM servicos 
    WHERE id = servico_id 
    AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Serviço não encontrado ou já deletado';
  END IF;
  
  UPDATE servicos
  SET deleted_at = NOW()
  WHERE id = servico_id;
END;
$$;

GRANT EXECUTE ON FUNCTION soft_delete_servico(UUID) TO authenticated;

-- ============================================================================
-- PLANOS (complexo - cancela contratos e transações relacionadas)
-- ============================================================================

CREATE OR REPLACE FUNCTION soft_delete_plano(plano_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
  is_admin BOOLEAN;
  now_iso TIMESTAMPTZ;
  contrato_record RECORD;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;
  
  SELECT EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = current_user_id AND role = 'admin'
  ) INTO is_admin;
  
  IF NOT is_admin THEN
    RAISE EXCEPTION 'Apenas administradores podem deletar planos';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM planos 
    WHERE id = plano_id 
    AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Plano não encontrado ou já deletado';
  END IF;
  
  now_iso := NOW();
  
  -- Cancelar transações em aberto vinculadas a contratos desse plano
  FOR contrato_record IN 
    SELECT id FROM cliente_planos 
    WHERE plano_id = plano_id AND deleted_at IS NULL
  LOOP
    -- Cancelar transações do contrato
    UPDATE transacoes
    SET status = 'cancelado', deleted_at = now_iso
    WHERE (metadata->>'contrato_id')::UUID = contrato_record.id
      AND metadata->>'contrato_tipo' = 'plano'
      AND status IN ('pendente', 'vencido')
      AND deleted_at IS NULL;
    
    -- Cancelar o contrato
    UPDATE cliente_planos
    SET status = 'cancelado', deleted_at = now_iso
    WHERE id = contrato_record.id
      AND deleted_at IS NULL;
  END LOOP;
  
  -- Cancelar transações legadas (sem contrato_id)
  UPDATE transacoes
  SET status = 'cancelado', deleted_at = now_iso
  WHERE metadata->>'plano_id' = plano_id::TEXT
    AND metadata->>'origem' = 'contrato_plano'
    AND status IN ('pendente', 'vencido')
    AND deleted_at IS NULL;
  
  -- Remover vínculos N:N
  DELETE FROM plano_servicos WHERE plano_id = plano_id;
  
  -- Soft delete do plano
  UPDATE planos
  SET deleted_at = now_iso
  WHERE id = plano_id;
END;
$$;

GRANT EXECUTE ON FUNCTION soft_delete_plano(UUID) TO authenticated;

-- ============================================================================
-- CLIENTE PLANOS (contratos de plano)
-- ============================================================================

CREATE OR REPLACE FUNCTION soft_delete_cliente_plano(contrato_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
  is_admin BOOLEAN;
  now_iso TIMESTAMPTZ;
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
    SELECT 1 FROM cliente_planos cp
    JOIN clientes c ON cp.cliente_id = c.id
    WHERE cp.id = contrato_id 
    AND (
      c.responsavel_id = current_user_id 
      OR is_admin = true
    )
    AND cp.deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Permissão negada para deletar este contrato de plano';
  END IF;
  
  now_iso := NOW();
  
  -- Cancelar títulos em aberto desse contrato
  UPDATE transacoes
  SET status = 'cancelado', deleted_at = now_iso
  WHERE (metadata->>'contrato_id')::UUID = contrato_id
    AND metadata->>'contrato_tipo' = 'plano'
    AND status IN ('pendente', 'vencido')
    AND deleted_at IS NULL;
  
  -- Soft delete do contrato
  UPDATE cliente_planos
  SET status = 'cancelado', deleted_at = now_iso
  WHERE id = contrato_id;
END;
$$;

GRANT EXECUTE ON FUNCTION soft_delete_cliente_plano(UUID) TO authenticated;

-- ============================================================================
-- CLIENTE SERVIÇOS (contratos de serviço)
-- ============================================================================

CREATE OR REPLACE FUNCTION soft_delete_cliente_servico(contrato_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
  is_admin BOOLEAN;
  now_iso TIMESTAMPTZ;
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
    SELECT 1 FROM cliente_servicos cs
    JOIN clientes c ON cs.cliente_id = c.id
    WHERE cs.id = contrato_id 
    AND (
      c.responsavel_id = current_user_id 
      OR is_admin = true
    )
    AND cs.deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Permissão negada para deletar este contrato de serviço';
  END IF;
  
  now_iso := NOW();
  
  -- Cancelar títulos em aberto desse contrato
  UPDATE transacoes
  SET status = 'cancelado', deleted_at = now_iso
  WHERE (metadata->>'contrato_id')::UUID = contrato_id
    AND metadata->>'contrato_tipo' = 'servico'
    AND status IN ('pendente', 'vencido')
    AND deleted_at IS NULL;
  
  -- Soft delete do contrato
  UPDATE cliente_servicos
  SET status = 'cancelado', deleted_at = now_iso
  WHERE id = contrato_id;
END;
$$;

GRANT EXECUTE ON FUNCTION soft_delete_cliente_servico(UUID) TO authenticated;

-- ============================================================================
-- TRANSAÇÕES FINANCEIRAS
-- ============================================================================

CREATE OR REPLACE FUNCTION soft_delete_transacao(transacao_id UUID)
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
    SELECT 1 FROM transacoes t
    JOIN clientes c ON t.cliente_id = c.id
    WHERE t.id = transacao_id 
    AND (
      c.responsavel_id = current_user_id 
      OR is_admin = true
    )
    AND t.deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Permissão negada para deletar esta transação';
  END IF;
  
  UPDATE transacoes
  SET deleted_at = NOW()
  WHERE id = transacao_id;
END;
$$;

GRANT EXECUTE ON FUNCTION soft_delete_transacao(UUID) TO authenticated;

-- ============================================================================
-- ATENDIMENTOS
-- ============================================================================

CREATE OR REPLACE FUNCTION soft_delete_atendimento(atendimento_id UUID)
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
    SELECT 1 FROM atendimentos a
    JOIN clientes c ON a.cliente_id = c.id
    WHERE a.id = atendimento_id 
    AND (
      c.responsavel_id = current_user_id 
      OR is_admin = true
    )
    AND a.deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Permissão negada para deletar este atendimento';
  END IF;
  
  UPDATE atendimentos
  SET deleted_at = NOW()
  WHERE id = atendimento_id;
END;
$$;

GRANT EXECUTE ON FUNCTION soft_delete_atendimento(UUID) TO authenticated;

-- ============================================================================
-- CLIENTE LINKS
-- ============================================================================

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
