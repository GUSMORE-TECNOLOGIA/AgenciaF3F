-- ============================================================================
-- SCRIPT CONSOLIDADO: AgenciaF3F - Todas as Migrations
-- ============================================================================
-- Data: 16/01/2026
-- Projeto Supabase: F3F (ID: rhnkffeyspymjpellmnd)
-- 
-- Este script consolida todas as migrations do projeto AgenciaF3F
-- de forma idempotente (pode ser executado multiplas vezes sem erros)
--
-- IMPORTANTE: Execute este script no SQL Editor do Supabase F3F
-- ============================================================================

-- ============================================================================
-- PARTE 1: TABELAS PRINCIPAIS
-- ============================================================================

CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  perfil TEXT NOT NULL DEFAULT 'agente' CHECK (perfil IN ('admin', 'gerente', 'agente', 'suporte')),
  must_reset_password BOOLEAN NOT NULL DEFAULT true,
  password_reset_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  responsavel_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'pausado')),
  links_uteis JSONB DEFAULT '{}',
  drive_url TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS servicos_prestados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'pausado', 'finalizado')),
  valor DECIMAL(10, 2),
  data_inicio DATE NOT NULL,
  data_fim DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS transacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  servico_id UUID,
  tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa')),
  categoria TEXT NOT NULL,
  valor DECIMAL(10, 2) NOT NULL CHECK (valor >= 0),
  moeda TEXT NOT NULL DEFAULT 'BRL',
  descricao TEXT NOT NULL,
  metodo_pagamento TEXT,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'vencido', 'cancelado', 'reembolsado')),
  data_vencimento DATE NOT NULL,
  data_pagamento TIMESTAMPTZ,
  external_transaction_id TEXT,
  external_source TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS ocorrencia_grupos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES usuarios(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES usuarios(id),
  responsavel_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  UNIQUE(responsavel_id, nome)
);

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
  responsavel_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  UNIQUE(responsavel_id, grupo_id, nome)
);

CREATE TABLE IF NOT EXISTS ocorrencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  grupo_id UUID NOT NULL REFERENCES ocorrencia_grupos(id),
  tipo_id UUID NOT NULL REFERENCES ocorrencia_tipos(id),
  ocorreu_em DATE NOT NULL CHECK (ocorreu_em <= CURRENT_DATE),
  notas TEXT NOT NULL,
  responsavel_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  prioridade TEXT NOT NULL DEFAULT 'media' CHECK (prioridade IN ('baixa', 'media', 'alta', 'urgente')),
  is_sensitive BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta', 'em_andamento', 'resolvida', 'cancelada')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES usuarios(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES usuarios(id),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS atendimentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  tipo TEXT NOT NULL CHECK (tipo IN ('email', 'whatsapp', 'telefone', 'presencial')),
  assunto TEXT NOT NULL,
  descricao TEXT NOT NULL,
  data_atendimento TIMESTAMPTZ NOT NULL,
  duracao_minutos INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- ============================================================================
-- PARTE 2: EQUIPE E RESPONSAVEIS
-- ============================================================================

CREATE TABLE IF NOT EXISTS equipe_membros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_completo TEXT NOT NULL CHECK (length(trim(nome_completo)) >= 2),
  email TEXT CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  telefone TEXT,
  perfil TEXT NOT NULL DEFAULT 'agente' CHECK (perfil IN ('admin', 'gerente', 'agente', 'suporte')),
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
  user_id UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  responsavel_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT unique_user_per_responsavel UNIQUE (user_id, responsavel_id) DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE IF NOT EXISTS cliente_responsaveis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  responsavel_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  roles TEXT[] NOT NULL DEFAULT ARRAY['principal']::TEXT[],
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT unique_principal_per_cliente UNIQUE (cliente_id, responsavel_id) DEFERRABLE INITIALLY DEFERRED
);

-- ============================================================================
-- PARTE 3: PLANOS E SERVICOS
-- ============================================================================

CREATE TABLE IF NOT EXISTS servicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  valor DECIMAL(10, 2),
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS planos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  valor DECIMAL(10, 2) NOT NULL,
  moeda TEXT NOT NULL DEFAULT 'BRL',
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS plano_servicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plano_id UUID NOT NULL REFERENCES planos(id) ON DELETE CASCADE,
  servico_id UUID NOT NULL REFERENCES servicos(id) ON DELETE CASCADE,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(plano_id, servico_id)
);

