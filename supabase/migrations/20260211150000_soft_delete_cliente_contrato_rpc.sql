-- Soft delete do contrato (cliente_contratos) via RPC com SECURITY DEFINER para evitar bloqueio por RLS.
-- cascata: se true, exclui antes planos e serviços vinculados (e cancela lançamentos).

CREATE OR REPLACE FUNCTION soft_delete_cliente_contrato(contrato_id UUID, cascata boolean DEFAULT false)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
  rec RECORD;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM cliente_contratos cc
    JOIN clientes c ON c.id = cc.cliente_id
    WHERE cc.id = soft_delete_cliente_contrato.contrato_id
      AND cc.deleted_at IS NULL
      AND c.deleted_at IS NULL
      AND (c.responsavel_id = current_user_id OR public.is_admin())
  ) THEN
    RAISE EXCEPTION 'Permissão negada para excluir este contrato';
  END IF;

  IF cascata THEN
    FOR rec IN
      SELECT id FROM cliente_planos
      WHERE contrato_id = soft_delete_cliente_contrato.contrato_id AND deleted_at IS NULL
    LOOP
      PERFORM soft_delete_cliente_plano(rec.id, true);
    END LOOP;
    FOR rec IN
      SELECT id FROM cliente_servicos
      WHERE contrato_id = soft_delete_cliente_contrato.contrato_id AND deleted_at IS NULL
    LOOP
      PERFORM soft_delete_cliente_servico(rec.id, true);
    END LOOP;
  END IF;

  UPDATE cliente_contratos
  SET deleted_at = NOW()
  WHERE id = soft_delete_cliente_contrato.contrato_id AND deleted_at IS NULL;
END;
$$;

COMMENT ON FUNCTION soft_delete_cliente_contrato(UUID, boolean) IS 'Soft delete de contrato do cliente. cascata=true exclui planos/serviços vinculados e cancela lançamentos.';
