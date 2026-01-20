-- Policy explícita para permitir soft delete de clientes
-- Esta migration cria uma policy específica que permite atualizar deleted_at

-- Remover todas as policies de clientes primeiro
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

-- Policy para SELECT: apenas registros não deletados
CREATE POLICY "clientes_select_responsavel" ON public.clientes
  FOR SELECT USING (
    (responsavel_id = auth.uid() OR EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.role = 'admin'))
    AND deleted_at IS NULL
  );

-- Policy para INSERT: responsável ou admin
CREATE POLICY "clientes_insert_responsavel" ON public.clientes
  FOR INSERT WITH CHECK (
    responsavel_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- Policy para UPDATE: permite atualizar registros não deletados
-- IMPORTANTE: WITH CHECK não verifica deleted_at, permitindo soft delete
CREATE POLICY "clientes_update_responsavel" ON public.clientes
  FOR UPDATE
  USING (
    -- Pode atualizar se for responsável ou admin E o registro não está deletado
    (responsavel_id = auth.uid() OR EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.role = 'admin'))
    AND deleted_at IS NULL
  )
  WITH CHECK (
    -- Após o update, apenas verifica se é responsável ou admin
    -- NÃO verifica deleted_at, permitindo que seja atualizado
    responsavel_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- Forçar reload do schema
NOTIFY pgrst, 'reload schema';
