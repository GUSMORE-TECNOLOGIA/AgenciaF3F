# Troubleshooting Log – AgenciaF3F

Registro de erros analisados, causa raiz e solução. Consultar antes de RCA em erros parecidos.

---

## 2026-02-09 – Perfil custom (ex.: “Teste”) não salvava nem aparecia na lista de membros

| Campo | Conteúdo |
|-------|----------|
| **Data** | 2026-02-09 |
| **Descrição do erro** | Ao criar um perfil custom (ex.: “Teste”), vincular a um usuário e salvar, o perfil não aparecia na coluna PERFIL da lista de membros; todos continuavam como “agente”. |
| **Arquivo(s)/módulo** | `EquipeMembroForm.tsx` (slug forçado para enum), `equipe.ts` (fetch sem perfil_id do usuário), `EquipeMembrosTable.tsx` (exibia só equipe_membros.perfil). |
| **Causa raiz** | (1) Perfis custom não têm slug; o form convertia para um dos slugs fixos (admin, gerente, agente, …) e gravava `equipe_membros.perfil = 'agente'`. (2) O vínculo correto era salvo em `usuarios.perfil_id`, mas a lista lia só `equipe_membros.perfil`. (3) Na edição, o perfil selecionado vinha de `initialData.perfil` (slug), não de `usuarios.perfil_id`, então “Teste” não ficava selecionado. |
| **Solução aplicada** | (1) `fetchEquipeMembros` passa a buscar `usuarios.perfil_id` por `user_id` e preencher `EquipeMembro.perfil_id`. (2) `EquipeMembrosTable` exibe `perfis.find(p => p.id === membro.perfil_id)?.nome ?? membro.perfil`. (3) `EquipeMembroForm` na edição usa `initialData.perfil_id` (quando existir) para definir o perfil selecionado em vez de só o slug. |
| **Lição aprendida** | Quando o perfil do usuário pode ser custom (tabela perfis), a lista deve mostrar o nome do perfil a partir de `usuarios.perfil_id` + `perfis.nome`; não depender só de `equipe_membros.perfil` (slug). No formulário de edição, inicializar o select por `perfil_id`, não por slug. |

---

## 2026-02-09 – Atualizar perfil do membro para "Teste" não refletia (user_id null)

| Campo | Conteúdo |
|-------|----------|
| **Data** | 2026-02-09 |
| **Descrição do erro** | Ao editar um membro e selecionar perfil "Teste", ao salvar o perfil não atualizava na lista (continuava "agente"). |
| **Arquivo(s)/módulo** | Equipe.tsx handleSubmit; equipe_membros.user_id; usuarios.perfil_id. |
| **Causa raiz** | O membro editado tinha **user_id = null** em equipe_membros. O código só chama updateUsuarioNameAndPerfil quando editingMembro.user_id existe; com user_id null o perfil_id nunca era gravado em usuarios. A lista exibe perfil a partir de usuarios.perfil_id (via fetchEquipeMembros), então sem vínculo o perfil não aparecia. |
| **Solução aplicada** | Ao editar membro com user_id null: buscar usuário por email (fetchUsuarioIdByEmail); se existir, atualizar equipe_membros com user_id e chamar updateUsuarioNameAndPerfil com esse id. Assim o vínculo é criado e o perfil gravado em usuarios; no próximo loadMembros o perfil aparece. |
| **Lição aprendida** | Membros com user_id null (não vinculados ao login) não tinham perfil persistido em usuarios. Sempre que for atualizar perfil em edição, resolver user_id por email quando null e persistir o vínculo antes de atualizar usuarios.perfil_id. |

---

## 2026-02-09 – Remover responsável do cliente falhava (RLS UPDATE cliente_responsaveis)

