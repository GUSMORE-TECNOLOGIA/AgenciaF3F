-- Corrige exclusão (soft delete) de contrato e de plano.
-- 1) cliente_contratos: política UPDATE exigia deleted_at IS NULL no WITH CHECK implícito,
--    então ao setar deleted_at = now() o novo row falhava na política. Explícito WITH CHECK
--    apenas com permissão (responsável ou admin) permite soft delete.
-- 2) soft_delete_cliente_plano: usava usuarios.role = 'admin', ignorando admin por perfil.
--    Passar a usar public.is_admin() para alinhar ao restante do RLS.

-- 1) Política UPDATE em cliente_contratos: WITH CHECK sem deleted_at IS NULL
DROP POLICY IF EXISTS "cliente_contratos_update" ON public.cliente_contratos;
CREATE POLICY "cliente_contratos_update"
  ON public.cliente_contratos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.clientes c
      WHERE c.id = cliente_contratos.cliente_id
        AND c.deleted_at IS NULL
        AND (c.responsavel_id = auth.uid() OR public.is_admin())
    )
    AND cliente_contratos.deleted_at IS NULL
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clientes c
      WHERE c.id = cliente_contratos.cliente_id
        AND c.deleted_at IS NULL
        AND (c.responsavel_id = auth.uid() OR public.is_admin())
    )
  );

COMMENT ON POLICY "cliente_contratos_update" ON public.cliente_contratos IS
  'USING: só pode atualizar linhas não deletadas e com permissão. WITH CHECK: após o update exige apenas permissão, permitindo soft-delete (deleted_at preenchido).';

-- 2) RPC soft_delete_cliente_plano: usar public.is_admin() em vez de usuarios.role
CREATE OR REPLACE FUNCTION soft_delete_cliente_plano(contrato_id UUID)
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

  -- Cancelar títulos em aberto desse contrato
  UPDATE transacoes
  SET status = 'cancelado', deleted_at = now_iso
  WHERE (metadata->>'contrato_id')::UUID = soft_delete_cliente_plano.contrato_id
    AND metadata->>'contrato_tipo' = 'plano'
    AND status IN ('pendente', 'vencido')
    AND deleted_at IS NULL;

  -- Soft delete do contrato de plano
  UPDATE cliente_planos
  SET status = 'cancelado', deleted_at = now_iso
  WHERE id = soft_delete_cliente_plano.contrato_id;
END;
$$;

COMMENT ON FUNCTION soft_delete_cliente_plano(UUID) IS 'Soft delete de contrato de plano; permissão por responsável do cliente ou is_admin().';

-- 3) RPC soft_delete_cliente_servico: usar public.is_admin() em vez de usuarios.role
CREATE OR REPLACE FUNCTION soft_delete_cliente_servico(contrato_id UUID)
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

  UPDATE transacoes
  SET status = 'cancelado', deleted_at = now_iso
  WHERE (metadata->>'contrato_id')::UUID = soft_delete_cliente_servico.contrato_id
    AND metadata->>'contrato_tipo' = 'servico'
    AND status IN ('pendente', 'vencido')
    AND deleted_at IS NULL;

  UPDATE cliente_servicos
  SET status = 'cancelado', deleted_at = now_iso
  WHERE id = soft_delete_cliente_servico.contrato_id;
END;
$$;

COMMENT ON FUNCTION soft_delete_cliente_servico(UUID) IS 'Soft delete de contrato de serviço; permissão por responsável do cliente ou is_admin().';
