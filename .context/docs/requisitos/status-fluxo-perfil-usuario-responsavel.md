# Status: Fluxo Perfil → Usuário → Responsável

Conferência entre o documento de requisitos [fluxo-perfil-usuario-responsavel.md](./fluxo-perfil-usuario-responsavel.md) e o estado atual do sistema. Atualizado para servir de referência à **F3F-gerente** e à **QA**.

---

## Resumo executivo

| Status geral | Descrição |
|--------------|-----------|
| **Implementado** | Os seis passos do fluxo estão cobertos no código e nas migrations aplicadas (Supabase via MCP). As correções registradas no troubleshooting-log (user_id, RLS is_admin(), constraint financeiro, key do form, fonte única de responsáveis) endereçam as causas raiz que quebravam a cadeia. |
| **Validação pendente** | É necessário **testar em ambiente (produção/preview)** contra os [critérios de aceite](./fluxo-perfil-usuario-responsavel.md#critérios-de-aceite-para-qa-e-validação) do doc de requisitos. Se o ambiente usar outro projeto Supabase, as migrations devem estar aplicadas lá. |
| **Possível resíduo** | 1 membro da equipe pode ainda ter `user_id` NULL (10 de 11 com user_id no banco). Se algum nome não aparecer como esperado, verificar se esse membro tem email igual ao de um registro em `usuarios` e rodar backfill se necessário. |

---

## Passo a passo (requisito vs implementação)

| # | Passo (requisito) | Implementação | Status |
|---|-------------------|---------------|--------|
| 1 | **Criar e configurar o perfil** – persiste em perfis e perfil_permissoes; perfil disponível para seleção. | Tela Configurações → Perfis; `fetchPerfis()` usado na Equipe; tabelas `perfis` e `perfil_permissoes`. | OK |
| 2 | **Vincular perfil ao usuário** – atualiza equipe_membros.perfil e usuarios.perfil_id; lista e reabertura do form mostram valor salvo. | `updateEquipeMembro` + `updateUsuarioNameAndPerfil`; lista lê `membro.perfil`; form com `key={editingMembro?.id ?? 'new'}`; constraint inclui `financeiro`. | OK |
| 3 | **Usuário visível como responsável elegível** – lista “Adicionar Responsável” com nome completo; user_id vinculado. | `ClienteResponsaveisTab` usa `fetchUsuariosParaSelecaoResponsavel()` (RPC com nome_completo); backfill `equipe_membros.user_id` por email aplicado. | OK |
| 4 | **Vincular responsável ao cliente** – persiste em cliente_responsaveis; RLS permite admin (role ou perfil). | `createClienteResponsavel`; RLS `cliente_responsaveis` com `is_admin()`. | OK |
| 5 | **Dashboard com nome correto** – gráficos “por responsável” com nome completo da equipe. | `fetchResponsaveisParaDashboard()` → RPC `get_responsaveis_para_dashboard` com `COALESCE(equipe_membros.nome_completo, u.name)` e `is_admin()`. | OK |
| 6 | **Filtros com nome completo** – “Todos os responsáveis” com nomes; filtrar por responsável. | `fetchPrincipaisParaLista()` → RPC `get_principais_para_lista` com nome_completo; `Clientes.tsx` usa responsaveisUnicos para opções e filtro. | OK |

---

## O que já foi corrigido (troubleshooting-log)

- **user_id NULL:** backfill por email; RLS equipe_membros com `is_admin()`.
- **Dashboard/filtro/vínculo:** RPCs com nome_completo e `is_admin()`; RLS cliente_responsaveis com `is_admin()`; aba Responsáveis usando `fetchUsuariosParaSelecaoResponsavel`.
- **Perfil não persistia / mostrava errado:** constraint `equipe_membros.perfil` incluindo `financeiro`; form com `key` para não sobrescrever perfil ao reabrir.

---

## Como implementar (se algo ainda falhar)

A implementação já segue o doc de requisitos. Se em **um ambiente** (ex.: produção) algo ainda falhar:

1. **Confirmar migrations no Supabase desse ambiente**  
   - `unificar_responsaveis_admin_e_nome`  
   - `backfill_equipe_user_id_e_rls_is_admin`  
   - `equipe_membros_perfil_allow_financeiro`  
   Se faltar alguma, aplicar via Supabase (Dashboard ou MCP **F3F-supabase-data-engineer**).

2. **Se nomes ainda errados ou lista de responsáveis vazia**  
   - **Supabase:** conferir se `equipe_membros.user_id` está preenchido para os membros que devem aparecer; rodar backfill por email se necessário.  
   - **Debugger (F3F-debugger-erros):** RCA e novo registro no troubleshooting-log.

3. **Se perfil não salvar ou dropdown errado na Equipe**  
   - **Supabase:** conferir constraint `equipe_membros_perfil_check` (deve incluir `financeiro`).  
   - **Frontend:** conferir `key` no `EquipeMembroForm` e uso de `perfis`/`perfilId` no form.

4. **Validação de regressão**  
   - **QA (F3F-qa-tester):** rodar os critérios de aceite do [fluxo-perfil-usuario-responsavel.md](./fluxo-perfil-usuario-responsavel.md) (build, fluxo E2E se houver).

---

## Ordem de skills (se precisar de ajustes)

- **Erro em produção/preview:** **Debugger** (RCA + log) → **Supabase** ou **Backend** ou **Frontend** conforme causa.
- **Nova migration ou RLS:** **Supabase (F3F-supabase-data-engineer)**.
- **Ajuste em service ou RPC:** **Backend**; alteração de tela: **Frontend**.
- **Documentação:** índice em **Documentação**; conteúdo de processo em **Consultoria**.

Referência de ordem multi-skill: [skills-map.md](../skills-map.md) e [F3F-gerente reference](../../.cursor/skills/F3F-gerente/reference.md).
