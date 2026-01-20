-- Migration: Criar Usuário Admin
-- Created: 15/01/2026 17:00:00
-- Description: Script para criar perfil do usuário admin após criação no Auth
-- 
-- IMPORTANTE: Execute este script APÓS criar o usuário no Authentication Dashboard
-- 
-- Passos:
-- 1. Acesse: https://app.supabase.com/project/rhnkffeyspymjpellmnd/auth/users
-- 2. Clique em "Add User"
-- 3. Preencha:
--    - Email: adm@agenciaf3f.com.br
--    - Password: adm@123
--    - Auto Confirm User: ✅ (marcar)
-- 4. Copie o User UID gerado
-- 5. Execute este script substituindo 'USER_ID_AQUI' pelo UID copiado

-- ============================================================================
-- CRIAR PERFIL ADMIN
-- ============================================================================

-- Opção 1: Se você já tem o User ID, substitua 'USER_ID_AQUI' abaixo
-- INSERT INTO public.usuarios (id, email, name, role)
-- VALUES ('USER_ID_AQUI', 'adm@agenciaf3f.com.br', 'Administrador', 'admin')
-- ON CONFLICT (id) DO UPDATE
-- SET email = EXCLUDED.email,
--     name = EXCLUDED.name,
--     role = 'admin',
--     updated_at = NOW();

-- Opção 2: Script automático que busca o usuário pelo email
DO $$
DECLARE
  user_id UUID;
BEGIN
  -- Buscar ID do usuário pelo email
  SELECT id INTO user_id
  FROM auth.users
  WHERE email = 'adm@agenciaf3f.com.br';
  
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado no auth.users. Por favor, crie o usuário primeiro via Dashboard: Authentication > Users > Add User';
  END IF;
  
  -- Criar perfil na tabela usuarios
  INSERT INTO public.usuarios (id, email, name, role)
  VALUES (user_id, 'adm@agenciaf3f.com.br', 'Administrador', 'admin')
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      name = EXCLUDED.name,
      role = 'admin',
      updated_at = NOW();
  
  RAISE NOTICE 'Perfil admin criado com sucesso para o usuário: %', user_id;
END $$;
