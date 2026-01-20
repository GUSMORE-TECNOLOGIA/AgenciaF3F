-- Migration: Planos e Serviços - Agência F3F
-- Created: 16/01/2026 00:00:00
-- Description: Estrutura de cadastro de planos e serviços, e relação N:N entre eles
-- Baseado em padrões do projeto Organizacao10x, adaptado para agência

-- ============================================================================
-- RENOMEAR TABELA SERVIÇOS ANTIGA (se existir)
-- ============================================================================
-- A tabela servicos antiga será renomeada para servicos_prestados
-- pois representa serviços prestados a clientes (estrutura antiga)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'servicos'
    AND EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'servicos' AND column_name = 'cliente_id'
    )
  ) THEN
    -- Verificar se já foi renomeada
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'servicos_prestados'
    ) THEN
      ALTER TABLE servicos RENAME TO servicos_prestados;
      RAISE NOTICE 'Tabela servicos renomeada para servicos_prestados';
    END IF;
  END IF;
END $$;

-- ============================================================================
-- TABELA DE SERVIÇOS (CADASTRO MESTRE)
-- ============================================================================
-- Serviços disponíveis na agência (Tráfego, Estratégia, Página, Edição de vídeo, etc.)
CREATE TABLE IF NOT EXISTS servicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  valor DECIMAL(10, 2), -- Valor individual do serviço (opcional)
  ativo BOOLEAN NOT NULL DEFAULT true,
  
  -- Auditoria
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Índice para serviços ativos
CREATE INDEX IF NOT EXISTS idx_servicos_ativo ON servicos(ativo) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_servicos_deleted ON servicos(deleted_at) WHERE deleted_at IS NULL;

-- ============================================================================
-- TABELA DE PLANOS
-- ============================================================================
-- Planos da agência (Plano Fase 1, Funil, L.T, Premium, etc.)
CREATE TABLE IF NOT EXISTS planos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  valor DECIMAL(10, 2) NOT NULL, -- Valor fixo do plano
  moeda TEXT NOT NULL DEFAULT 'BRL',
  ativo BOOLEAN NOT NULL DEFAULT true,
  
  -- Auditoria
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Índice para planos ativos
CREATE INDEX IF NOT EXISTS idx_planos_ativo ON planos(ativo) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_planos_deleted ON planos(deleted_at) WHERE deleted_at IS NULL;

-- ============================================================================
-- TABELA DE RELAÇÃO PLANO-SERVIÇOS (N:N)
-- ============================================================================
-- Define quais serviços estão vinculados a cada plano
CREATE TABLE IF NOT EXISTS plano_servicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plano_id UUID NOT NULL REFERENCES planos(id) ON DELETE CASCADE,
  servico_id UUID NOT NULL REFERENCES servicos(id) ON DELETE CASCADE,
  
  -- Ordem dos serviços no plano (opcional, para exibição)
  ordem INTEGER DEFAULT 0,
  
  -- Auditoria
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Garantir que não haja duplicatas
  UNIQUE(plano_id, servico_id)
);

-- Índices para relação plano-serviços
CREATE INDEX IF NOT EXISTS idx_plano_servicos_plano ON plano_servicos(plano_id);
CREATE INDEX IF NOT EXISTS idx_plano_servicos_servico ON plano_servicos(servico_id);

