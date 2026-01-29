-- Permitir desvincular responsável principal: responsavel_id passa a aceitar NULL.

ALTER TABLE public.clientes
  ALTER COLUMN responsavel_id DROP NOT NULL;

COMMENT ON COLUMN public.clientes.responsavel_id IS 'Responsável principal do cliente; NULL se desvinculado.';

NOTIFY pgrst, 'reload schema';
