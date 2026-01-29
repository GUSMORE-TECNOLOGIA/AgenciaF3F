-- Seed equipe: restante (usuários 2–11). Rafinha já em seed_equipe_usuarios.
-- Senha inicial: F3f@123trocar

-- rafhaelamorim2004@gmail.com -> Rafão
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', 'b14d6719-8e3c-4d27-a6d4-b54e3fbe988d', 'authenticated', 'authenticated', 'rafhaelamorim2004@gmail.com', crypt('F3f@123trocar', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES ('b14d6719-8e3c-4d27-a6d4-b54e3fbe988d', 'b14d6719-8e3c-4d27-a6d4-b54e3fbe988d', '{"sub":"b14d6719-8e3c-4d27-a6d4-b54e3fbe988d","email":"rafhaelamorim2004@gmail.com"}'::jsonb, 'email', 'b14d6719-8e3c-4d27-a6d4-b54e3fbe988d', NOW(), NOW(), NOW())
ON CONFLICT (provider, provider_id) DO NOTHING;
INSERT INTO public.usuarios (id, email, name, role, perfil, must_reset_password)
VALUES ('b14d6719-8e3c-4d27-a6d4-b54e3fbe988d', 'rafhaelamorim2004@gmail.com', 'Rafão', 'admin', 'admin', true)
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name, role = 'admin', perfil = EXCLUDED.perfil, updated_at = NOW();

-- lueluiz@hotmail.com -> Arthur
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', '6554877e-d60f-49e4-a3a0-50095db1c188', 'authenticated', 'authenticated', 'lueluiz@hotmail.com', crypt('F3f@123trocar', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES ('6554877e-d60f-49e4-a3a0-50095db1c188', '6554877e-d60f-49e4-a3a0-50095db1c188', '{"sub":"6554877e-d60f-49e4-a3a0-50095db1c188","email":"lueluiz@hotmail.com"}'::jsonb, 'email', '6554877e-d60f-49e4-a3a0-50095db1c188', NOW(), NOW(), NOW())
ON CONFLICT (provider, provider_id) DO NOTHING;
INSERT INTO public.usuarios (id, email, name, role, perfil, must_reset_password)
VALUES ('6554877e-d60f-49e4-a3a0-50095db1c188', 'lueluiz@hotmail.com', 'Arthur', 'admin', 'admin', true)
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name, role = 'admin', perfil = EXCLUDED.perfil, updated_at = NOW();

-- diogo.mktt@gmail.com -> Diogo
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', '3d6c747f-648b-4079-abba-7acb2b4a8f40', 'authenticated', 'authenticated', 'diogo.mktt@gmail.com', crypt('F3f@123trocar', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES ('3d6c747f-648b-4079-abba-7acb2b4a8f40', '3d6c747f-648b-4079-abba-7acb2b4a8f40', '{"sub":"3d6c747f-648b-4079-abba-7acb2b4a8f40","email":"diogo.mktt@gmail.com"}'::jsonb, 'email', '3d6c747f-648b-4079-abba-7acb2b4a8f40', NOW(), NOW(), NOW())
ON CONFLICT (provider, provider_id) DO NOTHING;
INSERT INTO public.usuarios (id, email, name, role, perfil, must_reset_password)
VALUES ('3d6c747f-648b-4079-abba-7acb2b4a8f40', 'diogo.mktt@gmail.com', 'Diogo', 'admin', 'admin', true)
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name, role = 'admin', perfil = EXCLUDED.perfil, updated_at = NOW();

-- joseyuriads@gmail.com -> Yuri
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', '4850d9f1-b726-4e28-abf2-bc052c7f7280', 'authenticated', 'authenticated', 'joseyuriads@gmail.com', crypt('F3f@123trocar', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES ('4850d9f1-b726-4e28-abf2-bc052c7f7280', '4850d9f1-b726-4e28-abf2-bc052c7f7280', '{"sub":"4850d9f1-b726-4e28-abf2-bc052c7f7280","email":"joseyuriads@gmail.com"}'::jsonb, 'email', '4850d9f1-b726-4e28-abf2-bc052c7f7280', NOW(), NOW(), NOW())
ON CONFLICT (provider, provider_id) DO NOTHING;
INSERT INTO public.usuarios (id, email, name, role, perfil, must_reset_password)
VALUES ('4850d9f1-b726-4e28-abf2-bc052c7f7280', 'joseyuriads@gmail.com', 'Yuri', 'admin', 'admin', true)
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name, role = 'admin', perfil = EXCLUDED.perfil, updated_at = NOW();

-- iloveyouuuudnz@gmail.com -> Denzel
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', 'aacf5da9-bbeb-403c-a904-bbb5327d725d', 'authenticated', 'authenticated', 'iloveyouuuudnz@gmail.com', crypt('F3f@123trocar', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES ('aacf5da9-bbeb-403c-a904-bbb5327d725d', 'aacf5da9-bbeb-403c-a904-bbb5327d725d', '{"sub":"aacf5da9-bbeb-403c-a904-bbb5327d725d","email":"iloveyouuuudnz@gmail.com"}'::jsonb, 'email', 'aacf5da9-bbeb-403c-a904-bbb5327d725d', NOW(), NOW(), NOW())
ON CONFLICT (provider, provider_id) DO NOTHING;
INSERT INTO public.usuarios (id, email, name, role, perfil, must_reset_password)
VALUES ('aacf5da9-bbeb-403c-a904-bbb5327d725d', 'iloveyouuuudnz@gmail.com', 'Denzel', 'admin', 'admin', true)
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name, role = 'admin', perfil = EXCLUDED.perfil, updated_at = NOW();

