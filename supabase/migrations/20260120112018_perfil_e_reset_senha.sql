-- Add perfil and password reset flags to usuarios
ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS perfil TEXT NOT NULL DEFAULT 'agente',
  ADD COLUMN IF NOT EXISTS must_reset_password BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS password_reset_at TIMESTAMPTZ;

ALTER TABLE public.usuarios
  DROP CONSTRAINT IF EXISTS usuarios_perfil_check;

ALTER TABLE public.usuarios
  ADD CONSTRAINT usuarios_perfil_check CHECK (perfil IN ('admin', 'gerente', 'agente', 'suporte'));

-- Evitar reset obrigatório para usuários já existentes
UPDATE public.usuarios
SET must_reset_password = false
WHERE must_reset_password = true;

-- Rename cargo to perfil on equipe_membros
ALTER TABLE public.equipe_membros
  RENAME COLUMN cargo TO perfil;

ALTER TABLE public.equipe_membros
  ALTER COLUMN perfil SET DEFAULT 'agente';

ALTER TABLE public.equipe_membros
  DROP CONSTRAINT IF EXISTS equipe_membros_cargo_check;

ALTER TABLE public.equipe_membros
  DROP CONSTRAINT IF EXISTS equipe_membros_perfil_check;

ALTER TABLE public.equipe_membros
  ADD CONSTRAINT equipe_membros_perfil_check CHECK (perfil IN ('admin', 'gerente', 'agente', 'suporte'));
