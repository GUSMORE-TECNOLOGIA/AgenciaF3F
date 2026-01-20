-- Migration: Initial Schema - Agência F3F
-- Created: 15/01/2026 11:40:00
-- Description: Criação inicial das tabelas do sistema Agência F3F
-- Baseado em padrões do projeto Organizacao10x

-- ============================================================================
-- TABELA DE USUÁRIOS
-- ============================================================================
-- Extensão do auth.users do Supabase com informações adicionais
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABELA DE CLIENTES
-- ============================================================================
-- Equivalente a "students" no Organizacao10x, adaptado para clientes da agência
CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  responsavel_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'pausado')),
  
  -- Links úteis (JSONB para flexibilidade)
  links_uteis JSONB DEFAULT '{}',
  
  -- Drive do cliente
  drive_url TEXT,
  
  -- Auditoria
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- ============================================================================
-- TABELA DE SERVIÇOS
-- ============================================================================
-- Serviços prestados para cada cliente
CREATE TABLE IF NOT EXISTS servicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'pausado', 'finalizado')),
  valor DECIMAL(10, 2),
  data_inicio DATE NOT NULL,
  data_fim DATE,
  
  -- Auditoria
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- ============================================================================
-- TABELA DE TRANSAÇÕES FINANCEIRAS
-- ============================================================================
-- Baseado em financial_transactions do Organizacao10x
CREATE TABLE IF NOT EXISTS transacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  servico_id UUID REFERENCES servicos(id) ON DELETE SET NULL,
  
  -- Tipo e categoria
  tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa')),
  categoria TEXT NOT NULL, -- Ex: mensalidade, avulso, reembolso, etc
  
  -- Valores
  valor DECIMAL(10, 2) NOT NULL CHECK (valor >= 0),
  moeda TEXT NOT NULL DEFAULT 'BRL',
  
  -- Descrição e detalhes
  descricao TEXT NOT NULL,
  metodo_pagamento TEXT, -- Ex: pix, cartao, dinheiro, boleto, transferencia
  
  -- Status da transação
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'vencido', 'cancelado', 'reembolsado')),
  
  -- Datas
  data_vencimento DATE NOT NULL,
  data_pagamento TIMESTAMPTZ, -- Data efetiva do pagamento
  
  -- Integração com sistemas externos (opcional)
  external_transaction_id TEXT, -- ID da transação no gateway/plataforma externa
  external_source TEXT, -- Ex: eduzz, hotmart, stripe, etc
  
  -- Metadata adicional (JSON flexível)
  metadata JSONB,
  
  -- Auditoria
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- ============================================================================
-- TABELA DE GRUPOS DE OCORRÊNCIAS
-- ============================================================================
-- Baseado em occurrence_groups do Organizacao10x
CREATE TABLE IF NOT EXISTS ocorrencia_grupos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES usuarios(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES usuarios(id),
  
  -- Cada grupo pertence a um responsável (usuário)
  responsavel_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  
  UNIQUE(responsavel_id, nome)
);

