# Validação: Módulo Equipe, Perfis e "Admin de Verdade"

Documento de auditoria e checklist para garantir que **perfil Administrador = admin em todo o sistema**: RLS, RPCs e acessos alinhados a `is_admin()` ou a permissões por módulo (`user_pode_editar_modulo` / `user_pode_visualizar_modulo`).

## Objetivo

Após erros de permissão (ex.: criar plano, excluir plano, ver membros da equipe) causados por políticas e RPCs que checavam apenas `usuarios.role = 'admin'`, este documento registra:

1. **Regra única:** Quem é "admin" no sistema = `public.is_admin()` (role admin **ou** perfil com `perfis.slug = 'admin'`). Usuários com `perfil_id` NULL podem ter perfil resolvido por `usuarios.perfil` (slug).
2. **Módulo Equipe:** Ver membros = admin OU responsável do membro OU `user_pode_visualizar_modulo('equipe')`. Criar/editar/excluir membros = admin OU responsável OU (quando aplicável) permissão de editar no módulo.
3. **Perfis e perfil_permissoes:** Apenas admin pode criar/editar/excluir perfis e permissões; políticas já usam `is_admin()` (migration 20260313120000).

## Checklist – O que foi validado/corrigido

### Equipe (equipe_membros)

| Item | Status | Observação |
|------|--------|------------|
| SELECT | OK | 20260313140000: `is_admin()` OU `user_pode_visualizar_modulo('equipe')` OU responsável do membro. |
| INSERT / UPDATE | OK | 20260209210000: `is_admin()` OU responsável. |
| user_pode_visualizar_modulo | Corrigido | 20260313190000: fallback por `usuarios.perfil` (slug) quando `perfil_id` NULL, alinhado ao frontend. |
| soft_delete_equipe_membro | Corrigido | 20260313190000: usa `is_admin()` OU `user_pode_editar_modulo('equipe')` em vez de `role = 'admin'`. |

### Perfis e perfil_permissoes

| Item | Status | Observação |
|------|--------|------------|
| RLS perfis (INSERT/UPDATE/DELETE) | OK | 20260313120000: `is_admin()`. |
| RLS perfil_permissoes (INSERT/UPDATE/DELETE) | OK | 20260313120000: `is_admin()`. |

### Planos e serviços (cadastros mestres)

| Item | Status | Observação |
|------|--------|------------|
| RLS planos/servicos/plano_servicos | OK | 20260313160000: `is_admin()` OU `user_pode_editar_modulo('planos'|'servicos')`. |
| user_pode_editar_modulo | OK | 20260313170000: fallback por slug quando `perfil_id` NULL. |
| soft_delete_plano | OK | 20260313180000: `is_admin()` OU `user_pode_editar_modulo('planos')`. |
| soft_delete_servico | Corrigido | 20260313190000: `is_admin()` OU `user_pode_editar_modulo('servicos')`. |

### Usuários (tabela usuarios)

| Item | Status | Observação |
|------|--------|------------|
| is_admin() | OK | 20260209150000: considera `role = 'admin'` OU perfil com `slug = 'admin'`. |
| RLS usuarios (SELECT/UPDATE) | OK | 20260206130000: usa `is_admin()` (SECURITY DEFINER). |

## RPCs que ainda podem usar role = 'admin' (fora deste escopo)

As seguintes RPCs/migrations antigas ainda contêm `role = 'admin'` em arquivos de migration; muitas já foram sobrescritas por migrations posteriores. Para uma varredura completa no banco, consulte a matriz RLS e o plano de ação RLS:

- soft_delete_cliente, soft_delete_cliente_cascade, soft_delete_cliente_* (cliente)
- get_responsavel_name, get_responsaveis_para_dashboard (leitura; podem retornar mais linhas se não filtrar por admin)
- cliente_links (RLS)
- historico_status_contratos

Recomendação: em uma próxima fase, substituir todas as ocorrências restantes por `public.is_admin()` e documentar aqui.

## Como validar na prática

1. **Usuário com perfil Administrador (slug admin) e `perfil_id` preenchido ou não:** deve conseguir criar/editar/excluir planos e serviços, ver todos os membros da equipe, excluir membros (se tiver permissão de editar equipe), e gerenciar perfis.
2. **Usuário com perfil que tem apenas "visualizar" no módulo Equipe:** deve ver a lista de membros, sem poder editar/excluir (salvo se for responsável do membro).
3. **Build:** `npm run build` deve passar após as migrations.

## Referências

- [Plano de ação RLS](./plano-acao-rls-sistema.md)
- [Matriz RLS (quem pode o quê)](./matriz-rls-quem-pode.md)
- [Auditoria segurança e performance](./auditoria-seguranca-performance.md)
- [Security & Compliance](./security.md)
