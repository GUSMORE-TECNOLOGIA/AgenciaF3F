-- Exibir nome completo do responsável (equipe_membros.nome_completo) em todos os pontos do sistema.
-- Quando houver vínculo equipe_membros.user_id = usuarios.id, usar nome_completo; senão usuarios.name.

-- 1) get_responsavel_name: usado na aba Responsáveis do cliente e em cliente-responsaveis.
CREATE OR REPLACE FUNCTION get_responsavel_name(p_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
  is_admin BOOLEAN;
  out_name TEXT;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM usuarios u
    LEFT JOIN perfis p ON p.id = u.perfil_id
    WHERE u.id = current_user_id AND (u.role = 'admin' OR (p.slug IS NOT NULL AND p.slug = 'admin'))
  ) INTO is_admin;

  -- Ver ver algum cliente com esse responsável (principal na tabela clientes ou em cliente_responsaveis)
  IF NOT EXISTS (
    SELECT 1 FROM clientes c
    WHERE c.deleted_at IS NULL
      AND (c.responsavel_id = current_user_id OR is_admin)
      AND (
        c.responsavel_id = p_id
        OR EXISTS (SELECT 1 FROM cliente_responsaveis cr WHERE cr.cliente_id = c.id AND cr.responsavel_id = p_id AND cr.deleted_at IS NULL)
      )
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

COMMENT ON FUNCTION get_responsavel_name(UUID) IS 'Retorna nome completo do responsável (equipe_membros.nome_completo ou usuarios.name).';

-- 2) get_principais_para_lista: usado no filtro e na coluna Responsável da lista de clientes.
CREATE OR REPLACE FUNCTION get_principais_para_lista()
RETURNS TABLE(cliente_id UUID, responsavel_id UUID, responsavel_name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID;
  v_admin BOOLEAN;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN RETURN; END IF;

  SELECT is_admin() INTO v_admin;

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
    AND (c.responsavel_id = v_uid OR v_admin)
  ORDER BY c.id, cr.created_at;
END;
$$;

COMMENT ON FUNCTION get_principais_para_lista() IS 'Principais (cliente_responsaveis) por cliente; responsavel_name = nome completo (equipe) ou usuarios.name.';

-- 3) Lista de usuários para dropdown "Selecione um responsável" (ocorrências, etc.) com nome completo.
CREATE OR REPLACE FUNCTION get_usuarios_para_selecao_responsavel()
RETURNS TABLE(id UUID, email TEXT, nome_completo TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;

  RETURN QUERY
  SELECT
    u.id,
    u.email::TEXT,
    COALESCE(
      (SELECT em.nome_completo FROM equipe_membros em WHERE em.user_id = u.id AND em.deleted_at IS NULL LIMIT 1),
      u.name
    )::TEXT AS nome_completo
  FROM usuarios u
  WHERE (u.id = auth.uid() OR is_admin())
  ORDER BY nome_completo NULLS LAST, u.email;
END;
$$;

GRANT EXECUTE ON FUNCTION get_usuarios_para_selecao_responsavel() TO authenticated;

COMMENT ON FUNCTION get_usuarios_para_selecao_responsavel() IS 'Usuários visíveis para dropdown de responsável; retorna nome completo (equipe) ou name.';