CREATE TABLE IF NOT EXISTS cliente_planos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  plano_id UUID NOT NULL REFERENCES planos(id) ON DELETE RESTRICT,
  valor DECIMAL(10, 2) NOT NULL,
  moeda TEXT NOT NULL DEFAULT 'BRL',
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'pausado', 'cancelado', 'finalizado')),
  observacoes TEXT,
  data_inicio DATE,
  data_fim DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS cliente_servicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  servico_id UUID NOT NULL REFERENCES servicos(id) ON DELETE RESTRICT,
  valor DECIMAL(10, 2) NOT NULL,
  moeda TEXT NOT NULL DEFAULT 'BRL',
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'pausado', 'cancelado', 'finalizado')),
  observacoes TEXT,
  data_inicio DATE,
  data_fim DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS contrato_status_historico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_contrato TEXT NOT NULL CHECK (tipo_contrato IN ('plano', 'servico')),
  contrato_id UUID NOT NULL,
  status_anterior TEXT,
  status_novo TEXT NOT NULL,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  observacoes TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- PARTE 4: INDICES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_clientes_responsavel ON clientes(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_clientes_status ON clientes(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_clientes_deleted ON clientes(deleted_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_servicos_prestados_cliente ON servicos_prestados(cliente_id);
CREATE INDEX IF NOT EXISTS idx_servicos_prestados_status ON servicos_prestados(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_servicos_prestados_deleted ON servicos_prestados(deleted_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_servicos_ativo ON servicos(ativo) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_servicos_deleted ON servicos(deleted_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_planos_ativo ON planos(ativo) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_planos_deleted ON planos(deleted_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_plano_servicos_plano ON plano_servicos(plano_id);
CREATE INDEX IF NOT EXISTS idx_plano_servicos_servico ON plano_servicos(servico_id);

CREATE INDEX IF NOT EXISTS idx_cliente_planos_cliente ON cliente_planos(cliente_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_cliente_planos_plano ON cliente_planos(plano_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_cliente_planos_status ON cliente_planos(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_cliente_planos_deleted ON cliente_planos(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_cliente_planos_data_inicio ON cliente_planos(data_inicio);
CREATE INDEX IF NOT EXISTS idx_cliente_planos_data_fim ON cliente_planos(data_fim);

CREATE INDEX IF NOT EXISTS idx_cliente_servicos_cliente ON cliente_servicos(cliente_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_cliente_servicos_servico ON cliente_servicos(servico_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_cliente_servicos_status ON cliente_servicos(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_cliente_servicos_deleted ON cliente_servicos(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_cliente_servicos_data_inicio ON cliente_servicos(data_inicio);
CREATE INDEX IF NOT EXISTS idx_cliente_servicos_data_fim ON cliente_servicos(data_fim);

CREATE INDEX IF NOT EXISTS idx_transacoes_cliente ON transacoes(cliente_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_servico ON transacoes(servico_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_tipo ON transacoes(tipo);
CREATE INDEX IF NOT EXISTS idx_transacoes_status ON transacoes(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_transacoes_data_vencimento ON transacoes(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_transacoes_data_pagamento ON transacoes(data_pagamento);
CREATE INDEX IF NOT EXISTS idx_transacoes_deleted ON transacoes(deleted_at) WHERE deleted_at IS NULL;

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

CREATE INDEX IF NOT EXISTS idx_atendimentos_cliente ON atendimentos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_atendimentos_usuario ON atendimentos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_atendimentos_data ON atendimentos(data_atendimento);
CREATE INDEX IF NOT EXISTS idx_atendimentos_deleted ON atendimentos(deleted_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_equipe_membros_responsavel ON equipe_membros(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_equipe_membros_status ON equipe_membros(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_equipe_membros_perfil ON equipe_membros(perfil);
CREATE INDEX IF NOT EXISTS idx_equipe_membros_user_id ON equipe_membros(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_equipe_membros_deleted ON equipe_membros(deleted_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_cliente_responsaveis_cliente ON cliente_responsaveis(cliente_id);
CREATE INDEX IF NOT EXISTS idx_cliente_responsaveis_responsavel ON cliente_responsaveis(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_cliente_responsaveis_roles ON cliente_responsaveis USING GIN(roles);
CREATE INDEX IF NOT EXISTS idx_cliente_responsaveis_deleted ON cliente_responsaveis(deleted_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_contrato_status_historico_contrato ON contrato_status_historico(tipo_contrato, contrato_id);
CREATE INDEX IF NOT EXISTS idx_contrato_status_historico_usuario ON contrato_status_historico(usuario_id);
CREATE INDEX IF NOT EXISTS idx_contrato_status_historico_created ON contrato_status_historico(created_at DESC);

-- ============================================================================
-- PARTE 5: FUNCOES
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $func$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$func$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION validate_single_principal_per_cliente()
RETURNS TRIGGER AS $func$
BEGIN
  IF 'principal' = ANY(NEW.roles) THEN
    IF EXISTS (
      SELECT 1 FROM cliente_responsaveis
      WHERE cliente_id = NEW.cliente_id
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)
      AND 'principal' = ANY(roles)
      AND deleted_at IS NULL
    ) THEN
      RAISE EXCEPTION 'Apenas um responsavel principal pode ser atribuido por cliente';
    END IF;
  END IF;
  RETURN NEW;
END;
$func$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION registrar_mudanca_status_contrato()
RETURNS TRIGGER AS $func$
DECLARE
  v_tipo_contrato TEXT;
BEGIN
  IF TG_TABLE_NAME = 'cliente_planos' THEN
    v_tipo_contrato := 'plano';
  ELSIF TG_TABLE_NAME = 'cliente_servicos' THEN
    v_tipo_contrato := 'servico';
  ELSE
    RETURN NEW;
  END IF;

  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO contrato_status_historico (
      tipo_contrato, contrato_id, status_anterior, status_novo, metadata
    ) VALUES (
      v_tipo_contrato, NEW.id, OLD.status, NEW.status,
      jsonb_build_object('valor_anterior', OLD.valor, 'valor_novo', NEW.valor, 'moeda', NEW.moeda)
    );
  END IF;

  RETURN NEW;
END;
$func$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PARTE 6: TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS update_usuarios_updated_at ON usuarios;
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_clientes_updated_at ON clientes;
CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_servicos_prestados_updated_at ON servicos_prestados;
CREATE TRIGGER update_servicos_prestados_updated_at BEFORE UPDATE ON servicos_prestados FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_servicos_updated_at ON servicos;
CREATE TRIGGER update_servicos_updated_at BEFORE UPDATE ON servicos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_planos_updated_at ON planos;
CREATE TRIGGER update_planos_updated_at BEFORE UPDATE ON planos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cliente_planos_updated_at ON cliente_planos;
CREATE TRIGGER update_cliente_planos_updated_at BEFORE UPDATE ON cliente_planos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cliente_servicos_updated_at ON cliente_servicos;
CREATE TRIGGER update_cliente_servicos_updated_at BEFORE UPDATE ON cliente_servicos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_transacoes_updated_at ON transacoes;
CREATE TRIGGER update_transacoes_updated_at BEFORE UPDATE ON transacoes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ocorrencia_grupos_updated_at ON ocorrencia_grupos;
CREATE TRIGGER update_ocorrencia_grupos_updated_at BEFORE UPDATE ON ocorrencia_grupos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ocorrencia_tipos_updated_at ON ocorrencia_tipos;
CREATE TRIGGER update_ocorrencia_tipos_updated_at BEFORE UPDATE ON ocorrencia_tipos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ocorrencias_updated_at ON ocorrencias;
CREATE TRIGGER update_ocorrencias_updated_at BEFORE UPDATE ON ocorrencias FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_atendimentos_updated_at ON atendimentos;
CREATE TRIGGER update_atendimentos_updated_at BEFORE UPDATE ON atendimentos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_equipe_membros_updated_at ON equipe_membros;
CREATE TRIGGER update_equipe_membros_updated_at BEFORE UPDATE ON equipe_membros FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cliente_responsaveis_updated_at ON cliente_responsaveis;
CREATE TRIGGER update_cliente_responsaveis_updated_at BEFORE UPDATE ON cliente_responsaveis FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_validate_single_principal ON cliente_responsaveis;
CREATE TRIGGER trigger_validate_single_principal BEFORE INSERT OR UPDATE ON cliente_responsaveis FOR EACH ROW EXECUTE FUNCTION validate_single_principal_per_cliente();

DROP TRIGGER IF EXISTS trigger_historico_status_cliente_planos ON cliente_planos;
CREATE TRIGGER trigger_historico_status_cliente_planos AFTER UPDATE ON cliente_planos FOR EACH ROW WHEN (OLD.status IS DISTINCT FROM NEW.status) EXECUTE FUNCTION registrar_mudanca_status_contrato();

DROP TRIGGER IF EXISTS trigger_historico_status_cliente_servicos ON cliente_servicos;
CREATE TRIGGER trigger_historico_status_cliente_servicos AFTER UPDATE ON cliente_servicos FOR EACH ROW WHEN (OLD.status IS DISTINCT FROM NEW.status) EXECUTE FUNCTION registrar_mudanca_status_contrato();

-- ============================================================================
-- PARTE 7: HABILITAR RLS
-- ============================================================================

ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicos_prestados ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE planos ENABLE ROW LEVEL SECURITY;
ALTER TABLE plano_servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cliente_planos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cliente_servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocorrencia_grupos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocorrencia_tipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocorrencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE atendimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipe_membros ENABLE ROW LEVEL SECURITY;
ALTER TABLE cliente_responsaveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE contrato_status_historico ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PARTE 8: POLITICAS RLS
-- ============================================================================

-- USUARIOS
DROP POLICY IF EXISTS "usuarios_select_own" ON usuarios;
CREATE POLICY "usuarios_select_own" ON usuarios FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "usuarios_update_own" ON usuarios;
CREATE POLICY "usuarios_update_own" ON usuarios FOR UPDATE USING (auth.uid() = id);

-- CLIENTES
DROP POLICY IF EXISTS "clientes_select_responsavel" ON clientes;
CREATE POLICY "clientes_select_responsavel" ON clientes FOR SELECT USING (responsavel_id = auth.uid() AND deleted_at IS NULL);

DROP POLICY IF EXISTS "clientes_insert_responsavel" ON clientes;
CREATE POLICY "clientes_insert_responsavel" ON clientes FOR INSERT WITH CHECK (responsavel_id = auth.uid());

DROP POLICY IF EXISTS "clientes_update_responsavel" ON clientes;
CREATE POLICY "clientes_update_responsavel" ON clientes FOR UPDATE USING (responsavel_id = auth.uid() AND deleted_at IS NULL);

-- SERVICOS_PRESTADOS
DROP POLICY IF EXISTS "servicos_prestados_select" ON servicos_prestados;
CREATE POLICY "servicos_prestados_select" ON servicos_prestados FOR SELECT USING (
  EXISTS (SELECT 1 FROM clientes WHERE clientes.id = servicos_prestados.cliente_id AND clientes.responsavel_id = auth.uid() AND clientes.deleted_at IS NULL)
  AND servicos_prestados.deleted_at IS NULL
);

DROP POLICY IF EXISTS "servicos_prestados_insert" ON servicos_prestados;
CREATE POLICY "servicos_prestados_insert" ON servicos_prestados FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM clientes WHERE clientes.id = servicos_prestados.cliente_id AND clientes.responsavel_id = auth.uid() AND clientes.deleted_at IS NULL)
);

DROP POLICY IF EXISTS "servicos_prestados_update" ON servicos_prestados;
CREATE POLICY "servicos_prestados_update" ON servicos_prestados FOR UPDATE USING (
  EXISTS (SELECT 1 FROM clientes WHERE clientes.id = servicos_prestados.cliente_id AND clientes.responsavel_id = auth.uid() AND clientes.deleted_at IS NULL)
  AND servicos_prestados.deleted_at IS NULL
);

-- SERVICOS (cadastro mestre, sem cliente_id)
DROP POLICY IF EXISTS "servicos_select_authenticated" ON servicos;
CREATE POLICY "servicos_select_authenticated" ON servicos FOR SELECT USING (auth.role() = 'authenticated' AND deleted_at IS NULL);

DROP POLICY IF EXISTS "servicos_insert_admin" ON servicos;
CREATE POLICY "servicos_insert_admin" ON servicos FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "servicos_update_admin" ON servicos;
CREATE POLICY "servicos_update_admin" ON servicos FOR UPDATE USING (
  EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "servicos_delete_admin" ON servicos;
CREATE POLICY "servicos_delete_admin" ON servicos FOR DELETE USING (
  EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role = 'admin')
);

-- PLANOS
DROP POLICY IF EXISTS "planos_select_authenticated" ON planos;
CREATE POLICY "planos_select_authenticated" ON planos FOR SELECT USING (auth.role() = 'authenticated' AND deleted_at IS NULL);

DROP POLICY IF EXISTS "planos_insert_admin" ON planos;
CREATE POLICY "planos_insert_admin" ON planos FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "planos_update_admin" ON planos;
CREATE POLICY "planos_update_admin" ON planos FOR UPDATE USING (
  EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "planos_delete_admin" ON planos;
CREATE POLICY "planos_delete_admin" ON planos FOR DELETE USING (
  EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role = 'admin')
);

-- PLANO_SERVICOS
DROP POLICY IF EXISTS "plano_servicos_select_authenticated" ON plano_servicos;
CREATE POLICY "plano_servicos_select_authenticated" ON plano_servicos FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "plano_servicos_all_admin" ON plano_servicos;
CREATE POLICY "plano_servicos_all_admin" ON plano_servicos FOR ALL USING (
  EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role = 'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role = 'admin')
);

-- CLIENTE_PLANOS
DROP POLICY IF EXISTS "cliente_planos_select" ON cliente_planos;
CREATE POLICY "cliente_planos_select" ON cliente_planos FOR SELECT USING (
  (EXISTS (SELECT 1 FROM clientes WHERE clientes.id = cliente_planos.cliente_id AND clientes.responsavel_id = auth.uid() AND clientes.deleted_at IS NULL)
   OR EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role = 'admin'))
  AND cliente_planos.deleted_at IS NULL
);

DROP POLICY IF EXISTS "cliente_planos_insert" ON cliente_planos;
CREATE POLICY "cliente_planos_insert" ON cliente_planos FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM clientes WHERE clientes.id = cliente_planos.cliente_id AND clientes.responsavel_id = auth.uid() AND clientes.deleted_at IS NULL)
  OR EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "cliente_planos_update" ON cliente_planos;
CREATE POLICY "cliente_planos_update" ON cliente_planos FOR UPDATE USING (
  EXISTS (SELECT 1 FROM clientes WHERE clientes.id = cliente_planos.cliente_id AND clientes.responsavel_id = auth.uid() AND clientes.deleted_at IS NULL)
  OR EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role = 'admin')
);

-- CLIENTE_SERVICOS
DROP POLICY IF EXISTS "cliente_servicos_select" ON cliente_servicos;
CREATE POLICY "cliente_servicos_select" ON cliente_servicos FOR SELECT USING (
  (EXISTS (SELECT 1 FROM clientes WHERE clientes.id = cliente_servicos.cliente_id AND clientes.responsavel_id = auth.uid() AND clientes.deleted_at IS NULL)
   OR EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role = 'admin'))
  AND cliente_servicos.deleted_at IS NULL
);

DROP POLICY IF EXISTS "cliente_servicos_insert" ON cliente_servicos;
CREATE POLICY "cliente_servicos_insert" ON cliente_servicos FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM clientes WHERE clientes.id = cliente_servicos.cliente_id AND clientes.responsavel_id = auth.uid() AND clientes.deleted_at IS NULL)
  OR EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "cliente_servicos_update" ON cliente_servicos;
CREATE POLICY "cliente_servicos_update" ON cliente_servicos FOR UPDATE USING (
  EXISTS (SELECT 1 FROM clientes WHERE clientes.id = cliente_servicos.cliente_id AND clientes.responsavel_id = auth.uid() AND clientes.deleted_at IS NULL)
  OR EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role = 'admin')
);

-- TRANSACOES
DROP POLICY IF EXISTS "transacoes_select" ON transacoes;
CREATE POLICY "transacoes_select" ON transacoes FOR SELECT USING (
  EXISTS (SELECT 1 FROM clientes WHERE clientes.id = transacoes.cliente_id AND clientes.responsavel_id = auth.uid() AND clientes.deleted_at IS NULL)
  AND transacoes.deleted_at IS NULL
);

DROP POLICY IF EXISTS "transacoes_insert" ON transacoes;
CREATE POLICY "transacoes_insert" ON transacoes FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM clientes WHERE clientes.id = transacoes.cliente_id AND clientes.responsavel_id = auth.uid() AND clientes.deleted_at IS NULL)
);

DROP POLICY IF EXISTS "transacoes_update" ON transacoes;
CREATE POLICY "transacoes_update" ON transacoes FOR UPDATE USING (
  EXISTS (SELECT 1 FROM clientes WHERE clientes.id = transacoes.cliente_id AND clientes.responsavel_id = auth.uid() AND clientes.deleted_at IS NULL)
  AND transacoes.deleted_at IS NULL
);

-- OCORRENCIA_GRUPOS
DROP POLICY IF EXISTS "ocorrencia_grupos_select" ON ocorrencia_grupos;
CREATE POLICY "ocorrencia_grupos_select" ON ocorrencia_grupos FOR SELECT USING (responsavel_id = auth.uid() AND is_active = true);

DROP POLICY IF EXISTS "ocorrencia_grupos_insert" ON ocorrencia_grupos;
CREATE POLICY "ocorrencia_grupos_insert" ON ocorrencia_grupos FOR INSERT WITH CHECK (responsavel_id = auth.uid());

DROP POLICY IF EXISTS "ocorrencia_grupos_update" ON ocorrencia_grupos;
CREATE POLICY "ocorrencia_grupos_update" ON ocorrencia_grupos FOR UPDATE USING (responsavel_id = auth.uid());

-- OCORRENCIA_TIPOS
DROP POLICY IF EXISTS "ocorrencia_tipos_select" ON ocorrencia_tipos;
CREATE POLICY "ocorrencia_tipos_select" ON ocorrencia_tipos FOR SELECT USING (responsavel_id = auth.uid() AND is_active = true);

DROP POLICY IF EXISTS "ocorrencia_tipos_insert" ON ocorrencia_tipos;
CREATE POLICY "ocorrencia_tipos_insert" ON ocorrencia_tipos FOR INSERT WITH CHECK (responsavel_id = auth.uid());

DROP POLICY IF EXISTS "ocorrencia_tipos_update" ON ocorrencia_tipos;
CREATE POLICY "ocorrencia_tipos_update" ON ocorrencia_tipos FOR UPDATE USING (responsavel_id = auth.uid());

-- OCORRENCIAS
DROP POLICY IF EXISTS "ocorrencias_select" ON ocorrencias;
CREATE POLICY "ocorrencias_select" ON ocorrencias FOR SELECT USING (
  EXISTS (SELECT 1 FROM clientes WHERE clientes.id = ocorrencias.cliente_id AND clientes.responsavel_id = auth.uid() AND clientes.deleted_at IS NULL)
  AND ocorrencias.deleted_at IS NULL
);

DROP POLICY IF EXISTS "ocorrencias_insert" ON ocorrencias;
CREATE POLICY "ocorrencias_insert" ON ocorrencias FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM clientes WHERE clientes.id = ocorrencias.cliente_id AND clientes.responsavel_id = auth.uid() AND clientes.deleted_at IS NULL)
  AND ocorrencias.responsavel_id = auth.uid()
);

DROP POLICY IF EXISTS "ocorrencias_update" ON ocorrencias;
CREATE POLICY "ocorrencias_update" ON ocorrencias FOR UPDATE USING (
  EXISTS (SELECT 1 FROM clientes WHERE clientes.id = ocorrencias.cliente_id AND clientes.responsavel_id = auth.uid() AND clientes.deleted_at IS NULL)
  AND ocorrencias.responsavel_id = auth.uid()
  AND ocorrencias.deleted_at IS NULL
);

-- ATENDIMENTOS
DROP POLICY IF EXISTS "atendimentos_select" ON atendimentos;
CREATE POLICY "atendimentos_select" ON atendimentos FOR SELECT USING (
  EXISTS (SELECT 1 FROM clientes WHERE clientes.id = atendimentos.cliente_id AND clientes.responsavel_id = auth.uid() AND clientes.deleted_at IS NULL)
  AND atendimentos.deleted_at IS NULL
);

DROP POLICY IF EXISTS "atendimentos_insert" ON atendimentos;
CREATE POLICY "atendimentos_insert" ON atendimentos FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM clientes WHERE clientes.id = atendimentos.cliente_id AND clientes.responsavel_id = auth.uid() AND clientes.deleted_at IS NULL)
  AND atendimentos.usuario_id = auth.uid()
);

DROP POLICY IF EXISTS "atendimentos_update" ON atendimentos;
CREATE POLICY "atendimentos_update" ON atendimentos FOR UPDATE USING (
  EXISTS (SELECT 1 FROM clientes WHERE clientes.id = atendimentos.cliente_id AND clientes.responsavel_id = auth.uid() AND clientes.deleted_at IS NULL)
  AND atendimentos.usuario_id = auth.uid()
  AND atendimentos.deleted_at IS NULL
);

-- EQUIPE_MEMBROS
DROP POLICY IF EXISTS "equipe_membros_select" ON equipe_membros;
CREATE POLICY "equipe_membros_select" ON equipe_membros FOR SELECT USING (responsavel_id = auth.uid() AND deleted_at IS NULL);

DROP POLICY IF EXISTS "equipe_membros_insert" ON equipe_membros;
CREATE POLICY "equipe_membros_insert" ON equipe_membros FOR INSERT WITH CHECK (responsavel_id = auth.uid());

DROP POLICY IF EXISTS "equipe_membros_update" ON equipe_membros;
CREATE POLICY "equipe_membros_update" ON equipe_membros FOR UPDATE USING (responsavel_id = auth.uid() AND deleted_at IS NULL);

-- CLIENTE_RESPONSAVEIS
DROP POLICY IF EXISTS "cliente_responsaveis_select" ON cliente_responsaveis;
CREATE POLICY "cliente_responsaveis_select" ON cliente_responsaveis FOR SELECT USING (
  EXISTS (SELECT 1 FROM clientes WHERE clientes.id = cliente_responsaveis.cliente_id AND clientes.responsavel_id = auth.uid() AND clientes.deleted_at IS NULL)
  AND cliente_responsaveis.deleted_at IS NULL
);

DROP POLICY IF EXISTS "cliente_responsaveis_insert" ON cliente_responsaveis;
CREATE POLICY "cliente_responsaveis_insert" ON cliente_responsaveis FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM clientes WHERE clientes.id = cliente_responsaveis.cliente_id AND clientes.responsavel_id = auth.uid() AND clientes.deleted_at IS NULL)
);

DROP POLICY IF EXISTS "cliente_responsaveis_update" ON cliente_responsaveis;
CREATE POLICY "cliente_responsaveis_update" ON cliente_responsaveis FOR UPDATE USING (
  EXISTS (SELECT 1 FROM clientes WHERE clientes.id = cliente_responsaveis.cliente_id AND clientes.responsavel_id = auth.uid() AND clientes.deleted_at IS NULL)
  AND cliente_responsaveis.deleted_at IS NULL
);

-- CONTRATO_STATUS_HISTORICO
DROP POLICY IF EXISTS "contrato_status_historico_select" ON contrato_status_historico;
CREATE POLICY "contrato_status_historico_select" ON contrato_status_historico FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM usuarios u WHERE u.id = auth.uid() AND (
      u.role = 'admin'
      OR EXISTS (
        SELECT 1 FROM clientes c WHERE (
          (tipo_contrato = 'plano' AND c.id IN (SELECT cliente_id FROM cliente_planos WHERE id = contrato_status_historico.contrato_id))
          OR (tipo_contrato = 'servico' AND c.id IN (SELECT cliente_id FROM cliente_servicos WHERE id = contrato_status_historico.contrato_id))
        ) AND c.responsavel_id = u.id AND c.deleted_at IS NULL
      )
    )
  )
);

DROP POLICY IF EXISTS "contrato_status_historico_insert" ON contrato_status_historico;
CREATE POLICY "contrato_status_historico_insert" ON contrato_status_historico FOR INSERT WITH CHECK (true);

-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================
