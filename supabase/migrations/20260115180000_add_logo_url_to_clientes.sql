-- ============================================================================
-- ADICIONAR CAMPO logo_url NA TABELA clientes
-- ============================================================================
-- Adiciona campo para armazenar URL da logo do cliente (similar a photo_url em students)

ALTER TABLE clientes
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Comentário para documentação
COMMENT ON COLUMN clientes.logo_url IS 'URL da logo do cliente (armazenada no Supabase Storage ou externa)';
