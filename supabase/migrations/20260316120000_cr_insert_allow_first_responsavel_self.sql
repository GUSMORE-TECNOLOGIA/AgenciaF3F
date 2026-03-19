-- Permitir que usuário autenticado se adicione como primeiro responsável do cliente.
-- Quem pode inserir: Administrador (role=admin ou perfil com slug=admin via is_admin()),
-- responsável já vinculado ao cliente, ou qualquer usuário se adicionando como primeiro vínculo.
DROP POLICY IF EXISTS "cr_insert" ON public.cliente_responsaveis;

CREATE POLICY "cr_insert" ON public.cliente_responsaveis
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      -- Administrador (role ou perfil Administrador) pode inserir em qualquer cliente
      public.is_admin()
      -- Responsável já vinculado ao cliente pode adicionar outros (consulta direta, sem recursão)
      OR EXISTS (
        SELECT 1 FROM public.cliente_responsaveis cr2
        WHERE cr2.cliente_id = cliente_responsaveis.cliente_id
          AND cr2.responsavel_id = auth.uid()
          AND cr2.deleted_at IS NULL
      )
      -- Primeiro responsável: cliente sem vínculos ativos; usuário pode se adicionar
      OR (
        NOT EXISTS (
          SELECT 1 FROM public.cliente_responsaveis cr2
          WHERE cr2.cliente_id = cliente_responsaveis.cliente_id
            AND cr2.deleted_at IS NULL
        )
        AND cliente_responsaveis.responsavel_id = auth.uid()
      )
    )
  );

NOTIFY pgrst, 'reload schema';
