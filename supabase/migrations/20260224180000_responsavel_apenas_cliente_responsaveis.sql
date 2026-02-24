-- Responsável do cliente: fonte única = cliente_responsaveis (aba Responsáveis).
-- Remove dependência de clientes.responsavel_id para visibilidade e filtros.
-- clientes.responsavel_id permanece na tabela (nullable, não usado); pode ser removido em migration futura.

-- 1) Helper: usuário é responsável do cliente (está em cliente_responsaveis) ou admin
CREATE OR REPLACE FUNCTION public.is_responsavel_do_cliente(p_cliente_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    public.is_admin(),
    EXISTS (
      SELECT 1 FROM public.cliente_responsaveis cr
      WHERE cr.cliente_id = p_cliente_id
        AND cr.responsavel_id = auth.uid()
        AND cr.deleted_at IS NULL
    )
  );
$$;

COMMENT ON FUNCTION public.is_responsavel_do_cliente(uuid) IS 'True se o usuário atual é admin ou está em cliente_responsaveis para o cliente (fonte única de responsável).';

-- 2) RLS clientes: usar is_responsavel_do_cliente
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'clientes' AND schemaname = 'public')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.clientes', r.policyname);
  END LOOP;
END $$;

CREATE POLICY "clientes_select_responsavel" ON public.clientes
  FOR SELECT USING (
    public.is_responsavel_do_cliente(id) AND deleted_at IS NULL
  );

CREATE POLICY "clientes_insert_responsavel" ON public.clientes
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "clientes_update_responsavel" ON public.clientes
  FOR UPDATE
  USING (public.is_responsavel_do_cliente(id) AND deleted_at IS NULL)
  WITH CHECK (public.is_responsavel_do_cliente(id));

-- 3) RLS cliente_responsaveis: quem pode ver/inserir/atualizar
DROP POLICY IF EXISTS "cliente_responsaveis_select" ON public.cliente_responsaveis;
DROP POLICY IF EXISTS "cliente_responsaveis_insert" ON public.cliente_responsaveis;
DROP POLICY IF EXISTS "cliente_responsaveis_update" ON public.cliente_responsaveis;

CREATE POLICY "cliente_responsaveis_select" ON public.cliente_responsaveis
  FOR SELECT USING (
    (public.is_responsavel_do_cliente(cliente_id) OR (SELECT role FROM public.usuarios WHERE id = auth.uid()) = 'admin')
    AND deleted_at IS NULL
  );

CREATE POLICY "cliente_responsaveis_insert" ON public.cliente_responsaveis
  FOR INSERT WITH CHECK (
    public.is_responsavel_do_cliente(cliente_id)
    OR (SELECT role FROM public.usuarios WHERE id = auth.uid()) = 'admin'
    OR (
      NOT EXISTS (SELECT 1 FROM public.cliente_responsaveis cr2 WHERE cr2.cliente_id = cliente_responsaveis.cliente_id AND cr2.deleted_at IS NULL)
      AND responsavel_id = auth.uid()
    )
  );

CREATE POLICY "cliente_responsaveis_update" ON public.cliente_responsaveis
  FOR UPDATE
  USING (
    (public.is_responsavel_do_cliente(cliente_id) OR (SELECT role FROM public.usuarios WHERE id = auth.uid()) = 'admin')
    AND deleted_at IS NULL
  )
  WITH CHECK (
    public.is_responsavel_do_cliente(cliente_id) OR (SELECT role FROM public.usuarios WHERE id = auth.uid()) = 'admin'
  );

-- 4) RLS cliente_contratos
DROP POLICY IF EXISTS "cliente_contratos_select" ON public.cliente_contratos;
DROP POLICY IF EXISTS "cliente_contratos_insert" ON public.cliente_contratos;
DROP POLICY IF EXISTS "cliente_contratos_update" ON public.cliente_contratos;

CREATE POLICY "cliente_contratos_select" ON public.cliente_contratos
  FOR SELECT USING (
    public.is_responsavel_do_cliente(cliente_id) AND deleted_at IS NULL
  );

CREATE POLICY "cliente_contratos_insert" ON public.cliente_contratos
  FOR INSERT WITH CHECK (public.is_responsavel_do_cliente(cliente_id));

