# ADR – Evolução de `src/services/` (planejamento)

**Contexto:** Na varredura do projeto (Fase 5 – F3F-backend, planejamento), a estrutura atual é flat: `src/services/` com um arquivo por domínio (clientes.ts, equipe.ts, planos.ts, etc.). Não há camada de repositórios explícita.

**Decisão (atual):** Manter a estrutura flat. A organização (Fase 1) e a limpeza (Fase 3) não exigiram migração para camadas; o projeto segue funcional com services que chamam o Supabase diretamente.

**Opções para evolução futura (quando houver demanda):**

1. **Manter flat** – Um arquivo por domínio em `src/services/`, funções exportadas, cliente Supabase em `supabase.ts`. Adequado enquanto a complexidade por domínio for baixa e não houver necessidade forte de testar com mocks de repositório.

2. **Evoluir para camadas** – Introduzir `repositories/` (acesso a dados) e manter `services/` como orquestração. Útil quando:
   - Houver necessidade de testar regras de negócio com mocks de dados.
   - Múltiplos “clientes” de dados (Supabase + outra API).
   - Equipe maior e necessidade de fronteiras claras.

3. **Módulos por área** – Estrutura `src/modules/<area>/` (ou `src/services/<area>/`) com `services/`, `repositories/`, `types/` por área. Referência: [.cursor/skills/F3F-backend/reference.md](../../.cursor/skills/F3F-backend/reference.md). Script de scaffolding (quando existir): `create-layer.sh` na skill F3F-backend.

**Referências:**

- [F3F-backend reference](../../.cursor/skills/F3F-backend/reference.md) – estrutura, convenções, Supabase
- [Plano de varredura](./plano-varredura-atualizacao-projeto.md) – Fase 5 (opcional)

**Próximos passos:** Implementação de camadas ou módulos apenas em demanda dedicada; não faz parte do escopo mínimo da varredura.
