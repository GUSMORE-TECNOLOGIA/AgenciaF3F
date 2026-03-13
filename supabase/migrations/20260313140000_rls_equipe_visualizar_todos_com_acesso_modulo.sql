-- Ryan (e outros) não viam membros na tela Equipe porque a RLS só permitia:
-- (responsavel_id = auth.uid()) OR is_admin(). Quem tem permissão de visualizar o módulo Equipe
-- mas não é admin e não é responsável de nenhum membro via zero linhas.
--
-- Regra: quem tem permissão "visualizar" no módulo equipe (e portanto acessa a tela) pode ver
-- todos os membros. INSERT/UPDATE continuam restritos a responsável do membro ou admin.

-- Função: usuário atual tem permissão de visualizar o módulo?
CREATE OR REPLACE FUNCTION public.user_pode_visualizar_modulo(p_modulo text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM usuarios u
    JOIN perfil_permissoes pp ON pp.perfil_id = u.perfil_id AND pp.modulo = p_modulo
    WHERE u.id = auth.uid() AND pp.pode_visualizar = true
  );
$$;

COMMENT ON FUNCTION public.user_pode_visualizar_modulo(text) IS
  'True se o perfil do usuário atual tem pode_visualizar no módulo; usado em RLS para Equipe.';

-- Política SELECT: ver membros se for admin, ou responsável do membro, ou tiver permissão de visualizar equipe
DROP POLICY IF EXISTS "equipe_membros_select" ON public.equipe_membros;
CREATE POLICY "equipe_membros_select" ON public.equipe_membros
  FOR SELECT USING (
    (deleted_at IS NULL)
    AND (
      (responsavel_id = auth.uid())
      OR public.is_admin()
      OR public.user_pode_visualizar_modulo('equipe')
    )
  );
