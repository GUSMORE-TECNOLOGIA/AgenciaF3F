---
name: F3F-novo-modulo
description: "Create a new module/area in F3F (AgenciaF3F): dashboard card, routes, menu, config (modulos-por-role, submodulos), scaffold (modules + pages). Orchestrates steps and can call other skills. Use when user says 'create module X' or 'novo módulo X'."
---

# F3F Novo módulo

Responsável por **criar um novo módulo/área** no F3F de forma consistente: **card no dashboard** (quando o projeto tiver), **rotas** (React Router), **menu** e sub-opções, **configurações** (modulos-por-role e submodulos quando existirem), mesma estrutura de pastas, uso de **entidades centrais** (sempre por ID), **auth único** e integração com o ecossistema. Esta skill **orquestra** o processo: conhece todos os passos e **pode chamar outras skills** (F3F-frontend, F3F-componentes, F3F-supabase-data-engineer, F3F-auth-rotas, F3F-documentacao, etc.) para implementar. Referências: [reference.md](reference.md), [project-overview.md](.context/docs/project-overview.md).

## Quando o usuário disser o nome do módulo

Sempre que o usuário usar esta skill informando o **nome do módulo** (ex.: "crie o módulo Atendimento", "novo módulo Clientes"), executar **todos** os passos do [reference.md](reference.md), na ordem, deixando a **fundação pronta**: card no dashboard (se existir), rotas, menu linkado, config atualizada, scaffold em `src/modules/<id>/` e página em `src/pages/`. Itens de menu podem ser placeholders até a definição final.

## Regra de ouro

- **Um módulo = um id** em minúsculo, kebab-case (ex.: `atendimento`, `clientes`). Esse id é usado em: `src/modules/<id>/`, rota `/<id>`, chave em modulos-por-role e submodulos-por-modulo (quando existirem).
- **Card no dashboard:** quando o projeto tiver dashboard com cards, listar módulos a partir da config (ex.: `src/lib/modulos-por-role.ts` ou equivalente). Todo novo módulo deve ser adicionado à config e ao menos um role. Ícones: adicionar ao componente de card se necessário.
- **Rotas:** criar página em `src/pages/<id>.tsx` ou `src/pages/<id>/index.tsx` (React Router). Sub-rotas `/<id>/<sub>` conforme padrão do projeto.
- **Menu:** quando existir config de menu (sidebar, submodulos-por-modulo), adicionar entrada para o novo módulo com ao menos um item (ex.: "Início" → `/<id>`).
- **Entidades centrais:** o módulo não cria cadastro próprio de cliente/usuário; referencia `cliente_id`, `user_id` ou `pessoa_id`. Auth e perfil: skill F3F-auth-rotas.
- **Documentação:** atualizar a tabela "Módulos criados" no [reference.md](reference.md) e, se mudar estrutura/escopo, índice em .context/docs.

## Quando usar esta skill

- O usuário diz **"novo módulo X"**, **"crie o módulo X"** ou **"F3F Novo módulo: X"** (X = nome do módulo).
- Adicionar um módulo novo à lista do app (card no dashboard, rotas, menu, config).
- Dúvida "como criar o módulo X no F3F?" ou "o que um novo módulo precisa ter?" → seguir o [reference.md](reference.md) e o checklist.

## Regras

- **Verificar nome antes de criar:** conferir se o id já existe em [reference.md](reference.md) (tabela "Módulos criados"), na config de módulos ou em `src/modules/` e `src/pages/`. Evitar duplicar.
- **Não duplicar entidades:** nunca criar tabela "cliente do módulo X"; usar FK para tabelas centrais.
- **Estrutura uniforme:** mesmo padrão de subpastas (services, repositories, components, entities, dtos) e de página inicial (header com "← Início", título do módulo) conforme padrão do projeto.
- **Registro:** atualizar a tabela "Módulos criados" no [reference.md](reference.md) logo após criar o módulo.

## Passos obrigatórios (resumo)

1. **Nome/id** – Normalizar nome do usuário para id (minúsculo, kebab-case). Verificar se já existe.
2. **Card no dashboard** – Quando existir modulos-por-role (ou equivalente): adicionar id, nome, href, descricao, icon. Se ícone novo: adicionar no componente de card.
3. **Rotas e scaffold** – Rodar script ou criar manualmente: `src/modules/<id>/` (services, repositories, entities, components, dtos) e página em `src/pages/<id>.tsx` ou `src/pages/<id>/index.tsx`.
4. **Menu (sub-opções)** – Se existir submodulos-por-modulo (ou equivalente), adicionar entrada para o novo módulo com ao menos um item (ex.: "Início" → `/<id>`).
5. **Banco (opcional)** – Se o módulo precisar de tabelas, delegar à skill F3F-supabase-data-engineer (tabelas + RLS, FK para entidades centrais).
6. **Documentação** – Atualizar tabela "Módulos criados" no reference.md; F3F-documentacao atualiza índice se necessário.

Detalhes e ordem completa: [reference.md](reference.md).

## Skills que esta skill pode chamar

- **F3F-frontend / F3F-componentes:** páginas, layout e componentes do módulo.
- **F3F-supabase-data-engineer:** tabelas e RLS do módulo (quando houver necessidade de banco).
- **F3F-backend:** services e repositories (após scaffold).
- **F3F-auth-rotas:** proteção de rotas e perfil de acesso ao módulo.
- **F3F-integracoes-vinculos:** contrato entre módulos/satélites, se aplicável.
- **F3F-organizar-repositorio:** mapa de diretórios e convenções.
- **F3F-documentacao:** project-overview, architecture, índice em .context/docs.
- **F3F-entidades-centrais:** só se for necessário nova entidade central (raro).

## Script de scaffold

`bash .cursor/skills/F3F-novo-modulo/scripts/create-module-full.sh <modulo>` cria `src/modules/<modulo>/` (services, repositories, entities, components, dtos) e página em `src/pages/<modulo>.tsx`. Rodar a partir da raiz do repositório. Após rodar, completar card no dashboard e config (modulos-por-role, submodulos se existir) e atualizar a tabela no reference.

## Referência adicional

- Checklist completo, estrutura e registro: [reference.md](reference.md).
- Lista de módulos e estrutura: [project-overview.md](.context/docs/project-overview.md); mapa de diretórios: [F3F-organizar-repositorio](.cursor/skills/F3F-organizar-repositorio/reference.md).
