---
type: doc
name: security
description: Security policies, authentication, secrets management, and compliance requirements
category: security
generated: 2026-01-20
status: filled
scaffoldVersion: "2.0.0"
---

# Segurança e RLS

## Estratégia RLS (Row Level Security)

- **Princípio:** Por padrão, cadastros mestres (planos, serviços) só podem ser criados/alterados/excluídos por **administrador**. Dados por cliente (clientes, contratos, plano/serviço do cliente, ocorrências, transações) são filtrados por **visibilidade** (perfil) ou **responsável do cliente**; admin tem acesso total.
- **Critério único de admin no banco:** usar a função **`is_admin()`** em todas as políticas RLS que dependem de administrador. A função retorna true se `usuarios.role = 'admin'` **ou** se o perfil do usuário tiver `perfis.slug = 'admin'`. Não usar subquery inline `usuarios.role = 'admin'` nas políticas, para manter consistência com perfis.
- **Fonte de verdade (quem pode o quê):** [matriz-rls-quem-pode.md](./matriz-rls-quem-pode.md).
- **Auditoria e correções:** [auditoria-seguranca-performance.md](./auditoria-seguranca-performance.md) (seção 5); [plano-acao-rls-sistema.md](./plano-acao-rls-sistema.md).

## Autenticação e segredos

- Autenticação via Supabase Auth; sessão e perfil em `usuarios` + `perfis`/`perfil_permissoes`.
- Cliente frontend usa apenas **anon key**; nunca expor `service_role` no client. Segurança de dados depende das políticas RLS.
- Variáveis de ambiente sensíveis: não usar prefixo `VITE_` para chaves que não devem ir ao bundle.
