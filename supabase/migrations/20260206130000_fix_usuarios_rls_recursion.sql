-- Corrige recursão infinita nas políticas RLS de usuarios
-- O EXISTS (SELECT FROM usuarios WHERE role = 'admin') dentro da política de usuarios
-- causava recursão infinita ao avaliar a própria tabela.
-- Solução: usar uma função auxiliar com SECURITY DEFINER que bypassa RLS.

-- Função auxiliar para checar se o usuário atual é admin (bypassa RLS)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM usuarios
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Recriar políticas de SELECT e UPDATE em usuarios sem recursão
DROP POLICY IF EXISTS "Admin pode ver todos usuarios" ON usuarios;
CREATE POLICY "Admin pode ver todos usuarios"
  ON usuarios FOR SELECT TO authenticated
  USING (auth.uid() = id OR is_admin());

DROP POLICY IF EXISTS "Admin pode atualizar qualquer usuario" ON usuarios;
CREATE POLICY "Admin pode atualizar qualquer usuario"
  ON usuarios FOR UPDATE TO authenticated
  USING (is_admin());

COMMENT ON FUNCTION is_admin() IS 'Verifica se o usuário atual é admin; usa SECURITY DEFINER para evitar recursão em políticas RLS.';
