-- Fix 1: RPC get_usuarios_para_selecao_responsavel
-- Retorna apenas usuários com vínculo em equipe_membros (membros reais da equipe),
-- eliminando duplicatas de usuarios sem vínculo.
CREATE OR REPLACE FUNCTION public.get_usuarios_para_selecao_responsavel()
RETURNS TABLE(id uuid, email text, nome_completo text)
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
    COALESCE(em.nome_completo, u.name)::TEXT AS nome_completo
  FROM usuarios u
  INNER JOIN equipe_membros em ON em.user_id = u.id AND em.deleted_at IS NULL
  ORDER BY nome_completo NULLS LAST, u.email;
END;
$$;

-- Fix 2: Policy cr_insert em cliente_responsaveis
-- Substituir subquery inline por is_admin() (SECURITY DEFINER) para evitar
-- bloqueio de RLS na tabela usuarios dentro da policy.
DROP POLICY IF EXISTS cr_insert ON public.cliente_responsaveis;

CREATE POLICY cr_insert ON public.cliente_responsaveis
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      is_admin()
      OR EXISTS (
        SELECT 1
        FROM public.cliente_responsaveis cr2
        WHERE cr2.cliente_id = cliente_responsaveis.cliente_id
          AND cr2.responsavel_id = auth.uid()
          AND cr2.deleted_at IS NULL
      )
    )
  );
