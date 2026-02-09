# Requisitos: Fluxo Perfil → Usuário → Responsável (cadeia interconectada)

Documento de processo de negócio que descreve **como** Perfil, Usuário (Equipe), Responsável do cliente, Dashboard e Filtros devem funcionar em conjunto. Qualquer quebra em um elo quebra o valor de negócio dos demais.

**Valor de negócio:** O gestor define perfis de acesso, vincula cada membro da equipe a um perfil e usa esses mesmos membros como responsáveis por clientes. O sistema deve refletir o mesmo “quem é quem” em toda a jornada: na lista de usuários, no vínculo responsável do cliente, no gráfico do dashboard e nos filtros.

---

## Contexto de negócio

- **Dor:** “Crio o perfil, linko ao usuário, mas não consigo usar esse usuário como responsável no cliente; no gráfico e no filtro os nomes aparecem errados ou não aparecem.”
- **Expectativa:** Tudo é uma única cadeia: **Perfil** (acesso ao sistema) → **Usuário** (membro da equipe com esse perfil) → **Responsável** (esse usuário pode ser vinculado a clientes) → **Dashboard e Filtros** (mostram o nome correto do responsável).
- **Por que existe cada elo:**
  - **Perfil:** define o que a pessoa pode ver/editar no sistema (módulos, permissões).
  - **Usuário (Equipe):** é a pessoa que faz login; tem um perfil vinculado; seu nome completo deve ser a referência em todo o sistema.
  - **Responsável do cliente:** é um usuário da equipe atribuído ao cliente (principal, comercial, suporte, backup); o gestor precisa escolher “quem é o responsável” na lista de **usuários da equipe**.
  - **Dashboard / Filtros:** o gestor precisa ver “clientes por responsável” e filtrar (ex.: “só clientes do Arthur”) usando o **nome correto** do responsável (nome da equipe, não perfil nem role).

---

## Atores

| Ator | Papel |
|------|--------|
| **Administrador / gestor** | Cria perfis, vincula perfil ao usuário na Equipe, atribui responsáveis aos clientes, consulta dashboard e filtros. |
| **Sistema** | Persiste perfil, usuário, vínculo usuário–perfil, vínculo cliente–responsável; expõe lista de responsáveis elegíveis e nomes em dashboard/filtros. |

---

## Fluxo (passos) – o que o sistema deve fazer

1. **Criar e configurar o perfil**
   - Gestor cria o perfil (ex.: “Agente”, “Financeiro”, “Administrador”), dá nome e define permissões por módulo (visualizar, editar, excluir).
   - **Sistema:** persiste em `perfis` e `perfil_permissoes`; o perfil fica disponível para seleção em outros fluxos.

2. **Vincular perfil ao usuário (membro da equipe)**
   - Na tela **Configurações → Equipe**, o gestor edita o membro e escolhe o **Perfil** no dropdown (lista deve vir de `perfis`).
   - **Sistema:** atualiza `equipe_membros.perfil` (slug) e `usuarios.perfil_id` (UUID do perfil). O perfil exibido na **lista de membros** deve ser o que está salvo (ex.: “Financeiro”, “Agente”), e ao reabrir o formulário de edição o valor deve ser o mesmo (não sobrescrever com “Administrador” ou “agente”).

3. **Usuário visível como responsável elegível**
   - Todo usuário (membro da equipe com vínculo em `usuarios`) deve poder ser escolhido como **responsável** na tela do cliente (aba Responsáveis).
   - **Sistema:** a lista “Adicionar Responsável” deve usar uma única fonte (ex.: RPC que retorna usuários com **nome completo** da equipe); o valor salvo é `user_id` (responsável = usuário). Sem vínculo `equipe_membros.user_id` ↔ `usuarios`, o nome não aparece corretamente; com vínculo, o nome exibido deve ser o da equipe (ex.: “Guilherme Brito”).

4. **Vincular responsável ao cliente**
   - Na aba **Responsáveis** do cliente, o gestor escolhe um responsável da lista e define papéis (principal, comercial, suporte, backup).
   - **Sistema:** persiste em `cliente_responsaveis` (cliente_id, responsavel_id = user_id, roles). RLS deve permitir a operação para admin (por role ou por perfil) e para o responsável do cliente quando aplicável.

5. **Dashboard: gráfico com nome correto do responsável**
   - O dashboard mostra métricas “por responsável” (ex.: clientes por responsável, atrasados por responsável).
   - **Sistema:** a fonte de nomes deve ser **nome completo da equipe** (ex.: `equipe_membros.nome_completo` quando houver vínculo `user_id`; fallback `usuarios.name`). Nunca exibir o nome do perfil (ex.: “Administrador”) como se fosse o nome da pessoa.

6. **Filtros: “Todos os responsáveis” e filtro por responsável**
   - Na lista de clientes, o filtro “Todos os responsáveis” deve listar **nomes completos** das pessoas (responsáveis) e, ao filtrar (ex.: “Arthur”), mostrar apenas clientes cujo responsável (principal ou em cliente_responsaveis) seja Arthur.
   - **Sistema:** a lista de opções do filtro e o rótulo exibido devem vir da mesma fonte de “nome do responsável” (RPC ou função que retorna nome completo); o valor do filtro é `user_id` (responsavel_id).