-- ============================================================================
-- TABELA DE TIPOS DE OCORRÊNCIAS
-- ============================================================================
-- Baseado em occurrence_types do Organizacao10x
CREATE TABLE IF NOT EXISTS ocorrencia_tipos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grupo_id UUID NOT NULL REFERENCES ocorrencia_grupos(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES usuarios(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES usuarios(id),
  
  -- Cada tipo pertence a um responsável (usuário)
  responsavel_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  
  UNIQUE(responsavel_id, grupo_id, nome)
);

-- ============================================================================
-- TABELA DE OCORRÊNCIAS
-- ============================================================================
-- Baseado em student_occurrences do Organizacao10x, adaptado para clientes
CREATE TABLE IF NOT EXISTS ocorrencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  grupo_id UUID NOT NULL REFERENCES ocorrencia_grupos(id),
  tipo_id UUID NOT NULL REFERENCES ocorrencia_tipos(id),
  
  -- Dados da ocorrência
  ocorreu_em DATE NOT NULL CHECK (ocorreu_em <= CURRENT_DATE),
  notas TEXT NOT NULL,
  
  -- Responsável e prioridade
  responsavel_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  prioridade TEXT NOT NULL DEFAULT 'media' CHECK (prioridade IN ('baixa', 'media', 'alta', 'urgente')),
  
  -- Flags
  is_sensitive BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta', 'em_andamento', 'resolvida', 'cancelada')),
  
  -- Auditoria
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES usuarios(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES usuarios(id),
  deleted_at TIMESTAMPTZ
);

-- ============================================================================
-- TABELA DE ATENDIMENTOS
-- ============================================================================
-- Histórico de atendimentos ao cliente
CREATE TABLE IF NOT EXISTS atendimentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  
  -- Tipo de atendimento
  tipo TEXT NOT NULL CHECK (tipo IN ('email', 'whatsapp', 'telefone', 'presencial')),
  
  -- Dados do atendimento
  assunto TEXT NOT NULL,
  descricao TEXT NOT NULL,
  data_atendimento TIMESTAMPTZ NOT NULL,
  duracao_minutos INTEGER,
  
  -- Auditoria
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- ============================================================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================================================

-- Clientes
CREATE INDEX IF NOT EXISTS idx_clientes_responsavel ON clientes(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_clientes_status ON clientes(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_clientes_deleted ON clientes(deleted_at) WHERE deleted_at IS NULL;

-- Serviços
CREATE INDEX IF NOT EXISTS idx_servicos_cliente ON servicos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_servicos_status ON servicos(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_servicos_deleted ON servicos(deleted_at) WHERE deleted_at IS NULL;

-- Transações
CREATE INDEX IF NOT EXISTS idx_transacoes_cliente ON transacoes(cliente_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_servico ON transacoes(servico_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_tipo ON transacoes(tipo);
CREATE INDEX IF NOT EXISTS idx_transacoes_status ON transacoes(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_transacoes_data_vencimento ON transacoes(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_transacoes_data_pagamento ON transacoes(data_pagamento);
CREATE INDEX IF NOT EXISTS idx_transacoes_deleted ON transacoes(deleted_at) WHERE deleted_at IS NULL;

-- Ocorrências
CREATE INDEX IF NOT EXISTS idx_ocorrencia_grupos_responsavel ON ocorrencia_grupos(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_ocorrencia_tipos_grupo ON ocorrencia_tipos(grupo_id);
CREATE INDEX IF NOT EXISTS idx_ocorrencia_tipos_responsavel ON ocorrencia_tipos(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_ocorrencias_cliente ON ocorrencias(cliente_id);
CREATE INDEX IF NOT EXISTS idx_ocorrencias_grupo ON ocorrencias(grupo_id);
CREATE INDEX IF NOT EXISTS idx_ocorrencias_tipo ON ocorrencias(tipo_id);
CREATE INDEX IF NOT EXISTS idx_ocorrencias_responsavel ON ocorrencias(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_ocorrencias_status ON ocorrencias(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_ocorrencias_data ON ocorrencias(ocorreu_em DESC);
CREATE INDEX IF NOT EXISTS idx_ocorrencias_deleted ON ocorrencias(deleted_at) WHERE deleted_at IS NULL;

-- Atendimentos
CREATE INDEX IF NOT EXISTS idx_atendimentos_cliente ON atendimentos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_atendimentos_usuario ON atendimentos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_atendimentos_data ON atendimentos(data_atendimento);
CREATE INDEX IF NOT EXISTS idx_atendimentos_deleted ON atendimentos(deleted_at) WHERE deleted_at IS NULL;

-- ============================================================================
-- FUNÇÃO PARA ATUALIZAR updated_at AUTOMATICAMENTE
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS PARA updated_at
-- ============================================================================
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_servicos_updated_at BEFORE UPDATE ON servicos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transacoes_updated_at BEFORE UPDATE ON transacoes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ocorrencia_grupos_updated_at BEFORE UPDATE ON ocorrencia_grupos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ocorrencia_tipos_updated_at BEFORE UPDATE ON ocorrencia_tipos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ocorrencias_updated_at BEFORE UPDATE ON ocorrencias
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_atendimentos_updated_at BEFORE UPDATE ON atendimentos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocorrencia_grupos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocorrencia_tipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocorrencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE atendimentos ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLÍTICAS RLS - USUÁRIOS
-- ============================================================================

-- Usuários podem ver apenas seu próprio perfil
CREATE POLICY "Usuários podem ver próprio perfil"
  ON usuarios FOR SELECT
  USING (auth.uid() = id);

-- Usuários podem atualizar próprio perfil
CREATE POLICY "Usuários podem atualizar próprio perfil"
  ON usuarios FOR UPDATE
  USING (auth.uid() = id);

-- ============================================================================
-- POLÍTICAS RLS - CLIENTES
-- ============================================================================

-- Usuários podem ver apenas clientes que são responsáveis
CREATE POLICY "Usuários podem ver clientes responsáveis"
  ON clientes FOR SELECT
  USING (responsavel_id = auth.uid() AND deleted_at IS NULL);

-- Usuários podem criar clientes
CREATE POLICY "Usuários podem criar clientes"
  ON clientes FOR INSERT
  WITH CHECK (responsavel_id = auth.uid());

-- Usuários podem atualizar clientes que são responsáveis
CREATE POLICY "Usuários podem atualizar clientes responsáveis"
  ON clientes FOR UPDATE
  USING (responsavel_id = auth.uid() AND deleted_at IS NULL);

-- ============================================================================
-- POLÍTICAS RLS - SERVIÇOS
-- ============================================================================

-- Usuários podem ver serviços dos seus clientes
CREATE POLICY "Usuários podem ver serviços dos clientes"
  ON servicos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clientes
      WHERE clientes.id = servicos.cliente_id
      AND clientes.responsavel_id = auth.uid()
      AND clientes.deleted_at IS NULL
    )
    AND servicos.deleted_at IS NULL
  );

-- Usuários podem criar serviços para seus clientes
CREATE POLICY "Usuários podem criar serviços"
  ON servicos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clientes
      WHERE clientes.id = servicos.cliente_id
      AND clientes.responsavel_id = auth.uid()
      AND clientes.deleted_at IS NULL
    )
  );

-- Usuários podem atualizar serviços dos seus clientes
CREATE POLICY "Usuários podem atualizar serviços"
  ON servicos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM clientes
      WHERE clientes.id = servicos.cliente_id
      AND clientes.responsavel_id = auth.uid()
      AND clientes.deleted_at IS NULL
    )
    AND servicos.deleted_at IS NULL
  );

-- ============================================================================
-- POLÍTICAS RLS - TRANSAÇÕES
-- ============================================================================

-- Usuários podem ver transações dos seus clientes
CREATE POLICY "Usuários podem ver transações dos clientes"
  ON transacoes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clientes
      WHERE clientes.id = transacoes.cliente_id
      AND clientes.responsavel_id = auth.uid()
      AND clientes.deleted_at IS NULL
    )
    AND transacoes.deleted_at IS NULL
  );

-- Usuários podem criar transações para seus clientes
CREATE POLICY "Usuários podem criar transações"
  ON transacoes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clientes
      WHERE clientes.id = transacoes.cliente_id
      AND clientes.responsavel_id = auth.uid()
      AND clientes.deleted_at IS NULL
    )
  );

-- Usuários podem atualizar transações dos seus clientes
CREATE POLICY "Usuários podem atualizar transações"
  ON transacoes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM clientes
      WHERE clientes.id = transacoes.cliente_id
      AND clientes.responsavel_id = auth.uid()
      AND clientes.deleted_at IS NULL
    )
    AND transacoes.deleted_at IS NULL
  );

