-- Permitir criar/editar/excluir planos e serviços para quem tem permissão "editar" no módulo
-- (perfil_permissoes.pode_editar), alinhando RLS ao frontend (pode('planos'|'servicos','editar')).
-- Resolve 403 ao criar plano com perfil Administrador quando is_admin() falhava por dados de usuario/perfil.

CREATE OR REPLACE FUNCTION public.user_pode_editar_modulo(p_modulo text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM usuarios u
    JOIN perfil_permissoes pp ON pp.perfil_id = u.perfil_id AND pp.modulo = p_modulo
    WHERE u.id = auth.uid() AND pp.pode_editar = true
  );
$$;

COMMENT ON FUNCTION public.user_pode_editar_modulo(text) IS
  'True se o perfil do usuário atual tem pode_editar no módulo; usado em RLS para planos e serviços.';

-- =============================================================================
-- PLANOS
-- =============================================================================
DROP POLICY IF EXISTS "Apenas admins podem criar planos" ON planos;
CREATE POLICY "Apenas admins podem criar planos"
  ON planos FOR INSERT
  WITH CHECK (public.is_admin() OR public.user_pode_editar_modulo('planos'));

DROP POLICY IF EXISTS "Apenas admins podem atualizar planos" ON planos;
CREATE POLICY "Apenas admins podem atualizar planos"
  ON planos FOR UPDATE
  USING (public.is_admin() OR public.user_pode_editar_modulo('planos'));

DROP POLICY IF EXISTS "Apenas admins podem deletar planos" ON planos;
CREATE POLICY "Apenas admins podem deletar planos"
  ON planos FOR DELETE
  USING (public.is_admin() OR public.user_pode_editar_modulo('planos'));

-- =============================================================================
-- SERVIÇOS
-- =============================================================================
DROP POLICY IF EXISTS "Apenas admins podem criar serviços" ON servicos;
CREATE POLICY "Apenas admins podem criar serviços"
  ON servicos FOR INSERT
  WITH CHECK (public.is_admin() OR public.user_pode_editar_modulo('servicos'));

DROP POLICY IF EXISTS "Apenas admins podem atualizar serviços" ON servicos;
CREATE POLICY "Apenas admins podem atualizar serviços"
  ON servicos FOR UPDATE
  USING (public.is_admin() OR public.user_pode_editar_modulo('servicos'));

DROP POLICY IF EXISTS "Apenas admins podem deletar serviços" ON servicos;
CREATE POLICY "Apenas admins podem deletar serviços"
  ON servicos FOR DELETE
  USING (public.is_admin() OR public.user_pode_editar_modulo('servicos'));

-- =============================================================================
-- PLANO_SERVICOS (relação N:N)
-- =============================================================================
DROP POLICY IF EXISTS "Apenas admins podem gerenciar relações plano-serviços" ON plano_servicos;
CREATE POLICY "Apenas admins podem gerenciar relações plano-serviços"
  ON plano_servicos FOR ALL
  USING (public.is_admin() OR public.user_pode_editar_modulo('planos'))
  WITH CHECK (public.is_admin() OR public.user_pode_editar_modulo('planos'));
