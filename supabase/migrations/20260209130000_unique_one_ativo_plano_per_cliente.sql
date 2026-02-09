-- Regra de negócio: apenas um plano ATIVO por cliente (histórico de planos permitido).
-- Permite múltiplos planos por cliente com status pausado/cancelado/finalizado.

CREATE UNIQUE INDEX IF NOT EXISTS idx_cliente_planos_one_ativo_per_cliente
  ON cliente_planos (cliente_id)
  WHERE status = 'ativo' AND deleted_at IS NULL;

COMMENT ON INDEX idx_cliente_planos_one_ativo_per_cliente IS 'Garante no máximo um plano ativo por cliente; demais devem estar pausado, cancelado ou finalizado.';