CREATE POLICY "cliente_contratos_update" ON public.cliente_contratos
  FOR UPDATE
  USING (public.is_responsavel_do_cliente(cliente_id) AND deleted_at IS NULL)
  WITH CHECK (public.is_responsavel_do_cliente(cliente_id));

-- 5) get_responsaveis_para_dashboard: visibilidade por is_responsavel_do_cliente
CREATE OR REPLACE FUNCTION get_responsaveis_para_dashboard()
RETURNS TABLE(id uuid, name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;

  RETURN QUERY
  SELECT DISTINCT u.id,
    COALESCE(
      (SELECT em.nome_completo FROM equipe_membros em WHERE em.user_id = u.id AND em.deleted_at IS NULL LIMIT 1),
      u.name
    )::TEXT AS name
  FROM usuarios u
  WHERE EXISTS (
    SELECT 1 FROM cliente_responsaveis cr
    JOIN clientes c ON c.id = cr.cliente_id AND c.deleted_at IS NULL
    WHERE cr.responsavel_id = u.id AND cr.deleted_at IS NULL
      AND public.is_responsavel_do_cliente(c.id)
  );
END;
$$;

COMMENT ON FUNCTION get_responsaveis_para_dashboard() IS 'Responsáveis visíveis no dashboard; fonte única cliente_responsaveis; nome = equipe ou usuarios.name.';

-- 6) get_principais_para_lista: visibilidade por is_responsavel_do_cliente
CREATE OR REPLACE FUNCTION get_principais_para_lista()
RETURNS TABLE(cliente_id uuid, responsavel_id uuid, responsavel_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;

  RETURN QUERY
  SELECT DISTINCT ON (c.id)
    c.id AS cliente_id,
    cr.responsavel_id,
    COALESCE(
      (SELECT em.nome_completo FROM equipe_membros em WHERE em.user_id = u.id AND em.deleted_at IS NULL LIMIT 1),
      u.name
    )::TEXT AS responsavel_name
  FROM clientes c
  JOIN cliente_responsaveis cr ON cr.cliente_id = c.id AND cr.deleted_at IS NULL
    AND 'principal' = ANY(cr.roles)
  JOIN usuarios u ON u.id = cr.responsavel_id
  WHERE c.deleted_at IS NULL
    AND public.is_responsavel_do_cliente(c.id)
  ORDER BY c.id, cr.created_at;
END;
$$;

COMMENT ON FUNCTION get_principais_para_lista() IS 'Principais (cliente_responsaveis) por cliente visível; fonte única.';

-- 7) get_responsavel_name: visibilidade por is_responsavel_do_cliente
CREATE OR REPLACE FUNCTION get_responsavel_name(p_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  out_name text;
BEGIN
  IF auth.uid() IS NULL THEN RETURN NULL; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM cliente_responsaveis cr
    JOIN clientes c ON c.id = cr.cliente_id AND c.deleted_at IS NULL
    WHERE cr.responsavel_id = p_id AND cr.deleted_at IS NULL
      AND public.is_responsavel_do_cliente(c.id)
  ) THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(
    (SELECT em.nome_completo FROM equipe_membros em WHERE em.user_id = u.id AND em.deleted_at IS NULL LIMIT 1),
    u.name
  ) INTO out_name
  FROM usuarios u
  WHERE u.id = p_id;

  RETURN out_name;
END;
$$;

COMMENT ON FUNCTION get_responsavel_name(uuid) IS 'Nome do responsável (equipe ou usuarios.name); visibilidade por cliente_responsaveis.';

