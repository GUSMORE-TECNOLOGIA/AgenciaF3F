-- ============================================================================
-- TABELA DE HISTÓRICO DE MUDANÇAS DE STATUS DE CONTRATOS
-- ============================================================================
-- Rastreia todas as mudanças de status em contratos (planos e serviços)

CREATE TABLE IF NOT EXISTS contrato_status_historico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tipo de contrato: 'plano' ou 'servico'
  tipo_contrato TEXT NOT NULL CHECK (tipo_contrato IN ('plano', 'servico')),
  
  -- ID do contrato (pode ser de cliente_planos ou cliente_servicos)
  contrato_id UUID NOT NULL,
  
  -- Status anterior e novo
  status_anterior TEXT,
  status_novo TEXT NOT NULL,
  
  -- Usuário que fez a mudança
  usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  
  -- Observações sobre a mudança
  observacoes TEXT,
  
  -- Metadata adicional (JSON flexível)
  metadata JSONB,
  
  -- Auditoria
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_contrato_status_historico_contrato 
  ON contrato_status_historico(tipo_contrato, contrato_id);

CREATE INDEX IF NOT EXISTS idx_contrato_status_historico_usuario 
  ON contrato_status_historico(usuario_id);

CREATE INDEX IF NOT EXISTS idx_contrato_status_historico_created 
  ON contrato_status_historico(created_at DESC);

-- ============================================================================
-- FUNÇÃO PARA REGISTRAR MUDANÇA DE STATUS AUTOMATICAMENTE
-- ============================================================================
CREATE OR REPLACE FUNCTION registrar_mudanca_status_contrato()
RETURNS TRIGGER AS $$
DECLARE
  v_tipo_contrato TEXT;
  v_usuario_id UUID;
BEGIN
  -- Determinar o tipo de contrato baseado na tabela
  IF TG_TABLE_NAME = 'cliente_planos' THEN
    v_tipo_contrato := 'plano';
  ELSIF TG_TABLE_NAME = 'cliente_servicos' THEN
    v_tipo_contrato := 'servico';
  ELSE
    RETURN NEW;
  END IF;

  -- Verificar se o status mudou
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Tentar obter o ID do usuário atual (se disponível via JWT)
    -- Por enquanto, usar NULL se não conseguir
    v_usuario_id := NULL;
    
    -- Inserir registro no histórico
    INSERT INTO contrato_status_historico (
      tipo_contrato,
      contrato_id,
      status_anterior,
      status_novo,
      usuario_id,
      metadata
    ) VALUES (
      v_tipo_contrato,
      NEW.id,
      OLD.status,
      NEW.status,
      v_usuario_id,
      jsonb_build_object(
        'valor_anterior', OLD.valor,
        'valor_novo', NEW.valor,
        'moeda', NEW.moeda,
        'updated_at', NEW.updated_at
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGERS PARA REGISTRAR MUDANÇAS AUTOMATICAMENTE
-- ============================================================================
DROP TRIGGER IF EXISTS trigger_historico_status_cliente_planos ON cliente_planos;
CREATE TRIGGER trigger_historico_status_cliente_planos
  AFTER UPDATE ON cliente_planos
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION registrar_mudanca_status_contrato();

DROP TRIGGER IF EXISTS trigger_historico_status_cliente_servicos ON cliente_servicos;
CREATE TRIGGER trigger_historico_status_cliente_servicos
  AFTER UPDATE ON cliente_servicos
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION registrar_mudanca_status_contrato();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================
ALTER TABLE contrato_status_historico ENABLE ROW LEVEL SECURITY;

-- Política: Usuários autenticados podem ler histórico de contratos relacionados aos seus clientes
CREATE POLICY "Usuários podem ver histórico de contratos dos seus clientes"
  ON contrato_status_historico
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid()
      AND (
        -- Admin pode ver tudo
        u.role = 'admin'
        OR
        -- Usuário pode ver histórico de contratos dos clientes que ele é responsável
        EXISTS (
          SELECT 1 FROM clientes c
          WHERE (
            (tipo_contrato = 'plano' AND c.id IN (SELECT cliente_id FROM cliente_planos WHERE id = contrato_status_historico.contrato_id))
            OR
            (tipo_contrato = 'servico' AND c.id IN (SELECT cliente_id FROM cliente_servicos WHERE id = contrato_status_historico.contrato_id))
          )
          AND c.responsavel_id = u.id
          AND c.deleted_at IS NULL
        )
      )
    )
  );

-- Política: Apenas sistema pode inserir histórico (via triggers)
CREATE POLICY "Sistema pode inserir histórico"
  ON contrato_status_historico
  FOR INSERT
  WITH CHECK (true);
