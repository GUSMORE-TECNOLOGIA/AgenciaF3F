-- Perfil Financeiro: permissão "Super Edit" em planos (valor, datas).
-- Usuários com perfil financeiro (ex.: Arthur) podem editar valor e datas;
-- gestores/gerentes apenas troca de status e solicitação.

INSERT INTO perfis (id, nome, descricao, slug) VALUES
  ('a0000000-0000-0000-0000-000000000005'::UUID, 'Financeiro', 'Super edição de planos e valores (valor, datas)', 'financeiro')
ON CONFLICT (slug) DO NOTHING;

-- Perfil financeiro: visualizar e editar em todos os módulos (como gerente), sem excluir em equipe
WITH modulos AS (
  SELECT unnest(ARRAY['dashboard','clientes','servicos','planos','financeiro','ocorrencias','atendimento','equipe']) AS modulo
)
INSERT INTO perfil_permissoes (perfil_id, modulo, pode_visualizar, pode_editar, pode_excluir)
SELECT p.id, m.modulo, true, true,
  CASE WHEN m.modulo = 'equipe' THEN false ELSE true END
FROM perfis p CROSS JOIN modulos m
WHERE p.slug = 'financeiro'
ON CONFLICT (perfil_id, modulo) DO UPDATE SET
  pode_visualizar = EXCLUDED.pode_visualizar,
  pode_editar = EXCLUDED.pode_editar,
  pode_excluir = EXCLUDED.pode_excluir;

COMMENT ON TABLE perfis IS 'Perfis de acesso; financeiro = Super Edit em planos (valor, datas).';
