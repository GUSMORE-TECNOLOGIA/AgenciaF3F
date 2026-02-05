-- Módulo de Perfis e Permissões
-- Perfil é a chave de segurança: cada usuário é vinculado a um perfil que define
-- visualizar, editar e excluir por módulo (Dashboard, Clientes, Serviços, Planos, Financeiro, Ocorrências, Atendimento, Equipe).

-- ============================================================================
-- TABELA PERFIS
-- ============================================================================
CREATE TABLE IF NOT EXISTS perfis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  slug TEXT, -- ex: admin, gerente, agente, suporte (compatibilidade)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(slug)
);

CREATE TRIGGER update_perfis_updated_at BEFORE UPDATE ON perfis
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABELA PERFIL_PERMISSOES (uma linha por perfil + módulo)
-- ============================================================================
CREATE TABLE IF NOT EXISTS perfil_permissoes (
  perfil_id UUID NOT NULL REFERENCES perfis(id) ON DELETE CASCADE,
  modulo TEXT NOT NULL CHECK (modulo IN (
    'dashboard', 'clientes', 'servicos', 'planos', 'financeiro', 'ocorrencias', 'atendimento', 'equipe'
  )),
  pode_visualizar BOOLEAN NOT NULL DEFAULT false,
  pode_editar BOOLEAN NOT NULL DEFAULT false,
  pode_excluir BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (perfil_id, modulo)
);

CREATE TRIGGER update_perfil_permissoes_updated_at BEFORE UPDATE ON perfil_permissoes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_perfil_permissoes_perfil ON perfil_permissoes(perfil_id);

-- ============================================================================
-- PERFIS INICIAIS
-- ============================================================================
INSERT INTO perfis (id, nome, descricao, slug) VALUES
  ('a0000000-0000-0000-0000-000000000001'::UUID, 'Administrador', 'Acesso total ao sistema', 'admin'),
  ('a0000000-0000-0000-0000-000000000002'::UUID, 'Gerente', 'Gestão operacional e relatórios', 'gerente'),
  ('a0000000-0000-0000-0000-000000000003'::UUID, 'Agente', 'Atendimento e operação do dia a dia', 'agente'),
  ('a0000000-0000-0000-0000-000000000004'::UUID, 'Suporte', 'Visualização e suporte limitado', 'suporte')
ON CONFLICT (id) DO NOTHING;

-- Permissões: Administrador e Gerente = tudo; Agente = ver/editar (sem excluir em equipe); Suporte = só visualizar
WITH modulos AS (
  SELECT unnest(ARRAY['dashboard','clientes','servicos','planos','financeiro','ocorrencias','atendimento','equipe']) AS modulo
)
INSERT INTO perfil_permissoes (perfil_id, modulo, pode_visualizar, pode_editar, pode_excluir)
SELECT p.id, m.modulo, true, true, true
FROM perfis p CROSS JOIN modulos m
WHERE p.slug = 'admin'
ON CONFLICT (perfil_id, modulo) DO UPDATE SET pode_visualizar = true, pode_editar = true, pode_excluir = true;

WITH modulos AS (
  SELECT unnest(ARRAY['dashboard','clientes','servicos','planos','financeiro','ocorrencias','atendimento','equipe']) AS modulo
)
INSERT INTO perfil_permissoes (perfil_id, modulo, pode_visualizar, pode_editar, pode_excluir)
SELECT p.id, m.modulo, true, true, true
FROM perfis p CROSS JOIN modulos m
WHERE p.slug = 'gerente'
ON CONFLICT (perfil_id, modulo) DO UPDATE SET pode_visualizar = true, pode_editar = true, pode_excluir = true;

WITH modulos AS (
  SELECT unnest(ARRAY['dashboard','clientes','servicos','planos','financeiro','ocorrencias','atendimento','equipe']) AS modulo
)
INSERT INTO perfil_permissoes (perfil_id, modulo, pode_visualizar, pode_editar, pode_excluir)
SELECT p.id, m.modulo, true, true,
  CASE WHEN m.modulo = 'equipe' THEN false ELSE true END
FROM perfis p CROSS JOIN modulos m
WHERE p.slug = 'agente'
ON CONFLICT (perfil_id, modulo) DO UPDATE SET
  pode_visualizar = EXCLUDED.pode_visualizar,
  pode_editar = EXCLUDED.pode_editar,
  pode_excluir = EXCLUDED.pode_excluir;

WITH modulos AS (
  SELECT unnest(ARRAY['dashboard','clientes','servicos','planos','financeiro','ocorrencias','atendimento','equipe']) AS modulo
)
INSERT INTO perfil_permissoes (perfil_id, modulo, pode_visualizar, pode_editar, pode_excluir)
SELECT p.id, m.modulo, true, false, false
FROM perfis p CROSS JOIN modulos m
WHERE p.slug = 'suporte'
ON CONFLICT (perfil_id, modulo) DO UPDATE SET pode_visualizar = true, pode_editar = false, pode_excluir = false;

-- ============================================================================
-- USUARIOS: adicionar perfil_id e backfill a partir de perfil (slug)
-- ============================================================================
ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS perfil_id UUID REFERENCES perfis(id) ON DELETE SET NULL;

UPDATE public.usuarios u
SET perfil_id = p.id
FROM perfis p
WHERE p.slug = u.perfil AND u.perfil_id IS NULL;

-- ============================================================================
-- RLS PERFIS E PERFIL_PERMISSOES
-- ============================================================================
ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfil_permissoes ENABLE ROW LEVEL SECURITY;

-- Leituras: qualquer usuário autenticado pode ler perfis e permissões (para dropdown e checagem de permissão)
CREATE POLICY "Autenticados podem ler perfis"
  ON perfis FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Autenticados podem ler perfil_permissoes"
  ON perfil_permissoes FOR SELECT TO authenticated
  USING (true);

-- Escrita: apenas admin (role = 'admin' ou perfil = 'admin') pode criar/atualizar/excluir perfis
CREATE POLICY "Admin pode inserir perfis"
  ON perfis FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin pode atualizar perfis"
  ON perfis FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin pode excluir perfis"
  ON perfis FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin pode inserir perfil_permissoes"
  ON perfil_permissoes FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin pode atualizar perfil_permissoes"
  ON perfil_permissoes FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin pode excluir perfil_permissoes"
  ON perfil_permissoes FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================================
-- USUARIOS: política para admin atualizar perfil_id de qualquer usuário
-- ============================================================================
-- (UPDATE em usuarios já existe "Usuários podem atualizar próprio perfil"; precisamos permitir admin atualizar outros)
-- Criar política adicional: admin pode atualizar qualquer usuario (pelo menos perfil_id)
DROP POLICY IF EXISTS "Usuários podem atualizar próprio perfil" ON usuarios;
CREATE POLICY "Usuários podem atualizar próprio perfil"
  ON usuarios FOR UPDATE TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admin pode atualizar qualquer usuario"
  ON usuarios FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND role = 'admin')
  );

-- Garantir que leitura de usuarios para listar equipe seja possível para admin
-- (já existe SELECT próprio; para listar todos precisamos de política para admin)
DROP POLICY IF EXISTS "Admin pode ver todos usuarios" ON usuarios;
CREATE POLICY "Admin pode ver todos usuarios"
  ON usuarios FOR SELECT TO authenticated
  USING (
    auth.uid() = id OR
    EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

COMMENT ON TABLE perfis IS 'Perfis de acesso; cada usuário é vinculado a um perfil que define permissões por módulo';
COMMENT ON TABLE perfil_permissoes IS 'Permissões por perfil e módulo: visualizar, editar, excluir';
