---
name: F3F-integracoes-vinculos
description: "Integrations and links in F3F (AgenciaF3F). Communication between modules/areas (who accesses which tables, internal APIs), use of cliente_id and user_id, contracts between modules and with satellite systems (webhooks, events). Defines and documents contracts; Backend implements services. Use when defining integration between modules, internal API contract, or external system integration."
---

# F3F Integrações e vínculos

Responsável por **comunicação entre módulos/áreas**, **vínculos por ID** (`cliente_id`, `user_id`, `pessoa_id`) e **contratos** (quem lê/escreve o quê; APIs internas; sistemas satélites). Define as regras de integração e documenta; a **implementação** (services, rotas, consumo de webhook) fica com as skills F3F-backend e F3F-auth-rotas quando aplicável.

**Documento oficial desta skill (obrigatório manter atualizado):** [PROJECT_INTEGRATIONS.md](.context/docs/PROJECT_INTEGRATIONS.md) ou equivalente em `.context/docs/` (ex.: `integracao-e-vinculos-modulos.md`). Esse doc é **mutável**: sempre que um módulo for implementado ou uma integração for definida, **esta skill atualiza** o documento — quem fala com quem, quais campos fazem a integração, quais campos são comuns entre módulos, contratos. A skill F3F-documentacao mantém o índice e "Onde buscar"; esta skill mantém o **conteúdo** do doc de integração. Referências: [data-flow.md](.context/docs/data-flow.md), [project-overview.md](.context/docs/project-overview.md).

## Regra de ouro

- **Documento de integração e vínculos** (PROJECT_INTEGRATIONS.md ou doc definido no projeto) → **esta skill é dona e deve mantê-lo atualizado.** Ao implementar ou definir um módulo, atualizar: quem fala com quem, quais campos fazem a integração, quais campos são comuns entre módulos.
- **Contrato entre módulos** (quem acessa quais tabelas; quem chama qual service; formato de dados) → esta skill.
- **Campos de integração** (ex.: `pessoa_id`, `cliente_id`, `user_id`) e **campos comuns entre módulos** → esta skill define e documenta no doc de integração e no [reference.md](reference.md).
- **Uso consistente de `cliente_id` e `user_id`** como vínculo (sem cadastros duplicados) → esta skill define a regra; implementação nas skills F3F-backend e F3F-entidades-centrais.
- **APIs internas** (área A expõe endpoint ou service para área B) → esta skill define o contrato; F3F-backend implementa.
- **Sistemas satélites** (webhook, evento externo → F3F reage) → esta skill define o contrato (payload, evento, quem consome); F3F-backend implementa o handler.
- **Esquema e RLS** (tabelas, políticas) → skill F3F-supabase-data-engineer; **código** dos services que expõem/consomem → skill F3F-backend; esta skill **define o quê** e **documenta**.

## Quando usar esta skill

- **Definir** como duas áreas se comunicam (ex.: quem envia cliente_id para quem; quem lê qual tabela).
- **Definir contrato** de API interna (formato de request/response; qual service consome).
- **Integrar sistema satélite** (ex.: webhook): definir evento/payload que o F3F recebe, quem consome (service), o que o F3F faz em resposta; documentar no [reference.md](reference.md) e em data-flow.
- **Garantir** que nenhum módulo duplique cadastro (sempre `cliente_id`/`user_id`; entidade única); esta skill reforça a regra e documenta onde cada módulo obtém o ID.
- **Documentar** fluxo de dados entre módulos: **sempre atualizar** o doc de integração quando um módulo for implementado ou uma integração for definida.
- **Dúvida** "a área A pode acessar a tabela da área B?" ou "como a área X sabe que o evento Y ocorreu?" → consultar ou definir via esta skill.

## Regras

- **Um contrato por integração:** cada integração (módulo↔módulo ou satélite→F3F) deve ter contrato documentado: quem inicia, com que dados, em que formato, e quem reage. Registrar no [reference.md](reference.md) ou em data-flow/ADR.
- **IDs centrais:** sempre `cliente_id`, `user_id` (ou `pessoa_id` quando for a entidade única); nunca chave duplicada; um único cadastro referenciado por ID. Esta skill valida que os contratos e fluxos respeitam isso.
- **Sistemas satélites:** padrão "evento/dado chega → F3F atualiza estado e dispara fluxo"; documentar origem (webhook URL, fila, API), payload esperado e responsável no F3F (qual service ou rota consome).
- **APIs internas:** quando uma área precisar chamar outra (em vez de ler no mesmo banco), definir método, autenticação (se houver) e formato; F3F-backend implementa.
- **Registro progressivo:** cada integração ou satélite adotado deve ser listado no [reference.md](reference.md) com contrato resumido.

## Conteúdo do reference.md

O [reference.md](reference.md) contém:

- **Padrões de vínculo:** uso de `cliente_id`, `user_id`; tabelas compartilhadas vs tabelas por módulo; quem pode ler/escrever o quê.
- **Contratos entre módulos:** formato (tabela acessada, colunas, ou API interna); onde documentar (data-flow, reference, ADR).
- **Sistemas satélites:** lista (evento/payload; quem no F3F consome); registro progressivo.
- **APIs internas:** quando usar; formato do contrato.

## Integração com outras skills

- **F3F-backend:** implementa os services e rotas que expõem ou consomem; esta skill define o **contrato**.
- **F3F-supabase-data-engineer:** tabelas e RLS permitem ou restringem acesso; esta skill define **quais** tabelas uma área pode acessar e como se vinculam (IDs).
- **F3F-auth-rotas:** rotas de webhook ou API interna podem precisar de auth (service key, header); esta skill define "quem pode chamar"; Auth define como validar.
- **F3F-documentacao:** esta skill mantém o **conteúdo** do doc de integração; a skill Documentação mantém o índice e a entrada "Onde buscar" para esse doc.

## Referência adicional

- Padrões de vínculo, contratos, satélites e APIs internas: [reference.md](reference.md) (neste diretório).
- Fluxo de dados do projeto: [data-flow.md](.context/docs/data-flow.md).
