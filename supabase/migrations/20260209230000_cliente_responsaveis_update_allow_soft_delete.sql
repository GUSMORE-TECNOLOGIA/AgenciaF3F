-- RLS cliente_responsaveis: UPDATE sem WITH CHECK em deleted_at permitia selecionar a linha
-- mas o WITH CHECK implícito (igual ao USING) exigia deleted_at IS NULL na nova linha,
-- então soft-delete (UPDATE SET deleted_at = NOW()) falhava com "new row violates row-level security policy".
-- Solução: WITH CHECK explícito que só exige permissão (responsável do cliente ou admin), sem deleted_at IS NULL.

DROP POLICY IF EXISTS "cliente_responsaveis_update" ON public.cliente_responsaveis;
CREATE POLICY "cliente_responsaveis_update" ON public.cliente_responsaveis
  FOR UPDATE
  USING (
    (
      EXISTS (
        SELECT 1 FROM public.clientes
        WHERE clientes.id = cliente_responsaveis.cliente_id
          AND clientes.responsavel_id = auth.uid()
          AND clientes.deleted_at IS NULL
      )
      OR is_admin()
    )
    AND cliente_responsaveis.deleted_at IS NULL
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clientes
      WHERE clientes.id = cliente_responsaveis.cliente_id
        AND clientes.responsavel_id = auth.uid()
        AND clientes.deleted_at IS NULL
    )
    OR is_admin()
  );

COMMENT ON POLICY "cliente_responsaveis_update" ON public.cliente_responsaveis IS
  'USING: só pode atualizar linhas não deletadas e visíveis. WITH CHECK: após o update só exige permissão (responsável ou admin), permitindo soft-delete (deleted_at preenchido).';
