-- Padronizar políticas RLS para usar is_admin() em vez de subquery inline (usuarios.role = 'admin').
-- Alinha cadastros mestres e perfis ao critério único: role admin OU perfil slug=admin.
-- Ref: plano-acao-rls-sistema.md, matriz-rls-quem-pode.md, auditoria-seguranca-performance.md (seção 5).

-- =============================================================================
-- PLANOS
-- =============================================================================
DROP POLICY IF EXISTS "Apenas admins podem criar planos" ON planos;
CREATE POLICY "Apenas admins podem criar planos"
  ON planos FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Apenas admins podem atualizar planos" ON planos;
CREATE POLICY "Apenas admins podem atualizar planos"
  ON planos FOR UPDATE
  USING (public.is_admin());

DROP POLICY IF EXISTS "Apenas admins podem deletar planos" ON planos;
CREATE POLICY "Apenas admins podem deletar planos"
  ON planos FOR DELETE
  USING (public.is_admin());

-- =============================================================================
-- SERVIÇOS
-- =============================================================================
DROP POLICY IF EXISTS "Apenas admins podem criar serviços" ON servicos;
CREATE POLICY "Apenas admins podem criar serviços"
  ON servicos FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Apenas admins podem atualizar serviços" ON servicos;
CREATE POLICY "Apenas admins podem atualizar serviços"
  ON servicos FOR UPDATE
  USING (public.is_admin());

DROP POLICY IF EXISTS "Apenas admins podem deletar serviços" ON servicos;
CREATE POLICY "Apenas admins podem deletar serviços"
  ON servicos FOR DELETE
  USING (public.is_admin());

-- =============================================================================
-- PLANO_SERVICOS (relação N:N)
-- =============================================================================
DROP POLICY IF EXISTS "Apenas admins podem gerenciar relações plano-serviços" ON plano_servicos;
CREATE POLICY "Apenas admins podem gerenciar relações plano-serviços"
  ON plano_servicos FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =============================================================================
-- PERFIS
-- =============================================================================
DROP POLICY IF EXISTS "Admin pode inserir perfis" ON perfis;
CREATE POLICY "Admin pode inserir perfis"
  ON perfis FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin pode atualizar perfis" ON perfis;
CREATE POLICY "Admin pode atualizar perfis"
  ON perfis FOR UPDATE TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admin pode excluir perfis" ON perfis;
CREATE POLICY "Admin pode excluir perfis"
  ON perfis FOR DELETE TO authenticated
  USING (public.is_admin());

-- =============================================================================
-- PERFIL_PERMISSOES
-- =============================================================================
DROP POLICY IF EXISTS "Admin pode inserir perfil_permissoes" ON perfil_permissoes;
CREATE POLICY "Admin pode inserir perfil_permissoes"
  ON perfil_permissoes FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin pode atualizar perfil_permissoes" ON perfil_permissoes;
CREATE POLICY "Admin pode atualizar perfil_permissoes"
  ON perfil_permissoes FOR UPDATE TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admin pode excluir perfil_permissoes" ON perfil_permissoes;
CREATE POLICY "Admin pode excluir perfil_permissoes"
  ON perfil_permissoes FOR DELETE TO authenticated
  USING (public.is_admin());

-- =============================================================================
-- USUARIOS (Admin pode atualizar qualquer usuario)
-- =============================================================================
-- Já usa is_admin() em 20260206130000_fix_usuarios_rls_recursion.sql; manter.
-- "Admin pode ver todos usuarios" e "Admin pode atualizar qualquer usuario" já usam is_admin().

-- =============================================================================
-- OCORRENCIA_GRUPOS, OCORRENCIA_TIPOS, OCORRENCIAS
-- =============================================================================
-- Apenas substituir "EXISTS (SELECT 1 FROM usuarios u WHERE u.id = auth.uid() AND u.role = 'admin')" por public.is_admin().
DROP POLICY IF EXISTS "ocorrencia_grupos_select" ON public.ocorrencia_grupos;
CREATE POLICY "ocorrencia_grupos_select" ON public.ocorrencia_grupos
  FOR SELECT USING (
    (responsavel_id = auth.uid() AND is_active = true)
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "ocorrencia_grupos_insert" ON public.ocorrencia_grupos;
CREATE POLICY "ocorrencia_grupos_insert" ON public.ocorrencia_grupos
  FOR INSERT WITH CHECK (
    responsavel_id = auth.uid()
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "ocorrencia_grupos_update" ON public.ocorrencia_grupos;
CREATE POLICY "ocorrencia_grupos_update" ON public.ocorrencia_grupos
  FOR UPDATE USING (
    responsavel_id = auth.uid()
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "ocorrencia_tipos_select" ON public.ocorrencia_tipos;
CREATE POLICY "ocorrencia_tipos_select" ON public.ocorrencia_tipos
  FOR SELECT USING (
    (responsavel_id = auth.uid() AND is_active = true)
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "ocorrencia_tipos_insert" ON public.ocorrencia_tipos;
CREATE POLICY "ocorrencia_tipos_insert" ON public.ocorrencia_tipos
  FOR INSERT WITH CHECK (
    responsavel_id = auth.uid()
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "ocorrencia_tipos_update" ON public.ocorrencia_tipos;
CREATE POLICY "ocorrencia_tipos_update" ON public.ocorrencia_tipos
  FOR UPDATE USING (
    responsavel_id = auth.uid()
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "ocorrencias_select" ON public.ocorrencias;
CREATE POLICY "ocorrencias_select" ON public.ocorrencias
  FOR SELECT USING (
    (
      EXISTS (
        SELECT 1 FROM public.clientes
        WHERE clientes.id = ocorrencias.cliente_id
          AND clientes.responsavel_id = auth.uid()
          AND clientes.deleted_at IS NULL
      )
      OR public.is_admin()
    )
    AND ocorrencias.deleted_at IS NULL
  );

DROP POLICY IF EXISTS "ocorrencias_insert" ON public.ocorrencias;
CREATE POLICY "ocorrencias_insert" ON public.ocorrencias
  FOR INSERT WITH CHECK (
    (
      EXISTS (
        SELECT 1 FROM public.clientes
        WHERE clientes.id = ocorrencias.cliente_id
          AND clientes.responsavel_id = auth.uid()
          AND clientes.deleted_at IS NULL
      )
      OR public.is_admin()
    )
    AND (
      ocorrencias.responsavel_id = auth.uid()
      OR public.is_admin()
    )
  );

DROP POLICY IF EXISTS "ocorrencias_update" ON public.ocorrencias;
CREATE POLICY "ocorrencias_update" ON public.ocorrencias
  FOR UPDATE USING (
    (
      EXISTS (
        SELECT 1 FROM public.clientes
        WHERE clientes.id = ocorrencias.cliente_id
          AND clientes.responsavel_id = auth.uid()
          AND clientes.deleted_at IS NULL
      )
      OR public.is_admin()
    )
    AND (
      ocorrencias.responsavel_id = auth.uid()
      OR public.is_admin()
    )
    AND ocorrencias.deleted_at IS NULL
  );
