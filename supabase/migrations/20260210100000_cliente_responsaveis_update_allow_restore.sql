-- Permitir UPDATE em cliente_responsaveis também para linhas soft-deleted (deleted_at IS NOT NULL),
-- para que seja possível "restaurar" um vínculo (set deleted_at = null) em vez de falhar no INSERT por unique.

DROP POLICY IF EXISTS "cliente_responsaveis_update" ON public.cliente_responsaveis;
CREATE POLICY "cliente_responsaveis_update" ON public.cliente_responsaveis
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.clientes
      WHERE clientes.id = cliente_responsaveis.cliente_id
        AND clientes.responsavel_id = auth.uid()
        AND clientes.deleted_at IS NULL
    )
    OR is_admin()
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
  'USING: responsável do cliente ou admin (sem exigir deleted_at IS NULL, para permitir restaurar vínculo). WITH CHECK: idem.';