-- ============================================================================
-- TABELA DE CONTRATOS DE PLANOS COM CLIENTES
-- ============================================================================
-- Quando um cliente contrata um plano
CREATE TABLE IF NOT EXISTS cliente_planos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  plano_id UUID NOT NULL REFERENCES planos(id) ON DELETE RESTRICT,
  
  -- Valor do contrato (pode ser diferente do valor do plano se houver negociação)
  valor DECIMAL(10, 2) NOT NULL,
  moeda TEXT NOT NULL DEFAULT 'BRL',
  
  -- Status do contrato
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'pausado', 'cancelado', 'finalizado')),
  
  -- Observações/notas do contrato
  observacoes TEXT,
  
  -- Auditoria
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Índices para contratos de planos
CREATE INDEX IF NOT EXISTS idx_cliente_planos_cliente ON cliente_planos(cliente_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_cliente_planos_plano ON cliente_planos(plano_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_cliente_planos_status ON cliente_planos(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_cliente_planos_deleted ON cliente_planos(deleted_at) WHERE deleted_at IS NULL;

-- ============================================================================
-- TABELA DE CONTRATOS DE SERVIÇOS AVULSOS COM CLIENTES
-- ============================================================================
-- Quando um cliente contrata um serviço avulso (sem plano)
CREATE TABLE IF NOT EXISTS cliente_servicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  servico_id UUID NOT NULL REFERENCES servicos(id) ON DELETE RESTRICT,
  
  -- Valor do contrato (pode ser diferente do valor do serviço se houver negociação)
  valor DECIMAL(10, 2) NOT NULL,
  moeda TEXT NOT NULL DEFAULT 'BRL',
  
  -- Status do contrato
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'pausado', 'cancelado', 'finalizado')),
  
  -- Observações/notas do contrato
  observacoes TEXT,
  
  -- Auditoria
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Índices para contratos de serviços avulsos
CREATE INDEX IF NOT EXISTS idx_cliente_servicos_cliente ON cliente_servicos(cliente_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_cliente_servicos_servico ON cliente_servicos(servico_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_cliente_servicos_status ON cliente_servicos(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_cliente_servicos_deleted ON cliente_servicos(deleted_at) WHERE deleted_at IS NULL;

-- ============================================================================
-- TRIGGERS PARA UPDATED_AT
-- ============================================================================
CREATE TRIGGER update_servicos_updated_at BEFORE UPDATE ON servicos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_planos_updated_at BEFORE UPDATE ON planos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cliente_planos_updated_at BEFORE UPDATE ON cliente_planos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cliente_servicos_updated_at BEFORE UPDATE ON cliente_servicos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE planos ENABLE ROW LEVEL SECURITY;
ALTER TABLE plano_servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cliente_planos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cliente_servicos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para servicos (cadastro mestre)
-- Todos os usuários autenticados podem ver serviços ativos
CREATE POLICY "Usuários autenticados podem ver serviços"
  ON servicos FOR SELECT
  USING (auth.role() = 'authenticated' AND deleted_at IS NULL);

-- Apenas admins podem gerenciar serviços
CREATE POLICY "Apenas admins podem criar serviços"
  ON servicos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Apenas admins podem atualizar serviços"
  ON servicos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Apenas admins podem deletar serviços"
  ON servicos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Políticas RLS para planos (cadastro mestre)
-- Todos os usuários autenticados podem ver planos ativos
CREATE POLICY "Usuários autenticados podem ver planos"
  ON planos FOR SELECT
  USING (auth.role() = 'authenticated' AND deleted_at IS NULL);

-- Apenas admins podem gerenciar planos
CREATE POLICY "Apenas admins podem criar planos"
  ON planos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Apenas admins podem atualizar planos"
  ON planos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Apenas admins podem deletar planos"
  ON planos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Políticas RLS para plano_servicos (relação N:N)
-- Usuários autenticados podem ver relações
CREATE POLICY "Usuários autenticados podem ver relações plano-serviços"
  ON plano_servicos FOR SELECT
  USING (auth.role() = 'authenticated');

-- Apenas admins podem gerenciar relações
CREATE POLICY "Apenas admins podem gerenciar relações plano-serviços"
  ON plano_servicos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Políticas RLS para cliente_planos (contratos)
-- Usuários podem ver contratos de planos dos seus clientes
CREATE POLICY "Usuários podem ver contratos de planos dos seus clientes"
  ON cliente_planos FOR SELECT
  USING (
    (
      EXISTS (
        SELECT 1 FROM clientes
        WHERE clientes.id = cliente_planos.cliente_id
          AND clientes.responsavel_id = auth.uid()
          AND clientes.deleted_at IS NULL
      )
      OR EXISTS (
        SELECT 1 FROM usuarios
        WHERE id = auth.uid() AND role = 'admin'
      )
    )
    AND cliente_planos.deleted_at IS NULL
  );

-- Usuários podem criar contratos de planos para seus clientes
CREATE POLICY "Usuários podem criar contratos de planos para seus clientes"
  ON cliente_planos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clientes
      WHERE clientes.id = cliente_planos.cliente_id
        AND clientes.responsavel_id = auth.uid()
        AND clientes.deleted_at IS NULL
    )
    OR EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Usuários podem atualizar contratos de planos dos seus clientes
CREATE POLICY "Usuários podem atualizar contratos de planos dos seus clientes"
  ON cliente_planos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM clientes
      WHERE clientes.id = cliente_planos.cliente_id
        AND clientes.responsavel_id = auth.uid()
        AND clientes.deleted_at IS NULL
    )
    OR EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Políticas RLS para cliente_servicos (contratos avulsos)
-- Usuários podem ver contratos de serviços dos seus clientes
CREATE POLICY "Usuários podem ver contratos de serviços dos seus clientes"
  ON cliente_servicos FOR SELECT
  USING (
    (
      EXISTS (
        SELECT 1 FROM clientes
        WHERE clientes.id = cliente_servicos.cliente_id
          AND clientes.responsavel_id = auth.uid()
          AND clientes.deleted_at IS NULL
      )
      OR EXISTS (
        SELECT 1 FROM usuarios
        WHERE id = auth.uid() AND role = 'admin'
      )
    )
    AND cliente_servicos.deleted_at IS NULL
  );

-- Usuários podem criar contratos de serviços para seus clientes
CREATE POLICY "Usuários podem criar contratos de serviços para seus clientes"
  ON cliente_servicos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clientes
      WHERE clientes.id = cliente_servicos.cliente_id
        AND clientes.responsavel_id = auth.uid()
        AND clientes.deleted_at IS NULL
    )
    OR EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Usuários podem atualizar contratos de serviços dos seus clientes
CREATE POLICY "Usuários podem atualizar contratos de serviços dos seus clientes"
  ON cliente_servicos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM clientes
      WHERE clientes.id = cliente_servicos.cliente_id
        AND clientes.responsavel_id = auth.uid()
        AND clientes.deleted_at IS NULL
    )
    OR EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================
COMMENT ON TABLE servicos IS 'Cadastro mestre de serviços disponíveis na agência';
COMMENT ON TABLE planos IS 'Cadastro de planos da agência (pacotes de serviços)';
COMMENT ON TABLE plano_servicos IS 'Relação N:N entre planos e serviços';
COMMENT ON TABLE cliente_planos IS 'Contratos de clientes com planos';
COMMENT ON TABLE cliente_servicos IS 'Contratos de clientes com serviços avulsos';