| Campo | Conteúdo |
|-------|----------|
| **Data** | 2026-02-09 |
| **Descrição do erro** | Ao clicar em remover responsável na aba Responsáveis do cliente, a ação falhava com "new row violates row-level security policy for table cliente_responsaveis". |
| **Arquivo(s)/módulo** | RLS em cliente_responsaveis (política UPDATE). softDeleteClienteResponsavel faz UPDATE SET deleted_at = NOW(). |
| **Causa raiz** | A política UPDATE não tinha WITH CHECK explícito; no Postgres o WITH CHECK default é igual ao USING. O USING exigia cliente_responsaveis.deleted_at IS NULL. Após o UPDATE a nova linha tinha deleted_at preenchido, então falhava no WITH CHECK implícito. |
| **Solução aplicada** | Migration 20260209230000_cliente_responsaveis_update_allow_soft_delete.sql: recriar a política UPDATE com WITH CHECK explícito que só verifica permissão (responsável do cliente ou is_admin()), sem exigir deleted_at IS NULL, permitindo soft-delete. |
| **Lição aprendida** | Para tabelas com soft-delete, a política UPDATE deve ter WITH CHECK que não exija deleted_at IS NULL (só permissão), senão o UPDATE que seta deleted_at é rejeitado. |

---

## 2026-02-09 – Debug módulo responsáveis/perfil (análise de logs)

| Campo | Conteúdo |
|-------|----------|
| **Data** | 2026-02-09 |
| **Descrição do erro** | Teste de reprodução do módulo (perfil, membro, dashboard, responsáveis). Usuário reportou "issue reproduced". |
| **Arquivo(s)/módulo** | Log: `.cursor/debug.log`. Fluxos: perfis, equipe, dashboard, ClienteResponsaveisTab, cliente-responsaveis, usuarios. |
| **Causa raiz** | Nos logs desta execução **não houve erro de backend**: H1–H4 e H6–H9 REJECTED (todos com errorMessage:null, dados retornando). H5 (soft-delete responsável) INCONCLUSIVE (não foi chamado no teste). |
| **Solução aplicada** | Nenhuma alteração de código nesta análise. Se o sintoma persistir (ex.: nome errado na UI, lista não atualiza), descrever o sintoma exato e qual tela/ação para instrumentação mais focada ou correção de UI/estado. |
| **Lição aprendida** | Logs de debug permitem descartar falhas no backend quando errorMessage é null e rowCount/hasData estão corretos; nesse caso investigar frontend (estado, re-render, campo exibido). |

---

## Formato das entradas

| Campo | Descrição |
|-------|-----------|
| **Data** | Quando foi identificado/corrigido |
| **Descrição do erro** | Mensagem ou sintoma |
| **Arquivo(s)/módulo** | Onde ocorreu |
| **Causa raiz** | Por que aconteceu |
| **Solução aplicada** | O que foi feito |
| **Lição aprendida** | Evitar repetição |

---

## 2026-02-09 – Coluna `cargo` não existe em `equipe_membros` (schema cache)

| Campo | Conteúdo |
|-------|----------|
| **Data** | 2026-02-09 |
| **Descrição do erro** | "Could not find the 'cargo' column of 'equipe_membros' in the schema cache". Ao salvar edição de membro na tela Equipe (Configurações), o modal exibia esse erro. |
| **Arquivo(s)/módulo** | `src/services/equipe.ts` (insert, update, mapEquipeMembro). Módulo Configurações > Equipe. |
| **Causa raiz** | A migration `20260120112018_perfil_e_reset_senha.sql` renomeou a coluna `cargo` para `perfil` na tabela `equipe_membros`. O service continuava enviando e lendo a coluna `cargo`, que não existe mais no schema. |
| **Solução aplicada** | Em `equipe.ts`: (1) no INSERT e no UPDATE, trocar `cargo: input.perfil` por `perfil: input.perfil`; (2) no `mapEquipeMembro`, trocar `data.cargo ?? data.perfil` por `data.perfil ?? 'agente'`. |
| **Lição aprendida** | Após renomear coluna via migration, buscar todas as referências ao nome antigo no código (services, hooks, tipos) e atualizar. Verificar `select('*')` e payloads de insert/update. |

---

## Dashboard – nome do responsável errado

