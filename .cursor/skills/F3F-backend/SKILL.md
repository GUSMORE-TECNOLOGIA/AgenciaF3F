---
name: F3F-backend
description: Owns the F3F (AgenciaF3F) application layer. Services (use cases), Repositories (Supabase access), domain entities. Single pattern per module; dependency injection for testability. Use when creating or changing business logic, services, repositories, or Supabase integration in the application layer.
---

# F3F Backend

Responsável pela **camada de aplicação** do F3F: regras de negócio, serviços (casos de uso), repositórios (acesso a dados) e entidades de domínio. Stack e paradigma definidos em [project-overview.md](.context/docs/project-overview.md). O frontend **chama** essa camada; esta skill não mexe em tabelas nem RLS (skill F3F-supabase-data-engineer) nem em telas (skill F3F-frontend).

## Regra de ouro

- **Services (casos de uso)** → esta skill.
- **Repositories (acesso Supabase)** → esta skill.
- **Entidades de domínio** com comportamento quando fizer sentido → esta skill.
- **Esquema, RLS e migrations** → skill [F3F-supabase-data-engineer](.cursor/skills/F3F-supabase-data-engineer/SKILL.md).
- **Telas, rotas e componentes de UI** → skills [F3F-frontend](.cursor/skills/F3F-frontend/SKILL.md) e [F3F-componentes](.cursor/skills/F3F-componentes/SKILL.md).

## Stack (aprovada)

- **Paradigma:** OOP ou módulos por domínio (services, acesso a dados). Camadas: Services (casos de uso); Repositories ou funções que encapsulam Supabase.
- **Supabase:** cliente `@supabase/supabase-js` usado em `src/services/supabase.ts` (ou dentro de Repositories); tipos gerados pela skill Supabase.
- **Testabilidade:** injeção de dependência (repositórios injetados em services) quando adotar camada completa; ou funções testáveis com mocks.
- **Linguagem:** TypeScript.

## Quando usar esta skill

- Criar ou alterar **services** (casos de uso) por domínio (clientes, equipe, atendimentos, etc.).
- Criar ou alterar **repositórios** ou funções de leitura/escrita no Supabase.
- Definir ou alterar **entidades de domínio** (Cliente, Usuário, Atendimento, etc.) com comportamento.
- Expor dados ou ações para o frontend (hooks, chamadas diretas aos services).
- Integrar com **sistemas externos** (webhooks, eventos) em conjunto com a skill F3F-integracoes-vinculos.
- Definir **contratos** entre áreas (quem chama qual service; DTOs) – em conjunto com a skill Integrações quando houver.

## Regras

- **Um padrão por projeto:** estrutura de pastas e convenções de nomes únicas; ver [reference.md](reference.md). Novos domínios seguem o mesmo padrão.
- **Encapsular Supabase:** preferir que services usem repositórios ou funções de acesso centralizadas; evitar cliente Supabase espalhado.
- **Services sem UI:** services não conhecem React nem componentes; recebem e retornam dados (tipos, DTOs).
- **Erros:** usar classe **AppError** (código + status) quando adotada; não lançar strings genéricas. Ver [reference.md](reference.md).
- **Entidades centrais:** usar sempre por ID (`user_id`, `cliente_id`); não duplicar cadastros; alinhar à skill F3F-entidades-centrais quando existir.
- **Registro progressivo:** ao adotar um padrão novo (ex.: formato de erro, DTOs), documentar no [reference.md](reference.md).

## Estrutura de pastas (referência)

- **Atual F3F:** `src/services/` – arquivos por domínio (clientes.ts, equipe.ts, supabase.ts, etc.).
- **Evolução para camadas:** `src/modules/<area>/` ou `src/services/<area>/` – services, repositories, entities, dtos; ou manter flat em `src/services/` com convenções claras.
- Detalhes e exemplos em [reference.md](reference.md) (neste diretório).

## Criar Service, Repository e Entity (script)

Quando o projeto adotar estrutura em camadas (entities + repositories + services), use o script a partir da raiz:

```bash
bash .cursor/skills/F3F-backend/scripts/create-layer.sh <modulo> <Entidade>
```

Ex.: `bash .cursor/skills/F3F-backend/scripts/create-layer.sh clientes Cliente` gera entities, repository e service. Ajustar tabela no repository e DTOs conforme [reference.md](reference.md). O script gera em `src/modules/<modulo>/`; se o projeto usar outro path (ex.: `src/services/<modulo>/`), mover os arquivos ou adaptar o script.

## Integração com outras skills

- **Supabase (F3F-supabase-data-engineer):** não criar tabelas nem RLS aqui; consumir tipos gerados e acessar dados via services/repositories.
- **Frontend (F3F-frontend):** páginas e hooks chamam services; esta skill define a interface (métodos, parâmetros, retorno).
- **Auth (F3F-auth-rotas):** obter `user_id` da sessão (Supabase Auth) e passar para services quando a operação for por usuário.
- **Integrações (F3F-integracoes-vinculos):** quando houver comunicação entre áreas ou APIs externas, esta skill implementa os services que expõem ou consomem; contratos em PROJECT_INTEGRATIONS.md.

## Referência adicional

- Estrutura de pastas, convenções (services, repositories, entidades), injeção de dependência e padrões: [reference.md](reference.md).
- Stack e paradigma: [project-overview.md](.context/docs/project-overview.md).
