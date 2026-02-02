-- Criar tabela para links dinâmicos dos clientes
-- Permite múltiplos links do mesmo tipo com classificação, pessoa e status

CREATE TABLE IF NOT EXISTS cliente_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  tipo TEXT NOT NULL, -- Classificação: Instagram, Facebook, Dashboard, etc.
  pessoa TEXT, -- Pessoa responsável pelo link (opcional)
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_cliente_links_cliente_id ON cliente_links(cliente_id);
CREATE INDEX IF NOT EXISTS idx_cliente_links_tipo ON cliente_links(tipo);
CREATE INDEX IF NOT EXISTS idx_cliente_links_status ON cliente_links(status);
CREATE INDEX IF NOT EXISTS idx_cliente_links_deleted_at ON cliente_links(deleted_at) WHERE deleted_at IS NULL;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_cliente_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_cliente_links_updated_at ON cliente_links;
CREATE TRIGGER trigger_update_cliente_links_updated_at
  BEFORE UPDATE ON cliente_links
  FOR EACH ROW
  EXECUTE FUNCTION update_cliente_links_updated_at();

-- RLS Policies
ALTER TABLE cliente_links ENABLE ROW LEVEL SECURITY;

-- Policy para SELECT: responsável ou admin
DROP POLICY IF EXISTS "cliente_links_select_responsavel" ON cliente_links;
CREATE POLICY "cliente_links_select_responsavel" ON cliente_links
  FOR SELECT USING (
    (
      EXISTS (
        SELECT 1 FROM clientes c
        WHERE c.id = cliente_links.cliente_id
        AND c.responsavel_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM usuarios u
        WHERE u.id = auth.uid() AND u.role = 'admin'
      )
    )
    AND deleted_at IS NULL
  );

-- Policy para INSERT: responsável ou admin
DROP POLICY IF EXISTS "cliente_links_insert_responsavel" ON cliente_links;
CREATE POLICY "cliente_links_insert_responsavel" ON cliente_links
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM clientes c
      WHERE c.id = cliente_links.cliente_id
      AND c.responsavel_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Policy para UPDATE: responsável ou admin
