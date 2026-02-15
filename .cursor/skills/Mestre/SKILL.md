---
name: Mestre
description: "Orchestrates the full import of this skills pack into a NEW project. When you copy the .cursor/skills folder to another repo, run this skill: it renames all skills to the new project prefix, adapts every SKILL.md and reference.md (project name, paths, stack), ensures PROJECT_INTEGRATIONS.md and AGENTS.md follow the same pattern (repository & deployment, template warning), and validates GitHub / Vercel / Supabase refs so they point to the new project. Use when importing these skills into another project."
---

# Mestre – Importar pacote de skills em outro projeto

Esta skill orquestra **tudo o que foi feito para o AgenciaF3F** quando você **copia a pasta de skills para outro projeto**. Ao ser acionada no repositório de destino, ela executa as ações de renomear, adaptar, validar e alinhar documentação para que o pacote fique consistente com o **novo** projeto e nenhuma referência aponte para o projeto antigo.

**Ideia central:** Em todas as skills nós basicamente **trocamos as iniciais** (nome/prefixo do projeto). O [reference.md](reference.md) traz o **catálogo de todas as skills** e, para cada uma, o que fazer na importação: renomear prefixo + detalhes específicos daquela skill. Se no futuro forem incluídas **novas skills** no pacote, basta **complementar o Mestre** com uma nova linha nesse catálogo (nome da skill + o que fazer ao incluir no novo projeto).

## O que esta skill faz

1. **Renomear skills** – Prefixo atual (ex.: `F3F-*`) → prefixo do novo projeto (ex.: `Acme-*` ou o que você definir). Pastas e referências internas entre skills são atualizadas.
2. **Adaptar todo o conteúdo** – Em cada `SKILL.md` e `reference.md`: trocar nome do projeto (AgenciaF3F, F3F) pelo do novo projeto; ajustar caminhos (`.context/docs`, `src/...`) se a estrutura for diferente; garantir que o doc de integrações (PROJECT_INTEGRATIONS.md ou equivalente) seja o referenciado.
3. **Validar GitHub, Vercel e Supabase** – Garantir que no projeto de destino exista um documento de integrações e `.env` com os refs **deste** projeto (não do AgenciaF3F). Esta skill não preenche secrets; orienta a substituir URL do Supabase, org/repo do GitHub, projeto/domínio da Vercel e chaves.
4. **AGENTS.md** – Verificar ou criar a seção **Repository & deployment** no mesmo padrão: (a) conferir PROJECT_INTEGRATIONS (e `.env`) antes de usar MCP Supabase; (b) aviso de uso como template (substituir refs ao usar para outro projeto).
5. **Aviso de template nos docs** – Garantir que os docs que citam Supabase/GitHub/Vercel tenham a frase padrão de template (ver [reference.md](reference.md)).

## Quando usar

- Você **copiou** a pasta `.cursor/skills/` (deste repositório) para **outro** projeto.
- Você quer que as skills funcionem no novo projeto com o **nome e as referências corretas**, sem apontar para AgenciaF3F.
- Você quer que **AGENTS.md**, **PROJECT_INTEGRATIONS** (ou equivalente) e **GitHub/Vercel/Supabase** sigam o mesmo padrão que usamos aqui (conferir projeto antes de MCP; aviso de template).

Chame esta skill assim que colar as skills no novo repo e informar o **nome/prefixo do novo projeto** (ex.: "Acme", "LojaX"). Ela orienta ou executa os passos do [reference.md](reference.md).

## Regras

- **Sempre** obter o nome/prefixo do novo projeto antes de renomear (ex.: "F3F" → "Acme" → pastas `Acme-backend`, `Acme-frontend`, etc.).
- **Nunca** commitar chaves ou URLs do projeto antigo no novo repo; a skill lembra de usar PROJECT_INTEGRATIONS e `.env` com valores do **novo** projeto.
- **AGENTS.md:** manter o padrão de seção "Repository & deployment" (conferir integrações antes de MCP + aviso template).
- **Docs com refs:** aplicar a frase padrão de template em todos os arquivos que citam Supabase/GitHub/Vercel (lista no reference).

## Ordem recomendada (checklist no reference)

1. Definir nome/prefixo do novo projeto.
2. Renomear pastas das skills (F3F-* → \<NovoProjeto\>-*).
3. Substituir em massa em todos os SKILL.md e reference.md: nome do projeto, caminhos, referências cruzadas entre skills.
4. Criar ou atualizar PROJECT_INTEGRATIONS.md (ou equivalente) no novo projeto com aviso de template; garantir que .env seja o lugar das chaves.
5. Criar ou atualizar AGENTS.md com a seção "Repository & deployment" (conferir PROJECT_INTEGRATIONS antes de MCP + aviso template).
6. Adicionar a frase de aviso template nos docs que citam Supabase/GitHub/Vercel (ver reference – lista de arquivos).
7. Validar: garantir que nenhum arquivo no novo repo referencia URL/ref do AgenciaF3F; MCP e ferramentas devem usar apenas o projeto configurado no destino.

## Integração com o resto do pacote

- **F3F-gerente** (ou a skill “gerente” do novo projeto) orquestra tarefas do dia a dia; **Mestre** é usada **uma vez** (ou quando repetir a importação) para alinhar o pacote ao novo projeto.
- Após rodar Mestre, as outras skills já estarão renomeadas e adaptadas; use a skill gerente do novo projeto para o fluxo normal.

## Referência

- **Catálogo de skills** (todas as skills + o que fazer em cada uma na importação): [reference.md](reference.md) § Catálogo.
- Checklist completo, PROJECT_INTEGRATIONS, AGENTS.md, aviso template e validação: [reference.md](reference.md).
- **Novas skills no futuro:** adicionar a nova skill ao catálogo no reference com: nome, responsabilidade em uma linha, e “Na importação: trocar prefixo + [ações específicas]”.