| Campo | Conteúdo |
|-------|----------|
| **Data** | 2026-02-09 |
| **Descrição do erro** | No dashboard, os nomes exibidos por responsável (clientes por responsável, atrasados por responsável, etc.) não batem com o nome completo da equipe. |
| **Arquivo(s)/módulo** | Dashboard usa `fetchResponsaveisParaDashboard()` → RPC `get_responsaveis_para_dashboard`. |
| **Causa raiz** | A RPC pode estar na versão antiga (retornando só `usuarios.name`) se a migration que passa a usar `equipe_membros.nome_completo` não tiver sido aplicada no projeto Supabase em uso (ex.: produção). |
| **Solução aplicada** | Garantir que a migration `20260209120100_rpc_get_responsaveis_dashboard_nome_equipe.sql` está aplicada no Supabase do ambiente (produção/preview). Essa RPC retorna `COALESCE(equipe_membros.nome_completo, usuarios.name)`. Sem essa migration, a RPC antiga continua retornando apenas `usuarios.name`. |
| **Lição aprendida** | Conferir no Supabase (Dashboard > SQL ou migrations aplicadas) se as migrations de RPC/nome completo foram executadas no projeto correto. Deploy do frontend não aplica migrations automaticamente. |

---

## 2026-02-09 – Perfil do membro na Equipe não persistia / sempre “Administrador” ao editar

| Campo | Conteúdo |
|-------|----------|
| **Data** | 2026-02-09 |
| **Descrição do erro** | Ao alterar o perfil de um membro (ex.: para Administrador) e salvar, a tabela continuava mostrando o perfil antigo (ex.: agente). Ao abrir a edição de qualquer membro, o campo Perfil aparecia sempre como “Administrador”. |
| **Arquivo(s)/módulo** | `src/pages/configuracoes/components/EquipeMembroForm.tsx` (estado do select de perfil). |
| **Causa raiz** | Condição de corrida no formulário: (1) Ao abrir a edição, `perfilId` era preenchido a partir de `initialData.perfil` só quando `perfis` já estava carregado; (2) Um segundo `useEffect` definia valor padrão `perfilId = perfis[0].id` quando `!perfilId`, sem considerar se era modo edição. Com `perfis` carregando depois, o default (primeiro da lista = Administrador) sobrescrevia o valor correto. Na prática o select sempre mostrava o primeiro perfil e, ao salvar, podia enviar o slug errado ou o backend recebia “admin” para todos. |
| **Solução aplicada** | (1) No `useEffect` que define o default do perfil, só aplicar `perfilId = perfis[0].id` quando **não** houver `initialData` (modo novo membro). Assim, em edição, o valor não é sobrescrito. (2) No `useEffect` que sincroniza `initialData` com o estado, ao ter `initialData` e `perfis` vazios, fazer `setPerfilId('')` para evitar valor antigo; quando `perfis` carregar, o mesmo efeito preenche `perfilId` pelo slug. |
| **Lição aprendida** | Em formulários com select que depende de lista assíncrona (ex.: perfis), não definir “valor padrão” (ex.: primeiro item) quando estiver em modo edição; usar `initialData` (ou equivalente) para decidir se aplica default. Garantir que a sincronização inicialData → estado rode também quando a lista assíncrona terminar de carregar. |

---

## 2026-02-09 – Módulo usuário/perfil/responsável: nomes errados, filtro e vínculo

| Campo | Conteúdo |
|-------|----------|
| **Data** | 2026-02-09 |
| **Descrição do erro** | Gráfico do dashboard com nomes errados dos responsáveis; filtro "Todos os responsáveis" exibindo "Administrador" (perfil) em vez de nome completo; impossibilidade de vincular responsável no cliente (aba Responsáveis). |
| **Arquivo(s)/módulo** | RPCs get_responsaveis_para_dashboard, get_principais_para_lista; RLS em cliente_responsaveis; ClienteResponsaveisTab; usuarios.ts. |
| **Causa raiz** | (1) Dashboard e filtro: RPCs retornavam usuarios.name (às vezes igual ao perfil) em vez de equipe_membros.nome_completo; get_responsaveis_para_dashboard usava apenas u.role = admin, ignorando perfil Administrador. (2) RLS em cliente_responsaveis usava u.role = admin, então usuário com perfil Administrador não conseguia INSERT. (3) Aba Responsáveis: combo usava fetchEquipeMembros + filtro por usuarios; fonte única (RPC com nome completo) não era usada. |
| **Solução aplicada** | Migration unificar_responsaveis_admin_e_nome: get_responsaveis_para_dashboard usa is_admin() e COALESCE(equipe_membros.nome_completo, u.name); RLS cliente_responsaveis usa is_admin(). ClienteResponsaveisTab passa a usar fetchUsuariosParaSelecaoResponsavel() para o combo. |
| **Lição aprendida** | Uma única fonte de verdade para lista de responsáveis (RPC com nome_completo e is_admin()). RLS que restringe por admin deve usar is_admin(), não apenas usuarios.role = admin. |

