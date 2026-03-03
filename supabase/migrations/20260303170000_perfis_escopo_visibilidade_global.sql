-- Regra global de visibilidade por perfil:
-- - todos
-- - nenhum
-- - responsavel
--
-- Em modo "responsavel", registros sem responsável não são visíveis para não-admin.

ALTER TABLE public.perfis
  ADD COLUMN IF NOT EXISTS escopo_visibilidade text NOT NULL DEFAULT 'todos';

ALTER TABLE public.perfis
  DROP CONSTRAINT IF EXISTS perfis_escopo_visibilidade_check;

ALTER TABLE public.perfis
  ADD CONSTRAINT perfis_escopo_visibilidade_check
  CHECK (escopo_visibilidade IN ('todos', 'nenhum', 'responsavel'));

UPDATE public.perfis
SET escopo_visibilidade = 'todos'
WHERE escopo_visibilidade IS NULL;

CREATE OR REPLACE FUNCTION public.get_escopo_visibilidade_usuario()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    CASE
      WHEN u.role = 'admin' OR p.slug = 'admin' THEN 'todos'
      ELSE COALESCE(p.escopo_visibilidade, 'todos')
    END
  FROM public.usuarios u
  LEFT JOIN public.perfis p ON p.id = u.perfil_id
  WHERE u.id = auth.uid()
  LIMIT 1
$$;

COMMENT ON FUNCTION public.get_escopo_visibilidade_usuario() IS
  'Retorna escopo global de visibilidade do usuário autenticado (todos|nenhum|responsavel). Admin sempre retorna todos.';

CREATE OR REPLACE FUNCTION public.pode_visualizar_cliente(p_cliente_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH scope AS (
    SELECT COALESCE(public.get_escopo_visibilidade_usuario(), 'nenhum') AS s
  )
  SELECT
    CASE
      WHEN auth.uid() IS NULL THEN false
      WHEN (SELECT s FROM scope) = 'todos' THEN true
      WHEN (SELECT s FROM scope) = 'nenhum' THEN false
      WHEN (SELECT s FROM scope) = 'responsavel' THEN (
        EXISTS (
          SELECT 1
          FROM public.cliente_responsaveis cr
          WHERE cr.cliente_id = p_cliente_id
            AND cr.responsavel_id = auth.uid()
            AND cr.deleted_at IS NULL
        )
        OR COALESCE(
          (
            SELECT c.responsavel_id = auth.uid()
            FROM public.clientes c
            WHERE c.id = p_cliente_id
              AND c.deleted_at IS NULL
            LIMIT 1
          ),
          false
        )
      )
      ELSE false
    END
$$;

COMMENT ON FUNCTION public.pode_visualizar_cliente(uuid) IS
  'Regra global de visibilidade por perfil para dados vinculados ao cliente.';

CREATE OR REPLACE FUNCTION public.is_responsavel_do_cliente(p_cliente_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.pode_visualizar_cliente(p_cliente_id)
$$;

COMMENT ON FUNCTION public.is_responsavel_do_cliente(uuid) IS
  'Compatibilidade legada: delega para pode_visualizar_cliente com escopo global por perfil.';

-- SELECT em tabelas de domínio do cliente passa a respeitar a regra global de visibilidade.
DROP POLICY IF EXISTS vis_global_select_clientes ON public.clientes;
CREATE POLICY vis_global_select_clientes ON public.clientes
  FOR SELECT
  USING (public.pode_visualizar_cliente(id) AND deleted_at IS NULL);

DROP POLICY IF EXISTS vis_global_select_cliente_responsaveis ON public.cliente_responsaveis;
CREATE POLICY vis_global_select_cliente_responsaveis ON public.cliente_responsaveis
  FOR SELECT
  USING (public.pode_visualizar_cliente(cliente_id) AND deleted_at IS NULL);

DROP POLICY IF EXISTS vis_global_select_transacoes ON public.transacoes;
CREATE POLICY vis_global_select_transacoes ON public.transacoes
  FOR SELECT
  USING (public.pode_visualizar_cliente(cliente_id) AND deleted_at IS NULL);

DROP POLICY IF EXISTS vis_global_select_cliente_planos ON public.cliente_planos;
CREATE POLICY vis_global_select_cliente_planos ON public.cliente_planos
  FOR SELECT
  USING (public.pode_visualizar_cliente(cliente_id) AND deleted_at IS NULL);

DROP POLICY IF EXISTS vis_global_select_cliente_servicos ON public.cliente_servicos;
CREATE POLICY vis_global_select_cliente_servicos ON public.cliente_servicos
  FOR SELECT
  USING (public.pode_visualizar_cliente(cliente_id) AND deleted_at IS NULL);

DROP POLICY IF EXISTS vis_global_select_cliente_contratos ON public.cliente_contratos;
CREATE POLICY vis_global_select_cliente_contratos ON public.cliente_contratos
  FOR SELECT
  USING (public.pode_visualizar_cliente(cliente_id) AND deleted_at IS NULL);

DROP POLICY IF EXISTS vis_global_select_ocorrencias ON public.ocorrencias;
CREATE POLICY vis_global_select_ocorrencias ON public.ocorrencias
  FOR SELECT
  USING (public.pode_visualizar_cliente(cliente_id) AND deleted_at IS NULL);

DROP POLICY IF EXISTS vis_global_select_atendimentos ON public.atendimentos;
CREATE POLICY vis_global_select_atendimentos ON public.atendimentos
  FOR SELECT
  USING (public.pode_visualizar_cliente(cliente_id) AND deleted_at IS NULL);

DROP POLICY IF EXISTS vis_global_select_servicos_prestados ON public.servicos_prestados;
CREATE POLICY vis_global_select_servicos_prestados ON public.servicos_prestados
  FOR SELECT
  USING (public.pode_visualizar_cliente(cliente_id) AND deleted_at IS NULL);

NOTIFY pgrst, 'reload schema';
