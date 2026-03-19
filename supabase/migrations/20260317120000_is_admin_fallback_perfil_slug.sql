-- is_admin(): considerar usuarios.perfil (texto) quando perfil_id for NULL.
-- Assim usuários com perfil "Administrador" (perfil = 'admin') mas perfil_id não preenchido
-- passam nas políticas RLS que usam is_admin() (ex.: cr_insert em cliente_responsaveis).

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios u
    LEFT JOIN public.perfis p ON p.id = u.perfil_id
    WHERE u.id = auth.uid()
      AND (
        u.role = 'admin'
        OR (u.perfil_id IS NOT NULL AND p.slug IS NOT NULL AND p.slug = 'admin')
        OR (u.perfil_id IS NULL AND u.perfil = 'admin')
      )
  );
$$;

COMMENT ON FUNCTION public.is_admin() IS
  'True se o usuário tem role=admin, ou perfil_id->slug=admin, ou (perfil_id NULL e perfil=admin).';
