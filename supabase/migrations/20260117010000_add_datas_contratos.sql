-- ============================================================================
-- ADICIONAR CAMPOS DE DATA INÍCIO E FIM NOS CONTRATOS
-- ============================================================================
-- Permite definir período do contrato para cálculo automático de transações

-- Adicionar campos em cliente_planos
ALTER TABLE cliente_planos
ADD COLUMN IF NOT EXISTS data_inicio DATE,
ADD COLUMN IF NOT EXISTS data_fim DATE;

-- Adicionar campos em cliente_servicos
ALTER TABLE cliente_servicos
ADD COLUMN IF NOT EXISTS data_inicio DATE,
ADD COLUMN IF NOT EXISTS data_fim DATE;

-- Comentários
COMMENT ON COLUMN cliente_planos.data_inicio IS 'Data de início do contrato de plano';
COMMENT ON COLUMN cliente_planos.data_fim IS 'Data de fim do contrato de plano (opcional)';
COMMENT ON COLUMN cliente_servicos.data_inicio IS 'Data de início do contrato de serviço';
COMMENT ON COLUMN cliente_servicos.data_fim IS 'Data de fim do contrato de serviço (opcional)';

-- Índices para melhor performance em queries por data
CREATE INDEX IF NOT EXISTS idx_cliente_planos_data_inicio 
  ON cliente_planos(data_inicio);

CREATE INDEX IF NOT EXISTS idx_cliente_planos_data_fim 
  ON cliente_planos(data_fim);

CREATE INDEX IF NOT EXISTS idx_cliente_servicos_data_inicio 
  ON cliente_servicos(data_inicio);

CREATE INDEX IF NOT EXISTS idx_cliente_servicos_data_fim 
  ON cliente_servicos(data_fim);
