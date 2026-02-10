# Relatório de auditoria: segurança e performance

Data da varredura: 2026-02-09. Skill: F3F-security-performance. **Este documento apenas reporta achados; as correções são delegadas a F3F-supabase-data-engineer (RLS/funções), F3F-backend ou F3F-frontend conforme o caso.**

---

## 1. RLS e Supabase (MCP get_advisors – security)

### 1.1 Funções com search_path mutável (WARN)

As funções abaixo não definem `search_path` fixo, o que pode ser um vetor de insegurança. **Remediação:** [Supabase – Function Search Path](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable).

| Função | Ação sugerida |
|--------|----------------|
| `public.update_cliente_links_updated_at` | Definir `SET search_path = public` (ou o schema desejado) na criação da função. |
| `public.update_updated_at_column` | Idem. |
| `public.validate_single_principal_per_cliente` | Idem. |
| `public.registrar_mudanca_status_contrato` | Idem. |

**Responsável pela correção:** F3F-supabase-data-engineer (migration com `ALTER FUNCTION ... SET search_path = public` ou recriação da função).

### 1.2 Políticas RLS permissivas (WITH CHECK sempre true)

| Tabela | Política | Problema |
|--------|----------|----------|
| `public.contrato_status_historico` | `Sistema pode inserir histórico` (INSERT) | WITH CHECK é sempre true → qualquer usuário autenticado pode inserir. |
| `public.contrato_status_historico` | `contrato_status_historico_insert` (INSERT) | Idem. |

**Pergunta central:** Um usuário A pode inserir histórico em nome de outro ou em contratos que não deveria? Se a regra de negócio for “apenas o sistema/trigger insere”, restringir INSERT a um role ou condição (ex.: apenas chamada por trigger ou RPC com SECURITY DEFINER). **Remediação:** [Permissive RLS Policy](https://supabase.com/docs/guides/database/database-linter?lint=0024_permissive_rls_policy).

**Responsável:** F3F-supabase-data-engineer.

### 1.3 Auth – proteção contra senhas vazadas desativada (WARN)

- **Achado:** Supabase Auth está com “Leaked password protection” desativada (verificação HaveIBeenPwned).
- **Sugestão:** Ativar em **Authentication → Settings → Password** (ou equivalente no dashboard). [Documentação](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

**Responsável:** Configuração no dashboard Supabase (ou via API de projeto).

---

## 2. Dados sensíveis no client-side

### 2.1 Cliente Supabase

- **Uso:** Apenas `createClient(supabaseUrl, supabaseAnonKey)` em `src/services/supabase.ts`; variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`. **Nenhuma chave service_role no frontend** – correto.
- **Observação:** O anon key é pública por natureza; a segurança depende das políticas RLS. Garantir que nenhum `.env` ou build exponha `SUPABASE_SERVICE_ROLE_KEY` no bundle.

### 2.2 Tokens e sessão

- Tokens de sessão são gerenciados pelo cliente Supabase (localStorage customizado em `supabase.ts`). Não há exposição indevida de tokens em estado React ou props além do que o SDK usa.
- **console.warn** em `AuthContext` e `supabase.ts`: mensagens de troubleshooting; podem permanecer em dev; em produção considerar logger condicional ou remoção.

### 2.3 Dados de outros usuários

- As políticas RLS das tabelas (clientes, usuarios, ocorrencias, etc.) devem garantir que um usuário só veja/edite o que for permitido (por vínculo, perfil ou admin). Esta auditoria não reexecutou cada política manualmente; os avisos do MCP (acima) cobrem as mais críticas. Recomenda-se revisão periódica com a pergunta: “Um usuário A consegue ler ou alterar dados de outro B?” para cada tabela sensível.

---

## 3. N+1 e gargalos

### 3.1 Varredura em `src/services/` e `src/hooks/`

- Não foi identificado loop explícito “para cada item, await supabase.from()” nos hooks ou services amostrados. Chamadas a `.from()`, `.select()`, `.rpc()` estão em funções que fazem uma query por operação (por id, por lista filtrada, etc.).
- **Sugestão:** Em listas grandes (ex.: dashboard com muitos clientes/transações), garantir que listagens usem paginação ou limites e que detalhes por item não disparem uma chamada por linha sem batch. Se no futuro houver “carregar responsável por cliente” em loop, preferir um único RPC ou query com join.

### 3.2 Build e bundle

- O build (Vite) já sinaliza chunk grande (>1000 kB) e import dinâmico de `financeiro.ts` em `planos.ts` – questão de code-splitting, não de N+1. Pode ser tratado em demanda de performance (F3F-frontend / F3F-backend conforme o caso).

---

## 4. Priorização e próximos passos

| Prioridade | Item | Responsável |
|------------|------|-------------|
| Alta | Corrigir políticas INSERT em `contrato_status_historico` (WITH CHECK restritivo ou uso apenas via trigger/RPC). | F3F-supabase-data-engineer |
| Alta | Definir `search_path` nas 4 funções listadas em 1.1. | F3F-supabase-data-engineer |
| Média | Ativar “Leaked password protection” no Auth (dashboard Supabase). | Configuração / DevOps |
| Baixa | Revisar console.warn em produção (AuthContext, supabase.ts). | F3F-frontend |
| Baixa | Monitorar listagens e futuras implementações para evitar N+1. | F3F-backend / F3F-frontend |

---

## 5. Referências

- [Supabase Database Linter](https://supabase.com/docs/guides/database/database-linter) (security)
- [.context/docs/security.md](./security.md) – notas de segurança do projeto
- Skill [F3F-supabase-data-engineer](.cursor/skills/F3F-supabase-data-engineer/SKILL.md) – implementação de RLS e migrations
