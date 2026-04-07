-- Módulo Ads (Meta): incluir 'ads' no CHECK de perfil_permissoes e semear permissões por perfil.

ALTER TABLE public.perfil_permissoes DROP CONSTRAINT IF EXISTS perfil_permissoes_modulo_check;

ALTER TABLE public.perfil_permissoes ADD CONSTRAINT perfil_permissoes_modulo_check CHECK (modulo IN (
  'dashboard', 'clientes', 'servicos', 'planos', 'financeiro', 'ocorrencias', 'atendimento', 'equipe', 'ads'
));

-- Admin e Gerente: Ads completo
INSERT INTO public.perfil_permissoes (perfil_id, modulo, pode_visualizar, pode_editar, pode_excluir)
SELECT p.id, 'ads', true, true, true
FROM public.perfis p
WHERE p.slug IN ('admin', 'gerente')
ON CONFLICT (perfil_id, modulo) DO UPDATE SET
  pode_visualizar = EXCLUDED.pode_visualizar,
  pode_editar = EXCLUDED.pode_editar,
  pode_excluir = EXCLUDED.pode_excluir;

-- Agente: visualizar e editar (sem regra especial como em equipe)
INSERT INTO public.perfil_permissoes (perfil_id, modulo, pode_visualizar, pode_editar, pode_excluir)
SELECT p.id, 'ads', true, true, true
FROM public.perfis p
WHERE p.slug = 'agente'
ON CONFLICT (perfil_id, modulo) DO UPDATE SET
  pode_visualizar = EXCLUDED.pode_visualizar,
  pode_editar = EXCLUDED.pode_editar,
  pode_excluir = EXCLUDED.pode_excluir;

-- Suporte: só visualizar
INSERT INTO public.perfil_permissoes (perfil_id, modulo, pode_visualizar, pode_editar, pode_excluir)
SELECT p.id, 'ads', true, false, false
FROM public.perfis p
WHERE p.slug = 'suporte'
ON CONFLICT (perfil_id, modulo) DO UPDATE SET
  pode_visualizar = EXCLUDED.pode_visualizar,
  pode_editar = EXCLUDED.pode_editar,
  pode_excluir = EXCLUDED.pode_excluir;

-- Financeiro: mesmo padrão dos outros módulos (exceto equipe)
INSERT INTO public.perfil_permissoes (perfil_id, modulo, pode_visualizar, pode_editar, pode_excluir)
SELECT p.id, 'ads', true, true, true
FROM public.perfis p
WHERE p.slug = 'financeiro'
ON CONFLICT (perfil_id, modulo) DO UPDATE SET
  pode_visualizar = EXCLUDED.pode_visualizar,
  pode_editar = EXCLUDED.pode_editar,
  pode_excluir = EXCLUDED.pode_excluir;

COMMENT ON CONSTRAINT perfil_permissoes_modulo_check ON public.perfil_permissoes IS
  'Módulos válidos, incluindo ads (Meta Ads).';