-- gabrielmazon1999@gmail.com -> Mazon
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', 'a0b72018-487f-46bb-a2ee-1555af126ada', 'authenticated', 'authenticated', 'gabrielmazon1999@gmail.com', crypt('F3f@123trocar', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES ('a0b72018-487f-46bb-a2ee-1555af126ada', 'a0b72018-487f-46bb-a2ee-1555af126ada', '{"sub":"a0b72018-487f-46bb-a2ee-1555af126ada","email":"gabrielmazon1999@gmail.com"}'::jsonb, 'email', 'a0b72018-487f-46bb-a2ee-1555af126ada', NOW(), NOW(), NOW())
ON CONFLICT (provider, provider_id) DO NOTHING;
INSERT INTO public.usuarios (id, email, name, role, perfil, must_reset_password)
VALUES ('a0b72018-487f-46bb-a2ee-1555af126ada', 'gabrielmazon1999@gmail.com', 'Mazon', 'admin', 'admin', true)
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name, role = 'admin', perfil = EXCLUDED.perfil, updated_at = NOW();

-- schmoellerpaulo@gmail.com -> Paulo
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', '12f0e55c-8c97-403d-a604-a54b129105db', 'authenticated', 'authenticated', 'schmoellerpaulo@gmail.com', crypt('F3f@123trocar', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES ('12f0e55c-8c97-403d-a604-a54b129105db', '12f0e55c-8c97-403d-a604-a54b129105db', '{"sub":"12f0e55c-8c97-403d-a604-a54b129105db","email":"schmoellerpaulo@gmail.com"}'::jsonb, 'email', '12f0e55c-8c97-403d-a604-a54b129105db', NOW(), NOW(), NOW())
ON CONFLICT (provider, provider_id) DO NOTHING;
INSERT INTO public.usuarios (id, email, name, role, perfil, must_reset_password)
VALUES ('12f0e55c-8c97-403d-a604-a54b129105db', 'schmoellerpaulo@gmail.com', 'Paulo', 'admin', 'admin', true)
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name, role = 'admin', perfil = EXCLUDED.perfil, updated_at = NOW();

-- lucasmaiasct2187@gmail.com -> Lucão
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', '554d1c77-64e9-42c0-a012-dc699acdebca', 'authenticated', 'authenticated', 'lucasmaiasct2187@gmail.com', crypt('F3f@123trocar', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES ('554d1c77-64e9-42c0-a012-dc699acdebca', '554d1c77-64e9-42c0-a012-dc699acdebca', '{"sub":"554d1c77-64e9-42c0-a012-dc699acdebca","email":"lucasmaiasct2187@gmail.com"}'::jsonb, 'email', '554d1c77-64e9-42c0-a012-dc699acdebca', NOW(), NOW(), NOW())
ON CONFLICT (provider, provider_id) DO NOTHING;
INSERT INTO public.usuarios (id, email, name, role, perfil, must_reset_password)
VALUES ('554d1c77-64e9-42c0-a012-dc699acdebca', 'lucasmaiasct2187@gmail.com', 'Lucão', 'admin', 'admin', true)
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name, role = 'admin', perfil = EXCLUDED.perfil, updated_at = NOW();

-- guilhermedgc22@gmail.com -> Gui Careca
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', '7f4b75a3-6389-4ff4-a086-dcd9778b2a3f', 'authenticated', 'authenticated', 'guilhermedgc22@gmail.com', crypt('F3f@123trocar', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES ('7f4b75a3-6389-4ff4-a086-dcd9778b2a3f', '7f4b75a3-6389-4ff4-a086-dcd9778b2a3f', '{"sub":"7f4b75a3-6389-4ff4-a086-dcd9778b2a3f","email":"guilhermedgc22@gmail.com"}'::jsonb, 'email', '7f4b75a3-6389-4ff4-a086-dcd9778b2a3f', NOW(), NOW(), NOW())
ON CONFLICT (provider, provider_id) DO NOTHING;
INSERT INTO public.usuarios (id, email, name, role, perfil, must_reset_password)
VALUES ('7f4b75a3-6389-4ff4-a086-dcd9778b2a3f', 'guilhermedgc22@gmail.com', 'Gui Careca', 'admin', 'admin', true)
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name, role = 'admin', perfil = EXCLUDED.perfil, updated_at = NOW();

-- guilherme.paula09@outlook.com -> Gonkas
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', '2cebb885-0be2-41e2-a980-a231923df1df', 'authenticated', 'authenticated', 'guilherme.paula09@outlook.com', crypt('F3f@123trocar', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES ('2cebb885-0be2-41e2-a980-a231923df1df', '2cebb885-0be2-41e2-a980-a231923df1df', '{"sub":"2cebb885-0be2-41e2-a980-a231923df1df","email":"guilherme.paula09@outlook.com"}'::jsonb, 'email', '2cebb885-0be2-41e2-a980-a231923df1df', NOW(), NOW(), NOW())
ON CONFLICT (provider, provider_id) DO NOTHING;
INSERT INTO public.usuarios (id, email, name, role, perfil, must_reset_password)
VALUES ('2cebb885-0be2-41e2-a980-a231923df1df', 'guilherme.paula09@outlook.com', 'Gonkas', 'admin', 'admin', true)
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name, role = 'admin', perfil = EXCLUDED.perfil, updated_at = NOW();