-- ============================================================================
-- POLÍTICAS RLS - OCORRÊNCIAS
-- ============================================================================

-- Grupos de ocorrências
CREATE POLICY "Usuários podem ver grupos de ocorrências"
  ON ocorrencia_grupos FOR SELECT
  USING (responsavel_id = auth.uid() AND is_active = true);

CREATE POLICY "Usuários podem criar grupos de ocorrências"
  ON ocorrencia_grupos FOR INSERT
  WITH CHECK (responsavel_id = auth.uid());

CREATE POLICY "Usuários podem atualizar grupos de ocorrências"
  ON ocorrencia_grupos FOR UPDATE
  USING (responsavel_id = auth.uid());

-- Tipos de ocorrências
CREATE POLICY "Usuários podem ver tipos de ocorrências"
  ON ocorrencia_tipos FOR SELECT
  USING (responsavel_id = auth.uid() AND is_active = true);

CREATE POLICY "Usuários podem criar tipos de ocorrências"
  ON ocorrencia_tipos FOR INSERT
  WITH CHECK (responsavel_id = auth.uid());

CREATE POLICY "Usuários podem atualizar tipos de ocorrências"
  ON ocorrencia_tipos FOR UPDATE
  USING (responsavel_id = auth.uid());

-- Ocorrências
CREATE POLICY "Usuários podem ver ocorrências dos clientes"
  ON ocorrencias FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clientes
      WHERE clientes.id = ocorrencias.cliente_id
      AND clientes.responsavel_id = auth.uid()
      AND clientes.deleted_at IS NULL
    )
    AND ocorrencias.deleted_at IS NULL
  );

