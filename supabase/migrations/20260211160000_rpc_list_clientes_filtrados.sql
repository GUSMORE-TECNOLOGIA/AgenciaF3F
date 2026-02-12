-- RPC para listar clientes com filtros inteligentes (Campo + Operador + Valor, AND/OR).
-- Respeita visibilidade: responsavel do cliente ou is_admin().
-- p_conditions: JSONB array de { field, operator, value?, logicalOperator? }

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
  v_where_clause text := '';
  v_sql text;
  v_ct_sql text;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;
  SELECT public.is_admin() INTO v_admin;

  v_where_clause := 'c.deleted_at IS NULL AND (c.responsavel_id = ' || quote_literal(v_uid) || ' OR ' || v_admin || ')';

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
            IF v_val IS NOT NULL THEN v_frag := format('(c.responsavel_id = %L::uuid)', v_val); END IF;
          WHEN 'not_equals' THEN
            IF v_val IS NOT NULL THEN v_frag := format('(c.responsavel_id IS DISTINCT FROM %L::uuid)', v_val); END IF;
          WHEN 'is_empty' THEN v_frag := '(c.responsavel_id IS NULL)';
          WHEN 'is_not_empty' THEN v_frag := '(c.responsavel_id IS NOT NULL)';
          ELSE
            IF v_val IS NOT NULL THEN v_frag := format('(c.responsavel_id = %L::uuid)', v_val); END IF;
        END CASE;
      WHEN 'tem_contrato' THEN
        IF (v_val = 'true' OR v_val = '1') THEN
          v_frag := 'EXISTS (SELECT 1 FROM cliente_contratos cc WHERE cc.cliente_id = c.id AND cc.deleted_at IS NULL)';
        ELSIF (v_val = 'false' OR v_val = '0') THEN
          v_frag := 'NOT EXISTS (SELECT 1 FROM cliente_contratos cc WHERE cc.cliente_id = c.id AND cc.deleted_at IS NULL)';
        END IF;
      WHEN 'contrato_assinado' THEN
        IF v_val IS NOT NULL THEN
          v_frag := format('EXISTS (SELECT 1 FROM cliente_contratos cc WHERE cc.cliente_id = c.id AND cc.deleted_at IS NULL AND cc.contrato_assinado = %L)', v_val);
        END IF;
      WHEN 'tem_plano' THEN
        IF (v_val = 'true' OR v_val = '1') THEN
          v_frag := 'EXISTS (SELECT 1 FROM cliente_planos cp WHERE cp.cliente_id = c.id AND cp.deleted_at IS NULL)';
        ELSIF (v_val = 'false' OR v_val = '0') THEN
          v_frag := 'NOT EXISTS (SELECT 1 FROM cliente_planos cp WHERE cp.cliente_id = c.id AND cp.deleted_at IS NULL)';
        END IF;
      WHEN 'plano_status' THEN
        IF v_val IS NOT NULL THEN
          v_frag := format('EXISTS (SELECT 1 FROM cliente_planos cp WHERE cp.cliente_id = c.id AND cp.deleted_at IS NULL AND cp.status = %L)', v_val);
        END IF;
      WHEN 'tem_servico' THEN
        IF (v_val = 'true' OR v_val = '1') THEN
          v_frag := 'EXISTS (SELECT 1 FROM cliente_servicos cs WHERE cs.cliente_id = c.id AND cs.deleted_at IS NULL)';
        ELSIF (v_val = 'false' OR v_val = '0') THEN
          v_frag := 'NOT EXISTS (SELECT 1 FROM cliente_servicos cs WHERE cs.cliente_id = c.id AND cs.deleted_at IS NULL)';
        END IF;
      WHEN 'servico_status' THEN
        IF v_val IS NOT NULL THEN
          v_frag := format('EXISTS (SELECT 1 FROM cliente_servicos cs WHERE cs.cliente_id = c.id AND cs.deleted_at IS NULL AND cs.status = %L)', v_val);
        END IF;
      WHEN 'tem_financeiro_gerado' THEN
        IF (v_val = 'true' OR v_val = '1') THEN
          v_frag := 'EXISTS (
            SELECT 1 FROM transacoes t
            WHERE t.deleted_at IS NULL
              AND t.metadata IS NOT NULL
              AND t.metadata->>''contrato_id'' IS NOT NULL
              AND t.metadata->>''contrato_tipo'' IN (''plano'',''servico'')
              AND (
                ((t.metadata->>''contrato_tipo'') = ''plano'' AND (t.metadata->>''contrato_id'')::uuid IN (SELECT cp.id FROM cliente_planos cp WHERE cp.cliente_id = c.id AND cp.deleted_at IS NULL))
                OR
                ((t.metadata->>''contrato_tipo'') = ''servico'' AND (t.metadata->>''contrato_id'')::uuid IN (SELECT cs.id FROM cliente_servicos cs WHERE cs.cliente_id = c.id AND cs.deleted_at IS NULL))
              )
          )';
        ELSIF (v_val = 'false' OR v_val = '0') THEN
          v_frag := 'NOT EXISTS (
            SELECT 1 FROM transacoes t
            WHERE t.deleted_at IS NULL
              AND t.metadata IS NOT NULL
              AND t.metadata->>''contrato_id'' IS NOT NULL
              AND t.metadata->>''contrato_tipo'' IN (''plano'',''servico'')
              AND (
                ((t.metadata->>''contrato_tipo'') = ''plano'' AND (t.metadata->>''contrato_id'')::uuid IN (SELECT cp.id FROM cliente_planos cp WHERE cp.cliente_id = c.id AND cp.deleted_at IS NULL))
                OR
                ((t.metadata->>''contrato_tipo'') = ''servico'' AND (t.metadata->>''contrato_id'')::uuid IN (SELECT cs.id FROM cliente_servicos cs WHERE cs.cliente_id = c.id AND cs.deleted_at IS NULL))
              )
          )';
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

  v_sql := 'WITH base AS (SELECT c.id, c.nome, c.email, c.telefone, c.responsavel_id, c.status, c.logo_url, c.links_uteis, c.drive_url, c.created_at, c.updated_at FROM clientes c WHERE ' || v_where_clause || '), cnt AS (SELECT COUNT(*)::bigint AS t FROM base) SELECT b.id, b.nome, b.email, b.telefone, b.responsavel_id, b.status, b.logo_url, b.links_uteis, b.drive_url, b.created_at, b.updated_at, cnt.t FROM base b CROSS JOIN cnt ORDER BY b.created_at DESC LIMIT ' || p_limit || ' OFFSET ' || p_offset;

  RETURN QUERY EXECUTE v_sql;
END;
$$;

COMMENT ON FUNCTION list_clientes_filtrados(jsonb, int, int) IS 'Lista clientes com filtros inteligentes; respeita visibilidade (responsavel ou admin).';
