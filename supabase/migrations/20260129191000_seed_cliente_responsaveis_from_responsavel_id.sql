-- Migrar clientes.responsavel_id -> cliente_responsaveis (principal).
-- Garante que a lista use apenas a aba Responsáveis.

INSERT INTO public.cliente_responsaveis (cliente_id, responsavel_id, roles)
SELECT c.id, c.responsavel_id, ARRAY['principal']::text[]
FROM public.clientes c
WHERE c.responsavel_id IS NOT NULL
  AND c.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.cliente_responsaveis cr
    WHERE cr.cliente_id = c.id AND cr.responsavel_id = c.responsavel_id AND cr.deleted_at IS NULL
  );
