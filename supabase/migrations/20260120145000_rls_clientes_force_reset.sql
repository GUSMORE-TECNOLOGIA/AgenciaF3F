-- Forçar recriação completa de todas as policies de clientes para garantir soft delete
-- Esta migration remove TODAS as policies existentes antes de recriar

-- Remover todas as policies de clientes (caso existam outras além das conhecidas)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'clientes' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.clientes', r.policyname);
  END LOOP;
END $$;

-- Recriar policies corretas
CREATE POLICY "clientes_select_responsavel" ON public.clientes
  FOR SELECT USING (
    (responsavel_id = auth.uid() OR EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.role = 'admin'))
    AND deleted_at IS NULL
  );

CREATE POLICY "clientes_insert_responsavel" ON public.clientes
  FOR INSERT WITH CHECK (
    responsavel_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

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

-- Forçar reload do schema PostgREST
NOTIFY pgrst, 'reload schema';

-- Também forçar reload via função (se disponível)
DO $$
BEGIN
  PERFORM pg_notify('pgrst', 'reload schema');
END $$;
