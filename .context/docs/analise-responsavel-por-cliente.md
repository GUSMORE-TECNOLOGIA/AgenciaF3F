# Análise: Responsável por cliente no F3F

Documento de referência para o Gerente e para quem for alterar o módulo.  
(Substitui o trecho que ficou bugado na resposta anterior.)

---

## 1. Conceito de negócio

- **Responsável** = usuário da equipe (membro com login em `usuarios` e, idealmente, vínculo em `equipe_membros`) atribuído a um cliente.
- Um cliente pode ter **vários responsáveis**, com **papéis** diferentes: principal, comercial, suporte, backup.
- O fluxo esperado é: **Perfil → Usuário (Equipe) → Responsável no cliente → Dashboard e Filtros** com o **mesmo nome** em todo o sistema (documentado em [fluxo-perfil-usuario-responsavel.md](./requisitos/fluxo-perfil-usuario-responsavel.md)).

---

## 2. Modelo de dados (duas fontes)

| Onde | Campo / tabela | Uso |
|------|----------------|-----|
| **clientes** | `responsavel_id` (uuid, nullable) | Responsável “principal” legado; usado em **visibilidade** (RLS e RPCs: “sou responsável do cliente ou admin”) e em listagem/filtros quando não há `cliente_responsaveis`. |
| **cliente_responsaveis** | `cliente_id`, `responsavel_id`, `roles[]`, `observacao`, `deleted_at` | **Fonte única.** Vínculo N:N; papéis principal, comercial, suporte, backup. Visibilidade e filtros usam apenas esta tabela (via `is_responsavel_do_cliente` e RPCs). |

- **responsavel_id** em ambos = `user_id` (referência a `usuarios.id`).
- Regra de nome: `COALESCE(equipe_membros.nome_completo, usuarios.name)` em RPCs; para tudo funcionar, `equipe_membros.user_id` deve estar preenchido.

---

## 3. Onde é usado no sistema

### Backend (services / Supabase)

- **`src/services/cliente-responsaveis.ts`**
  - `fetchClienteResponsaveis(clienteId)` – lista responsáveis do cliente (excl. soft-deleted).
  - `createClienteResponsavel(...)` – upsert em `cliente_responsaveis` (insere ou restaura).
  - `softDeleteClienteResponsavel(id)` – soft-delete do vínculo.

- **`src/services/usuarios.ts`**
  - `fetchUsuariosParaSelecaoResponsavel()` – RPC `get_usuarios_para_selecao_responsavel` (combo “Adicionar responsável”).
  - `fetchResponsaveisParaDashboard()` – RPC `get_responsaveis_para_dashboard` (nomes nos gráficos).
  - `fetchPrincipaisParaLista()` – RPC `get_principais_para_lista` (responsável principal por cliente para lista e filtros).

### Visibilidade (RLS e RPCs)

- **Função `is_responsavel_do_cliente(cliente_id)`:** retorna true se o usuário atual é admin ou está em `cliente_responsaveis` para o cliente (fonte única).
- **clientes:** SELECT/UPDATE por `is_responsavel_do_cliente(id)`; INSERT permitido para autenticados.
- **cliente_responsaveis:** SELECT/INSERT/UPDATE por `is_responsavel_do_cliente(cliente_id)` ou role admin; INSERT permite também “primeiro responsável” (quando o cliente ainda não tem nenhum e o usuário se adiciona).
- **cliente_contratos e RPCs de soft-delete:** usam `is_responsavel_do_cliente(c.id)` para permissão.
- **list_clientes_filtrados:** visibilidade por `is_responsavel_do_cliente(c.id)`; filtro por responsável via `EXISTS (cliente_responsaveis)`; retorna `responsavel_id` como principal (subquery).

### Frontend

- **`ClienteResponsaveisTab`** (em `ClienteDetail` e `ClienteEdit`): lista responsáveis por papel, adiciona (combo de `fetchUsuariosParaSelecaoResponsavel`), remove (soft-delete), papéis principal/comercial/suporte/backup.
- **Lista de clientes / filtros:** `SmartFiltersModal` e lista usam `fetchUsuariosParaSelecaoResponsavel` e `fetchPrincipaisParaLista` para opções “Todos os responsáveis” e coluna Responsável.
- **Dashboard:** `fetchDashboardData` usa `fetchResponsaveisParaDashboard` e `fetchPrincipaisParaLista`. **Fonte unificada de responsável:** para todos os gráficos (clientes por responsável, atrasados/em aberto por responsável, contratos por responsável), o sistema usa o **principal** da aba Responsáveis (`get_principais_para_lista`) como primeira fonte e faz fallback para `clientes.responsavel_id` quando o cliente não tem principal em `cliente_responsaveis`. Assim, quem foi vinculado só na aba Responsáveis passa a aparecer corretamente em todos os gráficos.

---

## 4. Resumo RLS (responsável)

- **clientes:** ver/editar se `responsavel_id = auth.uid()` ou admin (hoje via `is_admin()` ou role).
- **cliente_responsaveis:** ver/inserir/atualizar se for responsável do cliente ou admin; UPDATE permite setar `deleted_at` (soft-delete).
- **Outras tabelas (contratos, planos, etc.):** mesma ideia: `c.responsavel_id = auth.uid() OR is_admin()` nas funções/RPCs que filtram por cliente.

---

## 5. Skills envolvidas (para o Gerente)

| Alteração | Skill |
|-----------|--------|
| Tabelas, RLS, migrations, RPCs de responsável | **F3F-supabase-data-engineer** |
| Services/repositories (cliente-responsaveis, usuarios) | **F3F-backend** |
| Aba Responsáveis, filtros, dashboard (UI) | **F3F-frontend** |
| Modelo “um responsável = user_id”, regras de negócio | **F3F-entidades-centrais** |
| Contratos entre módulos (quem usa responsavel_id) | **F3F-integracoes-vinculos** |
| Documentar fluxo/requisitos | **F3F-documentacao** / **F3F-consultoria-processos** |

Referência de ordem multi-skill: [skills-map.md](./skills-map.md) e [F3F-gerente reference](../../.cursor/skills/F3F-gerente/reference.md).
