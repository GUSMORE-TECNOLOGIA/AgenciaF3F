-- Módulo Configuração: is_admin() deve considerar perfil "Administrador" (slug=admin),
-- não apenas usuarios.role = 'admin'. Assim quem tem perfil Administrador no sistema
-- (perfil_id -> perfis.slug = 'admin') também passa nas políticas RLS de admin.

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM usuarios u
    LEFT JOIN perfis p ON p.id = u.perfil_id
    WHERE u.id = auth.uid()
      AND (u.role = 'admin' OR (p.slug IS NOT NULL AND p.slug = 'admin'))
  );
$$;

COMMENT ON FUNCTION is_admin() IS 'True se o usuário atual tem role=admin ou perfil com slug=admin (Administrador).';
