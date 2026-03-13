-- Validação módulo Equipe + perfis: perfil Admin = admin em tudo.
-- 1) user_pode_visualizar_modulo: fallback por usuarios.perfil (slug) quando perfil_id NULL (como user_pode_editar_modulo).
-- 2) soft_delete_equipe_membro: usar is_admin() OU user_pode_editar_modulo('equipe').
-- 3) soft_delete_servico: usar is_admin() OU user_pode_editar_modulo('servicos').
-- Ref: validacao-modulo-equipe-perfis-admin.md

-- =============================================================================
-- 1) user_pode_visualizar_modulo – fallback por slug
-- =============================================================================
CREATE OR REPLACE FUNCTION public.user_pode_visualizar_modulo(p_modulo text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM usuarios u
    JOIN perfis p ON (
      (u.perfil_id IS NOT NULL AND p.id = u.perfil_id)
      OR (u.perfil_id IS NULL AND p.slug = u.perfil)
    )
    JOIN perfil_permissoes pp ON pp.perfil_id = p.id AND pp.modulo = p_modulo
    WHERE u.id = auth.uid() AND pp.pode_visualizar = true
  );
$$;

COMMENT ON FUNCTION public.user_pode_visualizar_modulo(text) IS
  'True se o perfil do usuário atual (por perfil_id ou slug em usuarios.perfil) tem pode_visualizar no módulo.';

-- =============================================================================
-- 2) soft_delete_equipe_membro
-- =============================================================================
CREATE OR REPLACE FUNCTION soft_delete_equipe_membro(membro_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
  pode_deletar BOOLEAN;
BEGIN
  current_user_id := auth.uid();

  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  SELECT (public.is_admin() OR public.user_pode_editar_modulo('equipe')) INTO pode_deletar;

  IF NOT pode_deletar THEN
    RAISE EXCEPTION 'Apenas administradores podem deletar membros da equipe';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM equipe_membros
    WHERE id = membro_id
    AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Membro da equipe não encontrado ou já deletado';
  END IF;

  UPDATE equipe_membros
  SET deleted_at = NOW()
  WHERE id = membro_id;
END;
$$;

COMMENT ON FUNCTION soft_delete_equipe_membro(UUID) IS 'Soft delete de membro da equipe; permissão por is_admin() ou user_pode_editar_modulo(equipe).';

-- =============================================================================
-- 3) soft_delete_servico
-- =============================================================================
CREATE OR REPLACE FUNCTION soft_delete_servico(servico_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
  pode_deletar BOOLEAN;
BEGIN
  current_user_id := auth.uid();

  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  SELECT (public.is_admin() OR public.user_pode_editar_modulo('servicos')) INTO pode_deletar;

  IF NOT pode_deletar THEN
    RAISE EXCEPTION 'Apenas administradores podem deletar serviços';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM servicos
    WHERE id = servico_id
    AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Serviço não encontrado ou já deletado';
  END IF;

  UPDATE servicos
  SET deleted_at = NOW()
  WHERE id = servico_id;
END;
$$;

COMMENT ON FUNCTION soft_delete_servico(UUID) IS 'Soft delete de serviço; permissão por is_admin() ou user_pode_editar_modulo(servicos).';
