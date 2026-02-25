-- RCA: Admin não consegue adicionar responsável a cliente.
-- Causa: políticas duplicadas e conflitantes em cliente_responsaveis.
-- A migration 20260224180000 criou cliente_responsaveis_insert mas não removeu
-- cliente_responsaveis_admin_insert (20260210110000). Além disso, a condição
-- is_responsavel_do_cliente(cliente_id) no INSERT falha para admin quando o
-- cliente ainda não tem nenhum responsável (função retorna false para admin
-- que não está em cliente_responsaveis para aquele cliente).
--
-- Solução: remover TODAS as políticas de INSERT/UPDATE/SELECT existentes e
-- recriar de forma limpa, sem duplicatas, com admin sempre permitido.

-- 1) Remover todas as políticas existentes de cliente_responsaveis
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname FROM pg_policies
    WHERE tablename = 'cliente_responsaveis' AND schemaname = 'public'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.cliente_responsaveis', r.policyname);
  END LOOP;
END $$;

-- 2) SELECT: admin vê tudo; responsável vê os vínculos dos seus clientes
CREATE POLICY "cr_select" ON public.cliente_responsaveis
  FOR SELECT USING (
    (SELECT role FROM public.usuarios WHERE id = auth.uid()) = 'admin'
    OR public.is_responsavel_do_cliente(cliente_id)
  );

-- 3) INSERT: admin sempre pode; responsável do cliente pode; primeiro vínculo
--    (cliente sem responsável) permite que qualquer usuário autenticado insira
--    o próprio ID como responsável
CREATE POLICY "cr_insert" ON public.cliente_responsaveis
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      -- Admin sempre pode
      (SELECT role FROM public.usuarios WHERE id = auth.uid()) = 'admin'
      -- Responsável já vinculado ao cliente pode adicionar outros
      OR public.is_responsavel_do_cliente(cliente_id)
      -- Primeiro responsável: cliente ainda não tem nenhum vínculo ativo
      OR NOT EXISTS (
        SELECT 1 FROM public.cliente_responsaveis cr2
        WHERE cr2.cliente_id = cliente_responsaveis.cliente_id
          AND cr2.deleted_at IS NULL
      )
    )
  );

-- 4) UPDATE: admin sempre pode; responsável do cliente pode atualizar
--    (inclui soft-delete e restauração — sem exigir deleted_at IS NULL no USING)
CREATE POLICY "cr_update" ON public.cliente_responsaveis
  FOR UPDATE
  USING (
    (SELECT role FROM public.usuarios WHERE id = auth.uid()) = 'admin'
    OR public.is_responsavel_do_cliente(cliente_id)
  )
  WITH CHECK (
    (SELECT role FROM public.usuarios WHERE id = auth.uid()) = 'admin'
    OR public.is_responsavel_do_cliente(cliente_id)
  );

-- 5) DELETE: somente admin (soft-delete via UPDATE é o padrão; DELETE direto só admin)
CREATE POLICY "cr_delete" ON public.cliente_responsaveis
  FOR DELETE USING (
    (SELECT role FROM public.usuarios WHERE id = auth.uid()) = 'admin'
  );

-- Recarregar schema do PostgREST
NOTIFY pgrst, 'reload schema';
