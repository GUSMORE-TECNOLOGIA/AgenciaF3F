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

## 5. Auditoria RLS – sistema completo (plano de ação)

Data: 2026-03-13. Parte do [plano de ação RLS](./plano-acao-rls-sistema.md). **Skill F3F-security-performance:** auditoria e reporte; correções pela F3F-supabase-data-engineer.

### 5.1 Inventário resumido: tabelas com RLS e critério “quem pode”

| Tabela | SELECT | INSERT | UPDATE | DELETE | Critério atual (admin) |
|--------|--------|--------|--------|--------|--------------------------|
| **planos** | autenticado (deleted_at null) | só admin | só admin | só admin | **Inline** `usuarios.role = 'admin'` |
| **servicos** | autenticado (deleted_at null) | só admin | só admin | só admin | **Inline** `usuarios.role = 'admin'` |
| **plano_servicos** | autenticado | só admin (ALL) | — | — | **Inline** `usuarios.role = 'admin'` |
| **clientes** | responsável ou admin / vis_global | responsável ou admin | responsável ou admin | (soft delete RPC) | is_admin() + responsavel / visibilidade |
| **cliente_planos** | vis_global + responsável | vis_global (responsável ou admin) | vis_global | (RPC) | is_admin() no RPC |
| **cliente_servicos** | idem | idem | idem | (RPC) | idem |
| **cliente_contratos** | responsável ou admin | responsável ou admin | responsável ou admin | (RPC) | is_admin() |
| **cliente_responsaveis** | is_admin ou responsável | is_admin ou condição cr_insert | is_admin ou responsável | is_admin ou responsável | **is_admin()** |
| **usuarios** | próprio ou is_admin() | — | is_admin() | — | **is_admin()** |
| **perfis** | autenticado | **Inline** role admin | **Inline** role admin | **Inline** role admin | **Inline** `usuarios.role = 'admin'` |
| **perfil_permissoes** | autenticado | **Inline** role admin | **Inline** role admin | **Inline** role admin | **Inline** `usuarios.role = 'admin'` |
| **ocorrencia_* / ocorrencias** | responsável ou admin | idem | idem | — | **Inline** `usuarios.role = 'admin'` |
| **transacoes / atendimentos / servicos_prestados** | responsável ou admin | idem | idem | — | Inline ou is_admin conforme migration |
| **equipe_membros** | is_admin ou próprio | is_admin | is_admin | — | **is_admin()** (backfill) |
| **contrato_status_historico** | responsável ou role admin | **WITH CHECK (true)** | — | — | **Permissivo** – qualquer autenticado pode INSERT |

### 5.2 Inconsistências (correções sugeridas)

1. **Cadastros mestres (planos, servicos, plano_servicos)**  
   - **Problema:** Usam `EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role = 'admin')`. A função `is_admin()` considera também **perfil** (perfis.slug = 'admin'). Usuário com perfil Administrador mas `role != 'admin'` **não** consegue criar/editar plano ou serviço → erro genérico na UI.  
   - **Sugestão:** Substituir todas as políticas de planos, servicos e plano_servicos para usar `is_admin()` em vez da subquery inline. Responsável: F3F-supabase-data-engineer.

2. **perfis e perfil_permissoes**  
   - **Problema:** Políticas de INSERT/UPDATE/DELETE usam `usuarios.role = 'admin'` inline; mesmo efeito que acima para usuário admin por perfil.  
   - **Sugestão:** Usar `is_admin()` nas políticas de perfis e perfil_permissoes. Responsável: F3F-supabase-data-engineer.

3. **ocorrencia_grupos, ocorrencia_tipos, ocorrencias**  
   - **Problema:** Usam `EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.role = 'admin')` inline.  
   - **Sugestão:** Padronizar com `is_admin()` para alinhar ao restante do sistema. Responsável: F3F-supabase-data-engineer.

4. **contrato_status_historico (INSERT)**  
   - **Problema:** Política "Sistema pode inserir histórico" com `WITH CHECK (true)` → qualquer usuário autenticado pode inserir.  
   - **Sugestão:** Restringir INSERT a chamada por trigger ou remover política de INSERT e usar apenas trigger/RPC com SECURITY DEFINER. Responsável: F3F-supabase-data-engineer.

5. **UI vs RLS**  
   - A tela Planos mostra "Novo Plano" a todos que têm acesso ao módulo (visualizar). Quem tem perfil admin mas não role admin vê o botão e recebe erro ao salvar. Após correção 1, RLS ficará alinhado a `is_admin()`. Opcional: mostrar "Novo Plano" apenas para quem tem `pode('planos','editar')` (F3F-frontend).

### 5.3 Matriz esperada (Tabela × Operação × Quem pode)

Ver documento definitivo: [matriz-rls-quem-pode.md](./matriz-rls-quem-pode.md) (saída da Fase 2 do plano de ação). Resumo para cadastros mestres:

- **planos, servicos, plano_servicos:** SELECT = autenticado (planos/servicos: deleted_at null); INSERT/UPDATE/DELETE = **is_admin()** (role admin ou perfil slug admin).

---

## 6. Referências

- [plano-acao-rls-sistema.md](./plano-acao-rls-sistema.md) – plano de ação RLS e ordem das skills.
- [matriz-rls-quem-pode.md](./matriz-rls-quem-pode.md) – fonte de verdade Entidade × Operação × Quem pode.
- [Supabase Database Linter](https://supabase.com/docs/guides/database/database-linter) (security)
- [.context/docs/security.md](./security.md) – notas de segurança do projeto
- Skill [F3F-supabase-data-engineer](.cursor/skills/F3F-supabase-data-engineer/SKILL.md) – implementação de RLS e migrations
