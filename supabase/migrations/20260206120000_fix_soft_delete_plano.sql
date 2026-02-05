-- Corrige soft_delete_plano: parâmetro plano_id sombreava a coluna no WHERE
-- (plano_id = plano_id era sempre true), fazendo o loop processar TODOS os contratos.
-- Qualificando com nome da função: soft_delete_plano.plano_id = parâmetro.
-- Também evita erro de cast em metadata->>'contrato_id' quando o valor não é UUID válido.

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
    SELECT 1 FROM planos p
    WHERE p.id = soft_delete_plano.plano_id AND p.deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Plano não encontrado ou já deletado';
  END IF;

  now_iso := NOW();

  -- Cancelar transações em aberto vinculadas a contratos DESTE plano
  FOR contrato_record IN
    SELECT cp.id FROM cliente_planos cp
    WHERE cp.plano_id = soft_delete_plano.plano_id AND cp.deleted_at IS NULL
  LOOP
    -- Cancelar transações do contrato (apenas onde contrato_id é UUID válido)
    UPDATE transacoes
    SET status = 'cancelado', deleted_at = now_iso
    WHERE metadata->>'contrato_tipo' = 'plano'
      AND status IN ('pendente', 'vencido')
      AND deleted_at IS NULL
      AND metadata->>'contrato_id' IS NOT NULL
      AND metadata->>'contrato_id' ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
      AND (metadata->>'contrato_id')::UUID = contrato_record.id;

    -- Cancelar o contrato
    UPDATE cliente_planos cp
    SET status = 'cancelado', deleted_at = now_iso, updated_at = now_iso
    WHERE cp.id = contrato_record.id AND cp.deleted_at IS NULL;
  END LOOP;

  -- Cancelar transações legadas (sem contrato_id)
  UPDATE transacoes
  SET status = 'cancelado', deleted_at = now_iso
  WHERE metadata->>'plano_id' = soft_delete_plano.plano_id::TEXT
    AND metadata->>'origem' = 'contrato_plano'
    AND status IN ('pendente', 'vencido')
    AND deleted_at IS NULL;

  -- Remover vínculos N:N
  DELETE FROM plano_servicos ps WHERE ps.plano_id = soft_delete_plano.plano_id;

  -- Soft delete do plano
  UPDATE planos p
  SET deleted_at = now_iso, updated_at = now_iso
  WHERE p.id = soft_delete_plano.plano_id;
END;
$$;

GRANT EXECUTE ON FUNCTION soft_delete_plano(UUID) TO authenticated;

COMMENT ON FUNCTION soft_delete_plano(UUID) IS 'Soft delete de plano: cancela contratos e transações deste plano; parâmetro qualificado como soft_delete_plano.plano_id.';
