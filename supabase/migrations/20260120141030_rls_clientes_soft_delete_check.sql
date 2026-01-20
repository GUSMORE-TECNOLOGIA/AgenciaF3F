-- Reforcar policy de UPDATE de clientes para permitir soft delete

DROP POLICY IF EXISTS "clientes_update_responsavel" ON public.clientes;
CREATE POLICY "clientes_update_responsavel" ON public.clientes
  FOR UPDATE
  USING (
    (responsavel_id = auth.uid() OR EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.role = 'admin'))
    AND deleted_at IS NULL
  )
  WITH CHECK (
    responsavel_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

NOTIFY pgrst, 'reload schema';
