# Matriz RLS: Entidade × Operação × Quem pode

Fonte de verdade para políticas RLS e para a UI (esconder/desabilitar ações que o usuário não pode executar). Definido no âmbito do [plano de ação RLS](./plano-acao-rls-sistema.md) (Fase 2 – Entidades centrais + Auth).

**Critério único para “admin” em RLS:** usar a função **`is_admin()`** em todas as políticas que dependem de administrador. A função retorna true se `usuarios.role = 'admin'` **ou** se o perfil do usuário tiver `perfis.slug = 'admin'` (Administrador). Assim, usuários com perfil Administrador têm as mesmas permissões de role admin no banco.

---

## Cadastros mestres (sem vínculo a cliente)

| Entidade | SELECT | INSERT | UPDATE | DELETE |
|----------|--------|--------|--------|--------|
| **planos** | Autenticado (e deleted_at IS NULL) | is_admin() | is_admin() | is_admin() |
| **servicos** | Autenticado (e deleted_at IS NULL) | is_admin() | is_admin() | is_admin() |
| **plano_servicos** | Autenticado | is_admin() | is_admin() | is_admin() |
| **perfis** | Autenticado | is_admin() | is_admin() | is_admin() |
| **perfil_permissoes** | Autenticado | is_admin() | is_admin() | is_admin() |

---

## Usuários e equipe

| Entidade | SELECT | INSERT | UPDATE | DELETE |
|----------|--------|--------|--------|--------|
| **usuarios** | Próprio registro ou is_admin() | (criação via Auth/sistema) | is_admin() (qualquer) ou próprio (campos permitidos) | — |
| **equipe_membros** | is_admin() ou próprio | is_admin() | is_admin() | — |
| **cliente_responsaveis** | is_admin() ou is_responsavel_do_cliente(cliente_id) | is_admin() ou condição cr_insert (responsável/principal) | is_admin() ou responsável | is_admin() ou responsável |

---

## Clientes e visibilidade

| Entidade | SELECT | INSERT | UPDATE | DELETE |
|----------|--------|--------|--------|--------|
| **clientes** | Visibilidade global (perfil) ou responsável do cliente | Responsável ou is_admin() | Responsável ou is_admin() | Soft delete via RPC (responsável ou is_admin()) |
| **cliente_links** | Responsável ou is_admin() | Responsável ou is_admin() | Responsável ou is_admin() | Responsável ou is_admin() |

---

## Contratos e planos/serviços do cliente

| Entidade | SELECT | INSERT | UPDATE | DELETE |
|----------|--------|--------|--------|--------|
| **cliente_contratos** | Visibilidade global ou responsável do cliente | Responsável do cliente ou is_admin() | Responsável ou is_admin() | RPC (cascata opcional) |
| **cliente_planos** | Visibilidade global ou responsável | Responsável do cliente ou is_admin() | Responsável ou is_admin() | RPC soft_delete_cliente_plano |
| **cliente_servicos** | Idem | Idem | Idem | RPC soft_delete_cliente_servico |

---

## Ocorrências, atendimento, transações

| Entidade | SELECT | INSERT | UPDATE | DELETE |
|----------|--------|--------|--------|--------|
| **ocorrencia_grupos, ocorrencia_tipos** | Responsável do cliente ou is_admin() | Idem | Idem | — |
| **ocorrencias** | Responsável do cliente ou is_admin() | Idem | Idem | — |
| **atendimentos, servicos_prestados, transacoes** | Responsável do cliente ou is_admin() | Idem | Idem | Conforme RPC/regra |

---

## Histórico e sistema

| Entidade | SELECT | INSERT | UPDATE | DELETE |
|----------|--------|--------|--------|--------|
| **contrato_status_historico** | Responsável dos contratos envolvidos ou is_admin() | Apenas trigger/sistema (não usuário direto) | — | — |

---

## Uso desta matriz

- **F3F-supabase-data-engineer:** implementar ou alterar políticas RLS para conformidade com esta matriz; usar `is_admin()` em todas as políticas que exigem admin.
- **F3F-frontend:** esconder ou desabilitar ações (ex.: "Novo Plano", "Excluir") quando o usuário não tiver a permissão correspondente (ex.: `pode('planos','editar')` para criar plano), alinhado a esta matriz e às permissões de perfil (perfis/perfil_permissoes).

Referências: [plano-acao-rls-sistema.md](./plano-acao-rls-sistema.md), [auditoria-seguranca-performance.md](./auditoria-seguranca-performance.md) (seção 5), [security.md](./security.md).
