-- O perfil "financeiro" foi adicionado em 20260209140000_perfil_financeiro.sql
-- e o constraint de equipe_membros foi atualizado em 20260209220000.
-- O constraint de usuarios nunca foi atualizado, causando erro ao criar
-- um novo membro com perfil financeiro (usuarios_perfil_check violation).

ALTER TABLE public.usuarios
  DROP CONSTRAINT IF EXISTS usuarios_perfil_check;

ALTER TABLE public.usuarios
  ADD CONSTRAINT usuarios_perfil_check
  CHECK (perfil = ANY (ARRAY['admin'::text, 'gerente'::text, 'agente'::text, 'suporte'::text, 'financeiro'::text]));
