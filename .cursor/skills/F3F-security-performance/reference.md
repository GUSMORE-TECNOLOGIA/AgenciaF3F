# Referência – F3F Security & Performance

Checklists para auditoria de RLS, análise de dados sensíveis no client-side e verificação de N+1 e gargalos. **Registro progressivo:** achados recorrentes ou regras adotadas pelo projeto podem ser documentados ao final.

---

## Checklist: auditoria de policies RLS

Use ao auditar uma tabela. Pergunta central: **um usuário (A) consegue ver ou alterar dados de outro usuário (B)?**

### Por operação

- **SELECT:** a política `USING` restringe às linhas do próprio usuário/cliente/tenant? (ex.: `user_id = auth.uid()` ou join com tabela que vincula `user_id` ao recurso; ou vínculo equivalente).
- **INSERT:** a política `WITH CHECK` garante que o usuário só insere com `user_id` dele (ou do contexto permitido)?
- **UPDATE:** idem; usuário não pode atualizar linhas de outro.
- **DELETE:** idem; usuário não pode deletar linhas de outro.

### Pontos comuns de falha

- **RLS desabilitado** na tabela com dados por usuário → qualquer cliente autenticado pode ver tudo.
- **Política permissiva demais:** ex.: `USING (true)` ou sem filtro por `user_id` (ou equivalente).
- **Tabela com ID de entidade (ex.: cliente_id) mas política usando só `auth.uid()`** sem vínculo: verificar se existe tabela que relaciona `auth.uid()` ao recurso (ex.: perfis, clientes com user_id); a política pode usar subquery ou função que retorna o ID do usuário logado.
- **Admin client (service role)** usado em rota de API que devolve dados por usuário → bypass de RLS; ver skill [F3F-auth-rotas](.cursor/skills/F3F-auth-rotas/SKILL.md). Esta skill **aponta** o uso; a correção é usar cliente com sessão (RLS ativo).

### Saída da auditoria

- Lista de políticas da tabela (SELECT, INSERT, UPDATE, DELETE).
- Para cada uma: está restringindo corretamente? Sim/Não.
- Se Não: descrever o cenário de vazamento (ex.: "Usuário A pode SELECT registros onde user_id = B") e sugerir condição correta (ex.: `USING (user_id = auth.uid())` ou equivalente com join/subquery).

---

## Checklist: dados sensíveis no client-side (React / frontend)

Use ao analisar um componente ou fluxo frontend. Objetivo: **não expor no browser o que não deve ser acessível ao usuário ou a scripts maliciosos.**

### O que verificar

- **Tokens e chaves:** `service_role` key, secrets de API nunca no código do client nem em variáveis de ambiente expostas ao build do client (Vite: só variáveis `VITE_*` vão ao client).
- **Dados de outros usuários:** a API ou o estado do componente está retornando/guardando dados que deveriam ser filtrados por RLS (ex.: lista de todos os clientes)? Se o backend usar cliente com RLS e `user_id` correto, não deveria; se o componente receber payload com dados de outros, é falha no backend ou na forma de chamada.
- **Campos desnecessários:** resposta de API que inclui campos sensíveis (ex.: hash interno, dados de auditoria que não precisam na tela); sugerir limitar o que é enviado ao client (select específico ou DTO).
- **Estado global (Context, store):** não guardar no client o que não é necessário para a UI (ex.: token é necessário para chamadas; copiar objeto inteiro com campos internos pode ser excesso).
- **URLs e logs:** não logar em console (em prod) objetos com dados sensíveis; não colocar IDs sensíveis ou tokens em query params visíveis.

### Saída da análise

- Lista de itens: "Onde / O quê / Risco".
- Sugestão: mover para API/server, remover do payload, ou não enviar ao client.

---

## Checklist: N+1 queries e gargalos no backend

Use ao revisar um service ou trecho que acessa repositório/banco em loop.

### N+1 típico

- **Padrão:** loop sobre uma lista e, para cada item, uma chamada ao repositório (ex.: `for (const item of items) { const detail = await this.repo.findById(item.id); }`). Resultado: 1 query + N queries (N = tamanho da lista).
- **Solução sugerida:** uma única query que traga todos os detalhes necessários (ex.: `repo.findByIds(items.map(i => i.id))` ou query com `in (...)`) ou carregar a relação em batch antes do loop (ex.: `const detailsMap = await repo.findByParentIds(ids)` e no loop usar `detailsMap.get(item.id)`).
- **Outros gargalos:** queries sem índice adequado (ex.: filtro por coluna não indexada em tabela grande); fetch de colunas desnecessárias; múltiplas round-trips que poderiam ser uma única chamada. Apontar e sugerir otimização (índice, select específico, batch).

### Saída da verificação

- Trecho exato onde ocorre o N+1 (ou gargalo).
- Descrição: "N+1: no loop sobre X, cada iteração chama repo.Y; total 1 + N queries."
- Sugestão: "Carregar todos os Y por ids em uma chamada antes do loop; usar Map para acesso O(1)."

---

## Checklist: prefetch e LCP (frontend)

Quando o projeto usar **TanStack Query** (ou similar) para cache e dados. Use ao auditar telas críticas para evitar layout shift e melhorar LCP (Largest Contentful Paint).

### O que verificar

- **Prefetch:** telas críticas (ex.: dashboard, lista principal) devem prefetchar dados quando possível, para que o primeiro paint já tenha dados disponíveis no cache e não ocorra "flash" de loading ou layout shift.
- **Stale-While-Revalidate (SWR):** TanStack Query aplica SWR por padrão. Auditar se o `staleTime` está adequado para telas que não precisam de dados em tempo real (evitar refetch desnecessário).
- **Queries em cascata:** evitar que a tela espere uma query terminar para disparar a próxima quando as duas puderem ser disparadas em paralelo (evitar waterfall que atrasa LCP).

### Saída da verificação

- Lista: "Tela / O quê / Impacto (ex.: layout shift, LCP alto)".
- Sugestão: usar prefetch para a query principal da tela; ajustar `staleTime` quando fizer sentido; disparar queries independentes em paralelo.

---

## Registro progressivo

Achados recorrentes ou regras do projeto podem ser anotados aqui para não repetir.

| Item | Descrição |
|------|------------|
| *(vazio por enquanto)* | Ex.: "Tabelas por usuário sempre devem ter RLS por user_id ou vínculo equivalente." |

---

## Links

- [security.md](.context/docs/security.md) – políticas de auth e RLS do projeto.
- [F3F-supabase-data-engineer](.cursor/skills/F3F-supabase-data-engineer/SKILL.md) – quem implementa RLS; esta skill audita.
- [F3F-auth-rotas](.cursor/skills/F3F-auth-rotas/SKILL.md) – regra de não usar admin client em rotas de API.
