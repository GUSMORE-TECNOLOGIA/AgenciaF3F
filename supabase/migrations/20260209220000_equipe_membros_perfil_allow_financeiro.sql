-- Perfil "Financeiro" existe em perfis e no front; a constraint em equipe_membros
-- só permitia admin, gerente, agente, suporte. UPDATE com perfil = 'financeiro' falhava,
-- então a lista continuava mostrando "agente" e ao reabrir o form o estado ficava inconsistente.

ALTER TABLE public.equipe_membros
  DROP CONSTRAINT IF EXISTS equipe_membros_perfil_check;

ALTER TABLE public.equipe_membros
  ADD CONSTRAINT equipe_membros_perfil_check
  CHECK (perfil = ANY (ARRAY['admin'::text, 'gerente'::text, 'agente'::text, 'suporte'::text, 'financeiro'::text]));
