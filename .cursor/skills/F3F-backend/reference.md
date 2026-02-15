# Referência – F3F Backend (camada de aplicação)

Documento **progressivo**: padrões adotados (DTOs, tratamento de erro, base service) podem ser documentados aqui.

---

## Estrutura de pastas (padrão F3F)

- **Atual:** `src/services/` – arquivos por domínio (ex.: clientes.ts, equipe.ts, atendimentos.ts, supabase.ts). Código de aplicação e acesso a dados no mesmo lugar.
- **Opção em camadas:** quando o projeto adotar separação clara:
  - **`src/services/<area>/`** ou **`src/modules/<area>/`**: `services/`, `repositories/`, `entities/` ou `types/`, `dtos/`.
  - Um service ou repository por arquivo; nomenclatura: `ClienteService.ts`, `ClienteRepository.ts`, `Cliente.ts` (entidade).

Nomenclatura de arquivos: PascalCase para classes (ex.: `ClienteService.ts`); ou camelCase para módulos (ex.: `clientes.ts`) conforme o que o projeto já usa.

---

## Convenções de nomenclatura

- **Services:** sufixo `Service` em OOP (ex.: `ClienteService`) ou arquivo por domínio (ex.: `clientes.ts` com funções exportadas). Métodos que exprimem ação ou caso de uso (ex.: `buscarPorId`, `criarCliente`).
- **Repositories:** sufixo `Repository` quando existir (ex.: `ClienteRepository`). Métodos de acesso a dados (ex.: `findById`, `insert`, `update`).
- **Entidades:** nome do domínio (ex.: `Cliente`, `Usuario`, `Atendimento`). Podem ter métodos de comportamento quando fizer sentido.
- **Áreas/domínios:** nome em minúsculo (ex.: clientes, equipe, atendimento).

---

## Repositories e Supabase

- O **cliente Supabase** está em `src/services/supabase.ts` (ou factory equivalente). Repositories recebem o cliente no construtor quando o padrão for em camadas.
- Repositories **não** expõem o cliente; apenas métodos que retornam dados ou executam operações.
- Usar **tipos gerados** pelo Supabase (skill F3F-supabase-data-engineer / `generate_typescript_types`) para tipar retornos e parâmetros quando possível.
- RLS é aplicado pelo Supabase; o repository/service usa o cliente já configurado (com sessão do usuário quando necessário).

---

## Services e injeção de dependência

- Quando em camadas: services recebem **repositories** pelo construtor. Não instanciam repositórios diretamente (facilita testes com mocks).
- Services orquestram: validações, chamadas a repositórios ou Supabase, regras de negócio; retornam dados ou lançam erros tipados.
- Em estrutura flat (src/services/clientes.ts): funções que recebem cliente Supabase ou usam singleton; manter testável.

---

## Padrões adotados (registro progressivo)

| Padrão | Status | Descrição |
|--------|--------|-----------|
| **DTOs** | A definir | Sufixo `Dto` quando adotado; local em `dtos/` do módulo ou em `src/types/`. |
| **Tratamento de erro** | A definir | Classe AppError (código + status) ou padrão do projeto. |
| **Base service / Base repository** | A definir | Avaliar quando houver vários domínios. |

---

## Tratamento de erro (AppError) – quando adotado

Usar classe base para erros da camada de aplicação. Local sugerido: `src/lib/errors/AppError.ts` ou `src/shared/errors/AppError.ts`.

```ts
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number = 400
  ) {
    super(message);
    this.name = 'AppError';
  }
}
```

- **code:** identificador estável (ex.: `CLIENTE_NAO_ENCONTRADO`, `DOCUMENTO_DUPLICADO`).
- **status:** HTTP status (400, 404, 409, 422). Services lançam AppError; quem chama converte em resposta quando for API.

---

## Entidades centrais (lembrete)

- **Cliente / usuário:** referenciar por ID em todos os domínios (`user_id`, `cliente_id`).
- **Usuário (Auth + perfil):** `user_id` para operações vinculadas ao logado.
- Services que tocam em cliente ou usuário devem usar sempre o mesmo identificador; não criar cadastros duplicados. Alinhar à skill F3F-entidades-centrais quando existir.

---

## Links

- [project-overview.md](.context/docs/project-overview.md) – stack e paradigma.
- [F3F-supabase-data-engineer](.cursor/skills/F3F-supabase-data-engineer/SKILL.md) – esquema, RLS, tipos gerados.
- [data-flow.md](.context/docs/data-flow.md) – fluxo de dados e entidades compartilhadas.
