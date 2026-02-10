-- ON CONFLICT (upsert) não suporta constraint DEFERRABLE; causa 500 no PostgREST.
-- Recriar unique (cliente_id, responsavel_id) como não deferrable para o upsert funcionar.

ALTER TABLE public.cliente_responsaveis
  DROP CONSTRAINT IF EXISTS unique_principal_per_cliente;

ALTER TABLE public.cliente_responsaveis
  ADD CONSTRAINT unique_principal_per_cliente
  UNIQUE (cliente_id, responsavel_id);
