-- Migrar drive_url existente para cliente_links como tipo "Google Drive"
DO $$
DECLARE
  cliente_record RECORD;
BEGIN
  FOR cliente_record IN
    SELECT c.id, c.drive_url
    FROM clientes c
    WHERE c.drive_url IS NOT NULL
    AND c.drive_url != ''
    AND NOT EXISTS (
      SELECT 1 FROM cliente_links cl
      WHERE cl.cliente_id = c.id
      AND cl.tipo = 'Google Drive'
      AND cl.deleted_at IS NULL
    )
  LOOP
    INSERT INTO cliente_links (cliente_id, url, tipo, pessoa, status)
    VALUES (cliente_record.id, cliente_record.drive_url, 'Google Drive', NULL, 'ativo')
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- Comentário explicativo
COMMENT ON COLUMN clientes.drive_url IS 'DEPRECATED: Use cliente_links com tipo "Google Drive" ao invés deste campo. Este campo será removido em versão futura.';

NOTIFY pgrst, 'reload schema';
