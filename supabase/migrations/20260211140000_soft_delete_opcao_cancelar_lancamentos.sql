-- Parâmetro opcional para escolher se cancela ou não os lançamentos financeiros ao excluir plano/serviço.
-- Cascata no frontend: ao excluir/cancelar contrato, o usuário pode optar por excluir em cascata (planos/serviços e lançamentos).

CREATE OR REPLACE FUNCTION soft_delete_cliente_plano(contrato_id UUID, cancelar_lancamentos boolean DEFAULT true)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
  now_iso TIMESTAMPTZ;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM cliente_planos cp
    JOIN clientes c ON cp.cliente_id = c.id
    WHERE cp.id = soft_delete_cliente_plano.contrato_id
      AND cp.deleted_at IS NULL
      AND (c.responsavel_id = current_user_id OR public.is_admin())
  ) THEN
    RAISE EXCEPTION 'Permissão negada para deletar este contrato de plano';
  END IF;
  now_iso := NOW();

  IF cancelar_lancamentos THEN
    UPDATE transacoes
    SET status = 'cancelado', deleted_at = now_iso
    WHERE (metadata->>'contrato_id')::UUID = soft_delete_cliente_plano.contrato_id
      AND metadata->>'contrato_tipo' = 'plano'
      AND status IN ('pendente', 'vencido')
      AND deleted_at IS NULL;
  END IF;

  UPDATE cliente_planos
  SET status = 'cancelado', deleted_at = now_iso
  WHERE id = soft_delete_cliente_plano.contrato_id;
END;
$$;

COMMENT ON FUNCTION soft_delete_cliente_plano(UUID, boolean) IS 'Soft delete de contrato de plano. Se cancelar_lancamentos=true, cancela transações em aberto.';

CREATE OR REPLACE FUNCTION soft_delete_cliente_servico(contrato_id UUID, cancelar_lancamentos boolean DEFAULT true)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
  now_iso TIMESTAMPTZ;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM cliente_servicos cs
    JOIN clientes c ON cs.cliente_id = c.id
    WHERE cs.id = soft_delete_cliente_servico.contrato_id
      AND cs.deleted_at IS NULL
      AND (c.responsavel_id = current_user_id OR public.is_admin())
  ) THEN
    RAISE EXCEPTION 'Permissão negada para deletar este contrato de serviço';
  END IF;
  now_iso := NOW();

  IF cancelar_lancamentos THEN
    UPDATE transacoes
    SET status = 'cancelado', deleted_at = now_iso
    WHERE (metadata->>'contrato_id')::UUID = soft_delete_cliente_servico.contrato_id
      AND metadata->>'contrato_tipo' = 'servico'
      AND status IN ('pendente', 'vencido')
      AND deleted_at IS NULL;
  END IF;

  UPDATE cliente_servicos
  SET status = 'cancelado', deleted_at = now_iso
  WHERE id = soft_delete_cliente_servico.contrato_id;
END;
$$;

COMMENT ON FUNCTION soft_delete_cliente_servico(UUID, boolean) IS 'Soft delete de contrato de serviço. Se cancelar_lancamentos=true, cancela transações em aberto.';
