# Reutilização das skills SGT em outro projeto

> **Template:** Em uso para outro projeto, substitua refs em [PROJECT_INTEGRATIONS.md](PROJECT_INTEGRATIONS.md) e `.env` pelos do novo projeto (evitar que MCP e ferramentas apontem para o projeto errado).

Este documento analisa **quais skills do SGT podem ser aproveitadas em outro projeto** e **o que precisa ser alterado** em cada uma.

---

## Resumo executivo

| Conclusão | Detalhe |
|-----------|--------|
| **Podem ser aproveitadas?** | **Sim.** A maior parte das skills descreve **padrões de trabalho** (quem faz o quê, ordem, convenções) que são reaproveitáveis. |
| **Precisam de alteração?** | **Sim, em graus diferentes.** Nenhuma está 100% “plug and play”; todas referenciam “SGT”, caminhos (`.context/docs`, `src/modules`) e, em alguns casos, domínio (aluno, pessoa, módulos do HUB). |
| **O que muda entre projetos?** | Nome do projeto, mapa de skills, caminhos de pastas, stack (se diferente) e, nas mais ligadas ao domínio, entidades e fluxos. |

---

## Classificação por esforço de adaptação

### 1. Baixo esforço (poucas alterações)

Essas skills são **quase genéricas**: trocar “SGT” pelo nome do novo projeto e ajustar caminhos (ex.: `.context/docs` → o que o novo projeto usar).

| Skill | Por que é fácil | O que ajustar |
|-------|-----------------|---------------|
| **sgt-limpeza-codigo** | Código morto, duplicação, refatoração — sem domínio. | Trocar “SGT” no título/descrição; paths em `reference.md` se existirem. |
| **sgt-documentacao** | Processo de docs (índice, ADR, glossário, pt-BR). | Nome do projeto; caminho do índice (ex.: `.context/docs/README.md`). |
| **sgt-github-vercel** | Commits, PR, Vercel. | Nome do projeto; checklist de PR se for outro. |
| **sgt-organizar-repositorio** | Estrutura de pastas, onde colocar arquivos. | Se o novo projeto tiver outra estrutura (`src/`, `app/`, etc.), atualizar paths no SKILL/reference. |
| **sgt-debugger-erros** | RCA, troubleshooting, log de erros. | Nome do projeto; caminho do log (ex.: `.context/docs/troubleshooting-log.md`). |
| **sgt-consultoria-processos** | Negócio → requisitos, campos, fluxos. | Nome do projeto; remover referências a docs SGT específicos. |
| **sgt-security-performance** | Auditoria RLS, N+1, dados sensíveis. | Nome do projeto; stack (Supabase ou outro) já está implícito. |
| **sgt-ux-designer** | Mockups textuais, copy, loading/empty, shadcn + Tailwind. | Nome do projeto; referências a componentes do projeto. |

### 2. Médio esforço (adaptar stack e referências)

O **padrão** (responsabilidades, quando usar) vale para qualquer projeto; os **caminhos e a stack** são do SGT.

| Skill | O que é reutilizável | O que adaptar |
|-------|----------------------|----------------|
| **sgt-backend** | OOP, Services, Repositories, injeção de dependência, “não criar tabelas aqui”. | Nome do projeto; paths (`src/modules/`, `project-plan`); se não for Supabase, trocar “Supabase” por outro cliente de dados e tipos. |
| **sgt-frontend** | Next.js App Router, Tailwind, “usa componentes padronizados”, não criar campo próprio. | Nome do projeto; paths; referência à skill de componentes do novo projeto. |
| **sgt-componentes** | Um componente por tipo (CPF, data, moeda), registro progressivo, shadcn como base. | Nome do projeto; paths (`src/shared/ui`, barrel); se o projeto não for pt-BR, ajustar máscaras/formatos. |
| **sgt-qa-tester** | Jest, RTL, Playwright, cenários a partir de regras, edge cases em formulários. | Nome do projeto; paths de docs (project-plan, data-flow); auth/E2E se o novo projeto tiver outro fluxo de login. |
| **sgt-auth-rotas** | Login único, sessão, rotas protegidas vs públicas, middleware. | Nome do projeto; se não for Supabase Auth, descrever o provedor usado; paths de reference. |
| **sgt-supabase-data-engineer** | Tabelas, RLS, migrations, MCP Supabase. | Se o **outro projeto também usar Supabase**, basta trocar nome do projeto e refs a docs. Se não usar Supabase, a skill não se aplica (ou vira “data-engineer” genérica com outro DB). |

### 3. Alto esforço (domínio e estrutura SGT)

Essas skills estão **amarradas ao domínio ou à estrutura do HUB SGT**. Podem ser **inspiração** para uma versão no novo projeto, mas exigem reescrita ou generalização.