---

## 2026-02-09 – Módulo não funcionava: user_id da equipe NULL (causa raiz)

| Campo | Conteúdo |
|-------|----------|
| **Data** | 2026-02-09 |
| **Descrição do erro** | Não conseguia atualizar perfil do usuário/responsável; não aparecia responsável para vincular no cliente; nomes errados no gráfico. Tudo que depende de “nome completo da equipe” ou de vínculo equipe–usuário falhava. |
| **Arquivo(s)/módulo** | Tabela equipe_membros (coluna user_id); RLS equipe_membros; RPCs que usam equipe_membros.nome_completo. |
| **Causa raiz** | **equipe_membros.user_id estava NULL para todos os membros.** As RPCs usam COALESCE(equipe_membros.nome_completo, usuarios.name); como não havia vínculo (user_id NULL), o nome vinha sempre de usuarios.name (ex.: “Administrador”, “Gui Careca”). Lista para vincular responsável ao cliente dependia de membros com user_id em usuarios: como nenhum tinha user_id, a lista ficava vazia ou inconsistente. RLS em equipe_membros usava apenas u.role = 'admin', não is_admin(). |
| **Solução aplicada** | Migration backfill_equipe_user_id_e_rls_is_admin: (1) UPDATE em equipe_membros setando user_id = usuarios.id onde email coincide (case-insensitive); (2) RLS de equipe_membros (SELECT/INSERT/UPDATE) passando a usar is_admin(). Após o backfill, as RPCs passam a retornar equipe_membros.nome_completo (Guilherme Brito, Paulo Schomoeller, etc.) e o combo de responsáveis passa a listar todos os usuários com nome correto. |
| **Lição aprendida** | Garantir vínculo equipe_membros.user_id ↔ usuarios (por email ou processo de “vincular usuário” na tela). Sem esse vínculo, nome_completo da equipe nunca é usado e o módulo fica quebrado. Em novos ambientes ou seeds, popular user_id ao criar membros ou rodar backfill por email. |

---

## 2026-02-09 – Perfil Financeiro não salvava; lista "agente"; ao reabrir "Administrador"

| Campo | Conteúdo |
|-------|----------|
| **Data** | 2026-02-09 |
| **Descrição do erro** | Ao escolher perfil "Financeiro" e salvar na tela Equipe, a lista continuava "agente". Ao editar de novo, o dropdown aparecia "Administrador". |
| **Arquivo(s)/módulo** | Constraint equipe_membros_perfil_check; Equipe.tsx (form sem key). |
| **Causa raiz** | (1) Constraint em equipe_membros.perfil permitia só admin, gerente, agente, suporte. UPDATE com perfil = 'financeiro' falhava; lista lia equipe_membros.perfil e continuava "agente". (2) Form sem key: ao reabrir, estado (perfilId) podia ser o default (primeiro perfil = Administrador). |
| **Solução aplicada** | Migration equipe_membros_perfil_allow_financeiro: incluir 'financeiro' no CHECK. Equipe.tsx: key={editingMembro?.id ?? 'new'} no EquipeMembroForm para remount e estado correto ao editar. |
| **Lição aprendida** | Alinhar CHECK no banco aos valores do front. Usar key no form de edição quando initialData muda para evitar estado residual. |
