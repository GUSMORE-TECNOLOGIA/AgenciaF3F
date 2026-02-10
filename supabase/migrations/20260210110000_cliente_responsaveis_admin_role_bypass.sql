-- Garantir que usuários com role = 'admin' em public.usuarios tenham acesso total
-- a cliente_responsaveis (SELECT, INSERT, UPDATE), independente de is_admin().
-- Útil quando o usuário admin (ex.: adm@agenciaf3f) deve ter acesso total.

-- SELECT: admin vê todos os vínculos (incl. soft-deleted para consistência com UPDATE)
CREATE POLICY "cliente_responsaveis_admin_select"
  ON public.cliente_responsaveis FOR SELECT
  USING (
    (SELECT role FROM public.usuarios WHERE id = auth.uid()) = 'admin'
  );

-- INSERT: admin pode criar qualquer vínculo
CREATE POLICY "cliente_responsaveis_admin_insert"
  ON public.cliente_responsaveis FOR INSERT
  WITH CHECK (
    (SELECT role FROM public.usuarios WHERE id = auth.uid()) = 'admin'
  );

-- UPDATE: admin pode atualizar qualquer linha (incl. soft-delete e restauração)
CREATE POLICY "cliente_responsaveis_admin_update"
  ON public.cliente_responsaveis FOR UPDATE
  USING (
    (SELECT role FROM public.usuarios WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM public.usuarios WHERE id = auth.uid()) = 'admin'
  );