DROP POLICY IF EXISTS "cliente_links_update_responsavel" ON cliente_links;
CREATE POLICY "cliente_links_update_responsavel" ON cliente_links
  FOR UPDATE USING (
    (
      EXISTS (
        SELECT 1 FROM clientes c
        WHERE c.id = cliente_links.cliente_id
        AND c.responsavel_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM usuarios u
        WHERE u.id = auth.uid() AND u.role = 'admin'
      )
    )
    AND deleted_at IS NULL
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clientes c
      WHERE c.id = cliente_links.cliente_id
      AND c.responsavel_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Policy para DELETE: responsável ou admin (soft delete)
DROP POLICY IF EXISTS "cliente_links_delete_responsavel" ON cliente_links;
CREATE POLICY "cliente_links_delete_responsavel" ON cliente_links
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM clientes c
      WHERE c.id = cliente_links.cliente_id
      AND c.responsavel_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Migrar dados existentes de links_uteis (JSONB) para a nova tabela (idempotente)
DO $$
DECLARE
  cliente_record RECORD;
  link_value TEXT;
BEGIN
  FOR cliente_record IN
    SELECT id, links_uteis
    FROM clientes
    WHERE links_uteis IS NOT NULL AND links_uteis::text != '{}'
  LOOP
    -- Conta de Anúncio - F3F
    link_value := cliente_record.links_uteis->>'conta_anuncio_f3f';
    IF link_value IS NOT NULL AND link_value != '' AND NOT EXISTS (SELECT 1 FROM cliente_links WHERE cliente_id = cliente_record.id AND tipo = 'Conta de Anúncio - F3F' AND url = link_value AND deleted_at IS NULL) THEN
      INSERT INTO cliente_links (cliente_id, url, tipo, pessoa, status) VALUES (cliente_record.id, link_value, 'Conta de Anúncio - F3F', NULL, 'ativo');
    END IF;
    -- Conta de Anúncio - L.T
    link_value := cliente_record.links_uteis->>'conta_anuncio_lt';
    IF link_value IS NOT NULL AND link_value != '' AND NOT EXISTS (SELECT 1 FROM cliente_links WHERE cliente_id = cliente_record.id AND tipo = 'Conta de Anúncio - L.T' AND url = link_value AND deleted_at IS NULL) THEN
      INSERT INTO cliente_links (cliente_id, url, tipo, pessoa, status) VALUES (cliente_record.id, link_value, 'Conta de Anúncio - L.T', NULL, 'ativo');
    END IF;
    -- Instagram
    link_value := cliente_record.links_uteis->>'instagram';
    IF link_value IS NOT NULL AND link_value != '' AND NOT EXISTS (SELECT 1 FROM cliente_links WHERE cliente_id = cliente_record.id AND tipo = 'Instagram' AND url = link_value AND deleted_at IS NULL) THEN
      INSERT INTO cliente_links (cliente_id, url, tipo, pessoa, status) VALUES (cliente_record.id, link_value, 'Instagram', NULL, 'ativo');
    END IF;
    -- Business Suite
    link_value := cliente_record.links_uteis->>'business_suite';
    IF link_value IS NOT NULL AND link_value != '' AND NOT EXISTS (SELECT 1 FROM cliente_links WHERE cliente_id = cliente_record.id AND tipo = 'Business Suite' AND url = link_value AND deleted_at IS NULL) THEN
      INSERT INTO cliente_links (cliente_id, url, tipo, pessoa, status) VALUES (cliente_record.id, link_value, 'Business Suite', NULL, 'ativo');
    END IF;
    -- Dashboard
    link_value := cliente_record.links_uteis->>'dashboard';
    IF link_value IS NOT NULL AND link_value != '' AND NOT EXISTS (SELECT 1 FROM cliente_links WHERE cliente_id = cliente_record.id AND tipo = 'Dashboard' AND url = link_value AND deleted_at IS NULL) THEN
      INSERT INTO cliente_links (cliente_id, url, tipo, pessoa, status) VALUES (cliente_record.id, link_value, 'Dashboard', NULL, 'ativo');
    END IF;
    -- Planilha de Dados
    link_value := cliente_record.links_uteis->>'planilha_dados';
    IF link_value IS NOT NULL AND link_value != '' AND NOT EXISTS (SELECT 1 FROM cliente_links WHERE cliente_id = cliente_record.id AND tipo = 'Planilha de Dados' AND url = link_value AND deleted_at IS NULL) THEN
      INSERT INTO cliente_links (cliente_id, url, tipo, pessoa, status) VALUES (cliente_record.id, link_value, 'Planilha de Dados', NULL, 'ativo');
    END IF;
    -- UTMify
    link_value := cliente_record.links_uteis->>'utmify';
    IF link_value IS NOT NULL AND link_value != '' AND NOT EXISTS (SELECT 1 FROM cliente_links WHERE cliente_id = cliente_record.id AND tipo = 'UTMify' AND url = link_value AND deleted_at IS NULL) THEN
      INSERT INTO cliente_links (cliente_id, url, tipo, pessoa, status) VALUES (cliente_record.id, link_value, 'UTMify', NULL, 'ativo');
    END IF;
    -- WordPress
    link_value := cliente_record.links_uteis->>'wordpress';
    IF link_value IS NOT NULL AND link_value != '' AND NOT EXISTS (SELECT 1 FROM cliente_links WHERE cliente_id = cliente_record.id AND tipo = 'WordPress' AND url = link_value AND deleted_at IS NULL) THEN
      INSERT INTO cliente_links (cliente_id, url, tipo, pessoa, status) VALUES (cliente_record.id, link_value, 'WordPress', NULL, 'ativo');
    END IF;
    -- Página de Vendas - L.T
    link_value := cliente_record.links_uteis->>'pagina_vendas_lt';
    IF link_value IS NOT NULL AND link_value != '' AND NOT EXISTS (SELECT 1 FROM cliente_links WHERE cliente_id = cliente_record.id AND tipo = 'Página de Vendas - L.T' AND url = link_value AND deleted_at IS NULL) THEN
      INSERT INTO cliente_links (cliente_id, url, tipo, pessoa, status) VALUES (cliente_record.id, link_value, 'Página de Vendas - L.T', NULL, 'ativo');
    END IF;
    -- Checkout
    link_value := cliente_record.links_uteis->>'checkout';
    IF link_value IS NOT NULL AND link_value != '' AND NOT EXISTS (SELECT 1 FROM cliente_links WHERE cliente_id = cliente_record.id AND tipo = 'Checkout' AND url = link_value AND deleted_at IS NULL) THEN
      INSERT INTO cliente_links (cliente_id, url, tipo, pessoa, status) VALUES (cliente_record.id, link_value, 'Checkout', NULL, 'ativo');
    END IF;
  END LOOP;
END $$;

-- Comentários
COMMENT ON TABLE cliente_links IS 'Links dinâmicos dos clientes, permitindo múltiplos links do mesmo tipo';
COMMENT ON COLUMN cliente_links.tipo IS 'Classificação do link (ex: Instagram, Facebook, Dashboard)';
COMMENT ON COLUMN cliente_links.pessoa IS 'Pessoa responsável pelo link (opcional)';
COMMENT ON COLUMN cliente_links.status IS 'Status do link: ativo ou inativo';