CREATE POLICY "Usuários podem criar ocorrências"
  ON ocorrencias FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clientes
      WHERE clientes.id = ocorrencias.cliente_id
      AND clientes.responsavel_id = auth.uid()
      AND clientes.deleted_at IS NULL
    )
    AND ocorrencias.responsavel_id = auth.uid()
  );

CREATE POLICY "Usuários podem atualizar ocorrências"
  ON ocorrencias FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM clientes
      WHERE clientes.id = ocorrencias.cliente_id
      AND clientes.responsavel_id = auth.uid()
      AND clientes.deleted_at IS NULL
    )
    AND ocorrencias.responsavel_id = auth.uid()
    AND ocorrencias.deleted_at IS NULL
  );

-- ============================================================================
-- POLÍTICAS RLS - ATENDIMENTOS
-- ============================================================================

-- Usuários podem ver atendimentos dos seus clientes
CREATE POLICY "Usuários podem ver atendimentos dos clientes"
  ON atendimentos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clientes
      WHERE clientes.id = atendimentos.cliente_id
      AND clientes.responsavel_id = auth.uid()
      AND clientes.deleted_at IS NULL
    )
    AND atendimentos.deleted_at IS NULL
  );

-- Usuários podem criar atendimentos para seus clientes
CREATE POLICY "Usuários podem criar atendimentos"
  ON atendimentos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clientes
      WHERE clientes.id = atendimentos.cliente_id
      AND clientes.responsavel_id = auth.uid()
      AND clientes.deleted_at IS NULL
    )
    AND atendimentos.usuario_id = auth.uid()
  );

-- Usuários podem atualizar atendimentos dos seus clientes
CREATE POLICY "Usuários podem atualizar atendimentos"
  ON atendimentos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM clientes
      WHERE clientes.id = atendimentos.cliente_id
      AND clientes.responsavel_id = auth.uid()
      AND clientes.deleted_at IS NULL
    )
    AND atendimentos.usuario_id = auth.uid()
    AND atendimentos.deleted_at IS NULL
  );

-- ============================================================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ============================================================================

COMMENT ON TABLE clientes IS 'Clientes da agência, equivalente a students no Organizacao10x';
COMMENT ON TABLE servicos IS 'Serviços prestados para cada cliente';
COMMENT ON TABLE transacoes IS 'Transações financeiras (receitas/despesas) vinculadas a clientes e serviços';
COMMENT ON TABLE ocorrencia_grupos IS 'Grupos de categorização de ocorrências';
COMMENT ON TABLE ocorrencia_tipos IS 'Tipos específicos de ocorrências dentro de grupos';
COMMENT ON TABLE ocorrencias IS 'Ocorrências registradas para clientes';
COMMENT ON TABLE atendimentos IS 'Histórico de atendimentos ao cliente';
