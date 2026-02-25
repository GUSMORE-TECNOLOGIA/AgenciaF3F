-- Simplificar cr_insert: remover a condição NOT EXISTS que bloqueava admins ao adicionar
-- segundo responsável (o service agora controla INSERT vs UPDATE explicitamente)
DROP POLICY IF EXISTS "cr_insert" ON public.cliente_responsaveis;

CREATE POLICY "cr_insert" ON public.cliente_responsaveis
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      -- Admin sempre pode inserir
      (SELECT role FROM public.usuarios WHERE id = auth.uid()) = 'admin'
      -- Responsável já vinculado ao cliente pode adicionar outros
      OR public.is_responsavel_do_cliente(cliente_id)
    )
  );

NOTIFY pgrst, 'reload schema';
