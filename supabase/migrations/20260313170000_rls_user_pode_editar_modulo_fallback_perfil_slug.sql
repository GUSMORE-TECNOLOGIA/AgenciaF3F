-- user_pode_editar_modulo: considerar usuarios.perfil (slug) quando perfil_id for NULL,
-- alinhando RLS ao frontend (loadPermissoes usa perfil por slug quando perfil_id ausente).

CREATE OR REPLACE FUNCTION public.user_pode_editar_modulo(p_modulo text)
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
    WHERE u.id = auth.uid() AND pp.pode_editar = true
  );
$$;

COMMENT ON FUNCTION public.user_pode_editar_modulo(text) IS
  'True se o perfil do usuário atual (por perfil_id ou por slug em usuarios.perfil) tem pode_editar no módulo.';