| Skill | Por que é específica | Como reutilizar em outro projeto |
|-------|------------------------|-----------------------------------|
| **sgt-skill-gerente** | Lista as 19 skills SGT, paths `.context/docs/skills-map.md`, AGENTS.md, ordem multi-skill pensada para o SGT. | Criar um **novo mapa de skills** do outro projeto e uma **nova skill “gerente”** que aponte para esse mapa e para as skills que você tiver (podem ser cópias adaptadas das do SGT). Copiar a **lógica** (direcionar tarefa, ordem, evitar conflitos) e preencher com os nomes e responsabilidades do novo projeto. |
| **sgt-entidades-centrais** | Pessoa/aluno, cliente→aluno, tabelas `pessoas`/`profiles`, Comercial/Educacional. | Generalizar: “entidades centrais do produto” (usuário + a entidade principal do negócio). Reescrever regras (uma entidade por ID, sem duplicar cadastro) com os **nomes de entidades e tabelas do novo projeto**. |
| **sgt-novo-modulo** | Dashboard com cards, `modulos-por-role.ts`, `submodulos-por-modulo.ts`, `src/modules/<id>`, `src/app/<id>`. | Se o outro projeto for **multi-módulo com dashboard e menu por role**, adaptar: mesmo checklist (card, rotas, menu, config), mas com os **arquivos e convenções do novo projeto**. Se não for “HUB de módulos”, a skill vira “novo feature/área” com os passos que fizerem sentido (rotas, menu, etc.). |
| **sgt-integracoes-vinculos** | Contratos entre módulos SGT, `aluno_id`/`user_id`, doc `integracao-e-vinculos-modulos.md`. | Manter a **ideia**: “quem acessa o quê, contratos entre áreas/serviços”. Reescrever com os **módulos/serviços e IDs do novo projeto** e o nome do doc de integração que você usar. |
| **sgt-migracao-legado** | “Mapa de Tradução De → Para **SGT**”, desduplicação, pessoa única no SGT. | Manter o **fluxo** (analisar legado → Mapa de Tradução → migração com desduplicação). Reescrever o “Para” com o **modelo e tabelas do novo projeto** (não “SGT”). |

---

## Passos práticos para usar em outro projeto

1. **Definir stack do novo projeto**  
   Next.js + Supabase + Tailwind + shadcn → muitas skills encaixam com pouco cambio. Stack diferente → mais substituições (ex.: backend com outro ORM, outro Auth).

2. **Copiar as skills que quiser**  
   Copiar as pastas `.cursor/skills/sgt-*` para o novo repositório (ou para uma pasta “skills-templates” fora do repo).

3. **Substituições em massa (qualquer skill)**  
   - “SGT” → nome do novo projeto (ou variável `{{PROJECT_NAME}}` se for template).  
   - `.context/docs` → caminho de documentação do novo projeto (se for outro, ex.: `docs/`).  
   - `AGENTS.md` → se o novo projeto tiver arquivo equivalente (mandato, mapa do repo).

4. **Skills de “baixo esforço”**  
   Aplicar passo 3; revisar `reference.md` de cada uma e ajustar paths/exemplos.

5. **Skills de “médio esforço”**  
   Além do passo 3: atualizar paths (`src/modules/`, `src/shared/ui`, etc.); trocar referências a outras skills pelos nomes usados no novo projeto; se mudar stack (ex.: banco não Supabase), reescrever trechos que citam Supabase.

6. **Skill gerente no novo projeto**  
   - Criar (ou adaptar) um `skills-map.md` listando as skills **desse** projeto.  
   - Criar uma skill “gerente” que use esse mapa e a mesma lógica (direcionar tarefa, ordem, conflitos).  
   - Não reaproveitar o SKILL.md da sgt-skill-gerente “cru” — ele lista as 19 skills SGT; no novo projeto a lista e os nomes serão outros.

7. **Entidades centrais / Novo módulo / Integrações / Migração**  
   Usar como **referência de processo**; reescrever o texto com entidades, tabelas, módulos e arquivos de config do novo projeto.

---

## Template de “skill genérica” (opcional)

Para virar **template** realmente reutilizável, dá para padronizar placeholders:

- `{{PROJECT_NAME}}` — nome do projeto (ex.: SGT, OutroProduto).
- `{{DOCS_PATH}}` — ex.: `.context/docs` ou `docs`.
- `{{SRC_MODULES}}` — ex.: `src/modules`.
- `{{AGENTS_FILE}}` — ex.: `AGENTS.md`.

Assim você mantém uma única cópia “genérica” e gera as skills por projeto fazendo replace dessas variáveis (manual ou com script).

---

## Conclusão

- **Sim, as skills podem ser aproveitadas em outro projeto:** principalmente o **modo de trabalho** (quem faz o quê, ordem, documentação, testes, limpeza, deploy).  
- **Alterações necessárias:**  
  - **Poucas** nas skills de limpeza, documentação, GitHub/Vercel, organizar repo, debugger, consultoria, security, UX.  
  - **Médias** nas de backend, frontend, componentes, QA, auth, Supabase (se o outro projeto usar a mesma stack).  
  - **Maiores** na gerente, entidades centrais, novo módulo, integrações e migração legado — reescrever com o domínio e a estrutura do novo projeto.  

Se quiser, o próximo passo pode ser: (1) escolher um projeto alvo e listar só as skills que você vai reutilizar lá, ou (2) criar um script de “clone e substitui SGT → X” para as skills de baixo/médio esforço.