-- 8) list_clientes_filtrados: visibilidade e filtro responsavel_id via cliente_responsaveis; retorna principal como responsavel_id
CREATE OR REPLACE FUNCTION list_clientes_filtrados(
  p_conditions jsonb,
  p_limit int DEFAULT 50,
  p_offset int DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  nome text,
  email text,
  telefone text,
  responsavel_id uuid,
  status text,
  logo_url text,
  links_uteis jsonb,
  drive_url text,
  created_at timestamptz,
  updated_at timestamptz,
  total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
  v_admin boolean;
  v_conditions jsonb;
  v_idx int;
  v_cond jsonb;
  v_field text;
  v_op text;
  v_val text;
  v_logical text;
  v_frag text;
  v_where_clause text;
  v_sql text;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;
  SELECT public.is_admin() INTO v_admin;

  v_where_clause := 'c.deleted_at IS NULL AND public.is_responsavel_do_cliente(c.id)';

  v_conditions := COALESCE(p_conditions, '[]'::jsonb);
  FOR v_idx IN 0..(jsonb_array_length(v_conditions) - 1) LOOP
    v_cond := v_conditions->v_idx;
    v_field := v_cond->>'field';
    v_op := COALESCE(v_cond->>'operator', 'equals');
    v_val := NULLIF(TRIM(v_cond->>'value'), '');
    v_logical := COALESCE(v_cond->>'logicalOperator', 'AND');
    v_frag := NULL;

    CASE v_field
      WHEN 'search' THEN
        IF v_val IS NOT NULL AND v_val <> '' THEN
          v_frag := format('(c.nome ILIKE %L OR c.email ILIKE %L OR c.telefone ILIKE %L)', '%' || v_val || '%', '%' || v_val || '%', '%' || v_val || '%');
        END IF;
      WHEN 'nome' THEN
        CASE v_op
          WHEN 'contains' THEN v_frag := format('(c.nome ILIKE %L)', '%' || COALESCE(v_val,'') || '%');
          WHEN 'equals' THEN v_frag := format('(c.nome = %L)', v_val);
          WHEN 'not_equals' THEN v_frag := format('(c.nome IS DISTINCT FROM %L)', v_val);
          WHEN 'not_contains' THEN v_frag := format('(c.nome NOT ILIKE %L)', '%' || COALESCE(v_val,'') || '%');
          WHEN 'is_empty' THEN v_frag := '(c.nome IS NULL OR TRIM(COALESCE(c.nome,'''')) = '''')';
          WHEN 'is_not_empty' THEN v_frag := '(c.nome IS NOT NULL AND TRIM(c.nome) <> '''')';
          ELSE v_frag := format('(c.nome ILIKE %L)', '%' || COALESCE(v_val,'') || '%');
        END CASE;
      WHEN 'email' THEN
        CASE v_op
          WHEN 'contains' THEN v_frag := format('(c.email ILIKE %L)', '%' || COALESCE(v_val,'') || '%');
          WHEN 'equals' THEN v_frag := format('(c.email = %L)', v_val);
          WHEN 'not_equals' THEN v_frag := format('(c.email IS DISTINCT FROM %L)', v_val);
          WHEN 'is_empty' THEN v_frag := '(c.email IS NULL OR TRIM(COALESCE(c.email,'''')) = '''')';
          WHEN 'is_not_empty' THEN v_frag := '(c.email IS NOT NULL AND TRIM(c.email) <> '''')';
          ELSE v_frag := format('(c.email ILIKE %L)', '%' || COALESCE(v_val,'') || '%');
        END CASE;
      WHEN 'telefone' THEN
        CASE v_op
          WHEN 'contains' THEN v_frag := format('(c.telefone ILIKE %L)', '%' || COALESCE(v_val,'') || '%');
          WHEN 'equals' THEN v_frag := format('(c.telefone = %L)', v_val);
          WHEN 'not_equals' THEN v_frag := format('(c.telefone IS DISTINCT FROM %L)', v_val);
          WHEN 'is_empty' THEN v_frag := '(c.telefone IS NULL OR TRIM(COALESCE(c.telefone,'''')) = '''')';
          WHEN 'is_not_empty' THEN v_frag := '(c.telefone IS NOT NULL AND TRIM(c.telefone) <> '''')';
          ELSE v_frag := format('(c.telefone ILIKE %L)', '%' || COALESCE(v_val,'') || '%');
        END CASE;
      WHEN 'status' THEN
        IF v_val IS NOT NULL THEN
          CASE v_op
            WHEN 'equals' THEN v_frag := format('(c.status = %L)', v_val);
            WHEN 'not_equals' THEN v_frag := format('(c.status IS DISTINCT FROM %L)', v_val);
            ELSE v_frag := format('(c.status = %L)', v_val);
          END CASE;
        END IF;
      WHEN 'responsavel_id' THEN
        CASE v_op
          WHEN 'equals' THEN
            IF v_val IS NOT NULL THEN v_frag := format('(EXISTS (SELECT 1 FROM cliente_responsaveis cr WHERE cr.cliente_id = c.id AND cr.responsavel_id = %L::uuid AND cr.deleted_at IS NULL))', v_val); END IF;
          WHEN 'not_equals' THEN
            IF v_val IS NOT NULL THEN v_frag := format('(NOT EXISTS (SELECT 1 FROM cliente_responsaveis cr WHERE cr.cliente_id = c.id AND cr.responsavel_id = %L::uuid AND cr.deleted_at IS NULL))', v_val); END IF;
          WHEN 'is_empty' THEN v_frag := '(NOT EXISTS (SELECT 1 FROM cliente_responsaveis cr WHERE cr.cliente_id = c.id AND cr.deleted_at IS NULL))';
          WHEN 'is_not_empty' THEN v_frag := '(EXISTS (SELECT 1 FROM cliente_responsaveis cr WHERE cr.cliente_id = c.id AND cr.deleted_at IS NULL))';
          ELSE
            IF v_val IS NOT NULL THEN v_frag := format('(EXISTS (SELECT 1 FROM cliente_responsaveis cr WHERE cr.cliente_id = c.id AND cr.responsavel_id = %L::uuid AND cr.deleted_at IS NULL))', v_val); END IF;
        END CASE;
      WHEN 'tem_contrato' THEN
        IF (v_val = 'true' OR v_val = '1') THEN
          v_frag := 'EXISTS (SELECT 1 FROM cliente_contratos cc WHERE cc.cliente_id = c.id AND cc.deleted_at IS NULL)';
        ELSIF (v_val = 'false' OR v_val = '0') THEN
          v_frag := 'NOT EXISTS (SELECT 1 FROM cliente_contratos cc WHERE cc.cliente_id = c.id AND cc.deleted_at IS NULL)';
        END IF;
      WHEN 'contrato_assinado' THEN
        IF v_val IS NOT NULL AND v_val <> '' THEN
          IF v_op = 'contains' THEN
            v_frag := format('EXISTS (SELECT 1 FROM cliente_contratos cc WHERE cc.cliente_id = c.id AND cc.deleted_at IS NULL AND cc.contrato_assinado ILIKE %L)', '%' || v_val || '%');
          ELSE
            v_frag := format('EXISTS (SELECT 1 FROM cliente_contratos cc WHERE cc.cliente_id = c.id AND cc.deleted_at IS NULL AND cc.contrato_assinado = %L)', v_val);
          END IF;
        END IF;
      WHEN 'contrato_vencido' THEN
        IF (v_val = 'true' OR v_val = '1') THEN
          v_frag := 'EXISTS (SELECT 1 FROM cliente_contratos cc WHERE cc.cliente_id = c.id AND cc.deleted_at IS NULL AND cc.data_fim IS NOT NULL AND cc.data_fim <= CURRENT_DATE)';
        ELSIF (v_val = 'false' OR v_val = '0') THEN
          v_frag := 'NOT EXISTS (SELECT 1 FROM cliente_contratos cc WHERE cc.cliente_id = c.id AND cc.deleted_at IS NULL AND cc.data_fim IS NOT NULL AND cc.data_fim <= CURRENT_DATE)';
        END IF;
      ELSE
        NULL;
    END CASE;

    IF v_frag IS NOT NULL THEN
      IF v_idx > 0 THEN
        v_where_clause := v_where_clause || ' ' || v_logical || ' ' || v_frag;
      ELSE
        v_where_clause := v_where_clause || ' AND ' || v_frag;
      END IF;
    END IF;
  END LOOP;

  v_sql := 'WITH base AS (
    SELECT c.id, c.nome, c.email, c.telefone,
      (SELECT cr.responsavel_id FROM cliente_responsaveis cr WHERE cr.cliente_id = c.id AND cr.deleted_at IS NULL AND ''principal'' = ANY(cr.roles) ORDER BY cr.created_at LIMIT 1) AS responsavel_id,
      c.status, c.logo_url, c.links_uteis, c.drive_url, c.created_at, c.updated_at
    FROM clientes c
    WHERE ' || v_where_clause || '
  ), cnt AS (SELECT COUNT(*)::bigint AS t FROM base)
  SELECT b.id, b.nome, b.email, b.telefone, b.responsavel_id, b.status, b.logo_url, b.links_uteis, b.drive_url, b.created_at, b.updated_at, cnt.t
  FROM base b CROSS JOIN cnt
  ORDER BY b.created_at DESC
  LIMIT ' || p_limit || ' OFFSET ' || p_offset;

  RETURN QUERY EXECUTE v_sql;
END;
$$;

COMMENT ON FUNCTION list_clientes_filtrados(jsonb, int, int) IS 'Lista clientes com filtros; visibilidade e responsável via cliente_responsaveis (fonte única).';

-- 9) RPCs soft-delete: permissão por is_responsavel_do_cliente
CREATE OR REPLACE FUNCTION soft_delete_cliente_plano(contrato_id uuid, cancelar_lancamentos boolean DEFAULT true)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
  now_iso timestamptz;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN RAISE EXCEPTION 'Usuário não autenticado'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM cliente_planos cp
    JOIN clientes c ON cp.cliente_id = c.id
    WHERE cp.id = soft_delete_cliente_plano.contrato_id
      AND cp.deleted_at IS NULL
      AND public.is_responsavel_do_cliente(c.id)
  ) THEN
    RAISE EXCEPTION 'Permissão negada para deletar este contrato de plano';
  END IF;
  now_iso := NOW();
  IF cancelar_lancamentos THEN
    UPDATE transacoes
    SET status = 'cancelado', deleted_at = now_iso
    WHERE (metadata->>'contrato_id')::uuid = soft_delete_cliente_plano.contrato_id
      AND metadata->>'contrato_tipo' = 'plano'
      AND status IN ('pendente', 'vencido')
      AND deleted_at IS NULL;
  END IF;
  UPDATE cliente_planos SET status = 'cancelado', deleted_at = now_iso WHERE id = soft_delete_cliente_plano.contrato_id;
END;
$$;

CREATE OR REPLACE FUNCTION soft_delete_cliente_servico(contrato_id uuid, cancelar_lancamentos boolean DEFAULT true)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
  now_iso timestamptz;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN RAISE EXCEPTION 'Usuário não autenticado'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM cliente_servicos cs
    JOIN clientes c ON cs.cliente_id = c.id
    WHERE cs.id = soft_delete_cliente_servico.contrato_id
      AND cs.deleted_at IS NULL
      AND public.is_responsavel_do_cliente(c.id)
  ) THEN
    RAISE EXCEPTION 'Permissão negada para deletar este contrato de serviço';
  END IF;
  now_iso := NOW();
  IF cancelar_lancamentos THEN
    UPDATE transacoes
    SET status = 'cancelado', deleted_at = now_iso
    WHERE (metadata->>'contrato_id')::uuid = soft_delete_cliente_servico.contrato_id
      AND metadata->>'contrato_tipo' = 'servico'
      AND status IN ('pendente', 'vencido')
      AND deleted_at IS NULL;
  END IF;
  UPDATE cliente_servicos SET status = 'cancelado', deleted_at = now_iso WHERE id = soft_delete_cliente_servico.contrato_id;
END;
$$;

CREATE OR REPLACE FUNCTION soft_delete_cliente_contrato(contrato_id uuid, cascata boolean DEFAULT false)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec record;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Usuário não autenticado'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM cliente_contratos cc
    JOIN clientes c ON c.id = cc.cliente_id
    WHERE cc.id = soft_delete_cliente_contrato.contrato_id
      AND cc.deleted_at IS NULL
      AND c.deleted_at IS NULL
      AND public.is_responsavel_do_cliente(c.id)
  ) THEN
    RAISE EXCEPTION 'Permissão negada para excluir este contrato';
  END IF;
  IF cascata THEN
    FOR rec IN SELECT id FROM cliente_planos WHERE contrato_id = soft_delete_cliente_contrato.contrato_id AND deleted_at IS NULL
    LOOP PERFORM soft_delete_cliente_plano(rec.id, true); END LOOP;
    FOR rec IN SELECT id FROM cliente_servicos WHERE contrato_id = soft_delete_cliente_contrato.contrato_id AND deleted_at IS NULL
    LOOP PERFORM soft_delete_cliente_servico(rec.id, true); END LOOP;
  END IF;
  UPDATE cliente_contratos SET deleted_at = NOW(), updated_at = NOW() WHERE id = soft_delete_cliente_contrato.contrato_id;
END;
$$;

-- cliente_contratos UPDATE policy (soft delete) já usa is_responsavel_do_cliente acima

NOTIFY pgrst, 'reload schema';
