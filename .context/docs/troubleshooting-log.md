# Troubleshooting Log – AgenciaF3F

Registro de erros analisados, causa raiz e solução. Consultar antes de RCA em erros parecidos.

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
