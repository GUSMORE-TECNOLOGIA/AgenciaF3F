-- FIX DEFINITIVO: is_responsavel_do_cliente com OR (não COALESCE).
-- BUG anterior: COALESCE(false, true) = false — is_admin() retorna FALSE (não NULL) para agentes,
-- então COALESCE parava no primeiro valor não-NULL (FALSE) e nunca avaliava o EXISTS.
-- CORREÇÃO: usar OR para combinar condições booleanas.
-- Idempotente: pode ser aplicada múltiplas vezes.
CREATE OR REPLACE FUNCTION public.is_responsavel_do_cliente(p_cliente_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.cliente_responsaveis cr
      WHERE cr.cliente_id = p_cliente_id
        AND cr.responsavel_id = auth.uid()
        AND cr.deleted_at IS NULL
    )
    OR COALESCE(
      (SELECT (c.responsavel_id = auth.uid())
       FROM public.clientes c
       WHERE c.id = p_cliente_id AND c.deleted_at IS NULL
       LIMIT 1),
      false
    );
$$;

COMMENT ON FUNCTION public.is_responsavel_do_cliente(uuid) IS 'True se admin OR em cliente_responsaveis OR clientes.responsavel_id = auth.uid(). Usa OR (não COALESCE) para combinar booleanos.';

NOTIFY pgrst, 'reload schema';
