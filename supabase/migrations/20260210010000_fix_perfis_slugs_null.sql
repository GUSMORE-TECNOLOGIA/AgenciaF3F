-- BUG: Todos os perfis estavam com slug = NULL.
-- Causa: updatePerfil no frontend mandava slug: undefined → null, apagando o slug.
-- Isso quebrava is_admin() (depende de perfis.slug = 'admin') e o fallback de exibição na lista.

-- 1) Restaurar slugs dos perfis base
UPDATE perfis SET slug = 'admin'      WHERE id = 'a0000000-0000-0000-0000-000000000001' AND (slug IS NULL OR slug = '');
UPDATE perfis SET slug = 'gerente'    WHERE id = 'a0000000-0000-0000-0000-000000000002' AND (slug IS NULL OR slug = '');
UPDATE perfis SET slug = 'agente'     WHERE id = 'a0000000-0000-0000-0000-000000000003' AND (slug IS NULL OR slug = '');
UPDATE perfis SET slug = 'suporte'    WHERE id = 'a0000000-0000-0000-0000-000000000004' AND (slug IS NULL OR slug = '');
UPDATE perfis SET slug = 'financeiro' WHERE id = 'a0000000-0000-0000-0000-000000000005' AND (slug IS NULL OR slug = '');

-- 2) Trigger para impedir que slug dos perfis base seja apagado (SET NULL ou '')
CREATE OR REPLACE FUNCTION protect_perfil_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Se o perfil tinha slug preenchido e o novo valor é NULL ou vazio, manter o antigo
  IF OLD.slug IS NOT NULL AND OLD.slug <> '' AND (NEW.slug IS NULL OR NEW.slug = '') THEN
    NEW.slug := OLD.slug;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_perfil_slug_trigger ON perfis;
CREATE TRIGGER protect_perfil_slug_trigger
  BEFORE UPDATE ON perfis
  FOR EACH ROW
  EXECUTE FUNCTION protect_perfil_slug();

COMMENT ON FUNCTION protect_perfil_slug() IS 'Impede que o slug de um perfil seja apagado (NULL ou vazio) se já existia. Proteção contra bug de frontend.';