---

## Campos / dados necessários

| Onde | Dado | Uso |
|------|------|-----|
| **perfis** | id, nome, slug | Dropdown de perfil na Equipe; perfil_id em usuarios. |
| **usuarios** | id, perfil_id, name, email | Login; quem pode ser responsável; nome fallback quando não houver equipe. |
| **equipe_membros** | id, user_id, nome_completo, perfil (slug), email | Nome “oficial” da pessoa na equipe; vínculo user_id obrigatório para nome aparecer em responsáveis/dashboard/filtros. |
| **cliente_responsaveis** | cliente_id, responsavel_id (user_id), roles | Quem é responsável por cada cliente (principal, etc.). |
| **clientes** | responsavel_id (opcional/legado) | Pode ser usado em paralelo a cliente_responsaveis; filtros e dashboard devem considerar ambos quando aplicável. |

**Regra de ouro:** Para o nome do responsável aparecer corretamente em todo o sistema, `equipe_membros.user_id` deve estar preenchido (vínculo com `usuarios.id`). Caso contrário, as RPCs que usam `COALESCE(equipe_membros.nome_completo, usuarios.name)` retornarão apenas `usuarios.name`, que pode ser genérico ou igual ao perfil.

---

## Estados e transições (resumo)

- **Perfil:** criado/ativo; definido em perfis e perfil_permissoes.
- **Usuário (Equipe):** membro com perfil atribuído; `equipe_membros.perfil` e `usuarios.perfil_id` devem estar alinhados; `equipe_membros.user_id` preenchido para nome correto.
- **Responsável do cliente:** vínculo em cliente_responsaveis (e opcionalmente clientes.responsavel_id); responsavel_id = user_id.
- **Exibição (dashboard/filtros):** sempre que o sistema mostrar “quem é o responsável”, deve usar a mesma regra: nome completo da equipe quando houver vínculo user_id; senão usuarios.name.

---

## Eventos / integrações

- Sem sistema externo neste fluxo. Eventos são **ações do usuário** (salvar perfil, salvar membro com perfil, adicionar responsável ao cliente). O sistema deve persistir e refletir imediatamente nas listas, no dashboard e nos filtros.

---

## Regras de exceção

- Se um membro da equipe **não** tiver `user_id` (não vinculado a usuarios), ele **não** deve aparecer na lista de responsáveis elegíveis para o cliente (evitar FK quebrada e lista inconsistente).
- Se a constraint de `equipe_membros.perfil` não incluir um slug usado no front (ex.: `financeiro`), o UPDATE ao salvar o perfil do membro falhará; a constraint no banco deve incluir todos os slugs de perfis existentes em `perfis`.
- Admin (por role ou por perfil com slug `admin`) deve poder editar qualquer membro e qualquer vínculo responsável; RLS deve usar `is_admin()` para consistência.

---

## Critérios de aceite (para QA e validação)

1. **Perfil**
   - Criar um perfil (ex.: “Financeiro”) e definir permissões; o perfil aparece no dropdown ao editar membro.

2. **Usuário (Equipe)**
   - Ao editar um membro e escolher um perfil (ex.: “Financeiro”), ao salvar o perfil persiste; na **lista** de membros o perfil exibido é o salvo (ex.: “financeiro” ou label “Financeiro”).
   - Ao reabrir o formulário de edição do **mesmo** membro, o dropdown de perfil mostra o valor salvo (não “Administrador” nem outro valor incorreto).

3. **Responsável do cliente**
   - Na aba Responsáveis de um cliente, a lista “Adicionar Responsável” mostra **usuários da equipe** com **nome completo** (ex.: “Guilherme Brito”), não “Administrador” nem apenas email.
   - Ao adicionar um responsável e salvar, o vínculo é criado e o nome aparece na lista de responsáveis do cliente.

4. **Dashboard**
   - Gráficos/listas “por responsável” exibem o **nome completo** da pessoa (ex.: “Guilherme Brito”, “Arthur”), não o nome do perfil nem role.

5. **Filtros**
   - O filtro “Todos os responsáveis” na lista de clientes exibe **nomes completos**; ao selecionar um (ex.: “Arthur”), a lista de clientes é filtrada apenas para clientes cujo responsável (principal ou em cliente_responsaveis) seja esse usuário.

6. **Cadeia fechada**
   - Fluxo completo: criar perfil → vincular perfil ao usuário na Equipe → abrir um cliente → adicionar esse usuário como responsável → ver no dashboard e no filtro o nome correto. Todos os elos devem refletir o mesmo dado (perfil salvo, nome da equipe, vínculo responsável).

---

## Referências

- [troubleshooting-log.md](../troubleshooting-log.md) – erros já corrigidos (user_id NULL, constraint perfil sem financeiro, RLS is_admin, etc.).
- [EQUIPE_USUARIOS.md](../EQUIPE_USUARIOS.md) – se existir, contexto de equipe e usuários.
- [skills-map.md](../skills-map.md) – qual skill implementa cada parte (Supabase, Backend, Frontend, Auth).
