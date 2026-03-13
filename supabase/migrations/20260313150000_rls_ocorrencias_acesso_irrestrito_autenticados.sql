-- Todos os usuários autenticados devem ter acesso irrestrito para:
-- 1) Ver grupos e tipos (dropdowns em Nova Ocorrência)
-- 2) Criar ocorrências (vincular grupo e tipo)
--
-- Antes: apenas responsavel_id = auth.uid() ou admin via grupos/tipos/ocorrencias,
-- então Ryan (e outros não-admin sem responsavel_id) não via grupos nem conseguia criar.

-- =============================================================================
-- OCORRENCIA_GRUPOS: SELECT para todos autenticados (listar no dropdown)
-- =============================================================================
DROP POLICY IF EXISTS "ocorrencia_grupos_select" ON public.ocorrencia_grupos;
CREATE POLICY "ocorrencia_grupos_select" ON public.ocorrencia_grupos
  FOR SELECT TO authenticated
  USING (is_active = true);

-- INSERT/UPDATE continuam restritos (quem cria/edita grupos: responsável ou admin)
-- já definidos em 20260313120000.

-- =============================================================================
-- OCORRENCIA_TIPOS: SELECT para todos autenticados (listar no dropdown)
-- =============================================================================
DROP POLICY IF EXISTS "ocorrencia_tipos_select" ON public.ocorrencia_tipos;
CREATE POLICY "ocorrencia_tipos_select" ON public.ocorrencia_tipos
  FOR SELECT TO authenticated
  USING (is_active = true);

-- =============================================================================
-- OCORRENCIAS: INSERT para todos autenticados (criar ocorrência, vincular grupo/tipo)
-- =============================================================================
DROP POLICY IF EXISTS "ocorrencias_insert" ON public.ocorrencias;
CREATE POLICY "ocorrencias_insert" ON public.ocorrencias
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- SELECT e UPDATE continuam respeitando visibilidade (vis_global + pode_visualizar_cliente
-- ou políticas existentes); apenas INSERT fica irrestrito para autenticados.

COMMENT ON POLICY "ocorrencia_grupos_select" ON public.ocorrencia_grupos IS
  'Todos autenticados podem listar grupos ativos (dropdown Nova Ocorrência).';
COMMENT ON POLICY "ocorrencia_tipos_select" ON public.ocorrencia_tipos IS
  'Todos autenticados podem listar tipos ativos (dropdown Nova Ocorrência).';
COMMENT ON POLICY "ocorrencias_insert" ON public.ocorrencias IS
  'Todos autenticados podem criar ocorrências (acesso irrestrito).';
