-- Migration: Equipe e Responsáveis - Agência F3F
-- Created: 15/01/2026 12:00:00
-- Description: Tabelas para gestão de equipe e responsáveis de clientes
-- Baseado em collaborators e student_responsibles do Organizacao10x

-- ============================================================================
-- TABELA DE MEMBROS DA EQUIPE
-- ============================================================================
-- Equivalente a "collaborators" no Organizacao10x, adaptado para agência
CREATE TABLE IF NOT EXISTS equipe_membros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_completo TEXT NOT NULL CHECK (length(trim(nome_completo)) >= 2),
  email TEXT CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  telefone TEXT,
  cargo TEXT NOT NULL DEFAULT 'agente' CHECK (cargo IN ('admin', 'gerente', 'agente', 'suporte')),
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
  
  -- Vínculo com usuário (opcional, 1:1)
  user_id UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Responsável que criou/gerencia este membro
  responsavel_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  
  -- Auditoria
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  -- Constraint: 1 user_id por responsável (para vínculo 1:1)
  CONSTRAINT unique_user_per_responsavel UNIQUE (user_id, responsavel_id) 
    DEFERRABLE INITIALLY DEFERRED
);

-- ============================================================================
-- TABELA DE RESPONSÁVEIS DE CLIENTES
-- ============================================================================
-- Equivalente a "student_responsibles" no Organizacao10x, adaptado para clientes
CREATE TABLE IF NOT EXISTS cliente_responsaveis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  responsavel_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  
  -- Roles (array de papéis do responsável)
  roles TEXT[] NOT NULL DEFAULT ARRAY['principal']::TEXT[],
  -- Papéis válidos: principal, comercial, suporte, backup
  
  -- Observações sobre o responsável
  observacao TEXT,
  
  -- Auditoria
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  -- Constraint: 1 responsável principal por cliente
  CONSTRAINT unique_principal_per_cliente UNIQUE (cliente_id, responsavel_id) 
    DEFERRABLE INITIALLY DEFERRED
);

-- ============================================================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================================================

-- Equipe Membros
CREATE INDEX IF NOT EXISTS idx_equipe_membros_responsavel ON equipe_membros(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_equipe_membros_status ON equipe_membros(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_equipe_membros_cargo ON equipe_membros(cargo);
CREATE INDEX IF NOT EXISTS idx_equipe_membros_user_id ON equipe_membros(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_equipe_membros_deleted ON equipe_membros(deleted_at) WHERE deleted_at IS NULL;

-- Cliente Responsáveis
CREATE INDEX IF NOT EXISTS idx_cliente_responsaveis_cliente ON cliente_responsaveis(cliente_id);
CREATE INDEX IF NOT EXISTS idx_cliente_responsaveis_responsavel ON cliente_responsaveis(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_cliente_responsaveis_roles ON cliente_responsaveis USING GIN(roles);
CREATE INDEX IF NOT EXISTS idx_cliente_responsaveis_deleted ON cliente_responsaveis(deleted_at) WHERE deleted_at IS NULL;

-- ============================================================================
-- TRIGGERS PARA updated_at
-- ============================================================================

CREATE TRIGGER update_equipe_membros_updated_at BEFORE UPDATE ON equipe_membros
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cliente_responsaveis_updated_at BEFORE UPDATE ON cliente_responsaveis
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE equipe_membros ENABLE ROW LEVEL SECURITY;
ALTER TABLE cliente_responsaveis ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLÍTICAS RLS - EQUIPE MEMBROS
-- ============================================================================

-- Usuários podem ver membros da equipe que são seus responsáveis
CREATE POLICY "Usuários podem ver membros da equipe"
  ON equipe_membros FOR SELECT
  USING (responsavel_id = auth.uid() AND deleted_at IS NULL);

-- Usuários podem criar membros da equipe
CREATE POLICY "Usuários podem criar membros da equipe"
  ON equipe_membros FOR INSERT
  WITH CHECK (responsavel_id = auth.uid());

-- Usuários podem atualizar membros da equipe que são responsáveis
CREATE POLICY "Usuários podem atualizar membros da equipe"
  ON equipe_membros FOR UPDATE
  USING (responsavel_id = auth.uid() AND deleted_at IS NULL);

-- ============================================================================
-- POLÍTICAS RLS - CLIENTE RESPONSÁVEIS
-- ============================================================================

-- Usuários podem ver responsáveis dos seus clientes
CREATE POLICY "Usuários podem ver responsáveis dos clientes"
  ON cliente_responsaveis FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clientes
      WHERE clientes.id = cliente_responsaveis.cliente_id
      AND clientes.responsavel_id = auth.uid()
      AND clientes.deleted_at IS NULL
    )
    AND cliente_responsaveis.deleted_at IS NULL
  );

-- Usuários podem criar responsáveis para seus clientes
CREATE POLICY "Usuários podem criar responsáveis"
  ON cliente_responsaveis FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clientes
      WHERE clientes.id = cliente_responsaveis.cliente_id
      AND clientes.responsavel_id = auth.uid()
      AND clientes.deleted_at IS NULL
    )
  );

-- Usuários podem atualizar responsáveis dos seus clientes
CREATE POLICY "Usuários podem atualizar responsáveis"
  ON cliente_responsaveis FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM clientes
      WHERE clientes.id = cliente_responsaveis.cliente_id
      AND clientes.responsavel_id = auth.uid()
      AND clientes.deleted_at IS NULL
    )
    AND cliente_responsaveis.deleted_at IS NULL
  );

-- ============================================================================
-- FUNÇÕES AUXILIARES
-- ============================================================================

-- Função para validar que apenas um responsável principal existe por cliente
CREATE OR REPLACE FUNCTION validate_single_principal_per_cliente()
RETURNS TRIGGER AS $$
BEGIN
  -- Se está adicionando/atualizando com role 'principal'
  IF 'principal' = ANY(NEW.roles) THEN
    -- Verificar se já existe outro responsável principal para o mesmo cliente
    IF EXISTS (
      SELECT 1 FROM cliente_responsaveis
      WHERE cliente_id = NEW.cliente_id
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)
      AND 'principal' = ANY(roles)
      AND deleted_at IS NULL
    ) THEN
      RAISE EXCEPTION 'Apenas um responsável principal pode ser atribuído por cliente';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para validar responsável principal único
CREATE TRIGGER trigger_validate_single_principal
  BEFORE INSERT OR UPDATE ON cliente_responsaveis
  FOR EACH ROW
  EXECUTE FUNCTION validate_single_principal_per_cliente();

-- ============================================================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ============================================================================

COMMENT ON TABLE equipe_membros IS 'Membros da equipe da agência, equivalente a collaborators no Organizacao10x';
COMMENT ON TABLE cliente_responsaveis IS 'Responsáveis atribuídos a clientes, equivalente a student_responsibles no Organizacao10x';
COMMENT ON COLUMN equipe_membros.cargo IS 'Cargo do membro: admin, gerente, agente, suporte';
COMMENT ON COLUMN equipe_membros.user_id IS 'Vínculo opcional com usuário (1:1 por responsável)';
COMMENT ON COLUMN cliente_responsaveis.roles IS 'Array de papéis: principal, comercial, suporte, backup';
COMMENT ON COLUMN cliente_responsaveis.observacao IS 'Observações sobre o responsável para este cliente';
