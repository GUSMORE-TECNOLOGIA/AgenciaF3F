# Análise detalhada: perfil "Administrador" aparece como "agente" na lista de membros

Documento para análise e solução definitiva do bug.

---

## 1. O que é **slug** e por que existe?

- **Slug** é um identificador curto e fixo em texto (ex.: `admin`, `gerente`, `agente`, `suporte`, `financeiro`).
- Na tabela **`perfis`** (Supabase): cada perfil tem `id` (UUID), `nome` (ex. "Administrador") e **`slug`** (ex. "admin").
- **Função do slug:**
  - **Compatibilidade:** o sistema antigo usava só um enum de texto (cargo/perfil) em `equipe_membros` e em `usuarios` (coluna `perfil`). O slug mantém esse valor fixo.
  - **Código e RLS:** funções como `is_admin()` usam `perfis.slug = 'admin'` para saber se o usuário é administrador.
  - **Constraint:** a coluna `equipe_membros.perfil` só aceita os slugs: `admin`, `gerente`, `agente`, `suporte`, `financeiro`.
- **Hoje temos duas formas de “qual perfil”:**
  - **Por ID (fonte rica):** `usuarios.perfil_id` → UUID que aponta para `perfis.id`. Permite perfis custom (ex. "Teste") com nome livre.
  - **Por slug (legado/compatível):** `equipe_membros.perfil` e antiga `usuarios.perfil`. Só os valores fixos acima.

---

## 2. Modelo de dados envolvido

| Tabela / Fonte      | Coluna     | Tipo   | Descrição |
|--------------------|------------|--------|-----------|
| **perfis**         | id         | UUID   | PK; ex. `a0000000-0000-0000-0000-000000000001` para Administrador |
| **perfis**         | nome       | TEXT   | Ex. "Administrador", "Agente" |
| **perfis**         | slug       | TEXT   | Ex. "admin", "agente" |
| **usuarios**       | id         | UUID   | PK do usuário (auth) |
| **usuarios**       | perfil_id  | UUID   | FK para perfis.id; **fonte de verdade** do perfil do usuário |
| **equipe_membros** | id         | UUID   | PK do membro |
| **equipe_membros** | user_id    | UUID   | FK para usuarios.id; vínculo opcional |
| **equipe_membros** | perfil     | TEXT   | Slug (admin, gerente, agente, suporte, financeiro); **não tem perfil_id** |

- A lista de membros é montada a partir de **equipe_membros** + **usuarios** (para quem tem `user_id`).
- O **nome** do perfil a ser exibido deve vir de **perfis** (por `perfil_id` ou por slug).

---

## 3. Como era para funcionar (fluxo correto)

### 3.1 Salvando (editar membro → escolher Administrador → Salvar)

1. **Equipe.tsx** `handleSubmit` recebe do form: `perfil_id` = UUID do perfil (ex. 001 para Administrador), `perfil` = slug (ex. `'admin'`).
2. **equipe_membros:** `updateEquipeMembro(id, data)` atualiza `perfil` = `'admin'` (e nome, email, etc.).
3. **usuarios:** se o membro tem `user_id`, chama `updateUsuarioNameAndPerfil(userId, { perfil_id: '001', name: ... })` → UPDATE em `usuarios` SET `perfil_id` = 001.
4. Refetch: `loadMembros()` → `fetchEquipeMembros()`.

### 3.2 Listando (fetch + exibição)

1. **fetchEquipeMembros()** (equipe.ts):
   - SELECT em **equipe_membros** (todas as colunas, inclusive `perfil`).
   - Monta lista de `user_id` dos membros.
   - SELECT em **usuarios** com `.in('id', userIds)` → `id`, `perfil_id`.
   - Monta um **Map**: `user_id (lowercase) → perfil_id`.
   - Para cada linha de equipe_membros: `perfil_id` do membro = `userPerfilMap.get(membro.user_id)` (ou undefined se não houver).
2. **EquipeMembrosTable** (PerfilCell):
   - Exibir **nome** do perfil: buscar em `perfis` por `membro.perfil_id` → `perfis.find(p => p.id === membro.perfil_id)?.nome`.
   - Se não achar (perfil_id ausente ou não encontrado): fallback = `membro.perfil` (slug), e opcionalmente buscar nome por slug em `perfis`.

Resultado esperado: quem tem `usuarios.perfil_id = 001` e o map preenchido deve aparecer como **"Administrador"** na coluna PERFIL.

---

## 4. O que já sabemos (evidências)

- **Update no banco funciona:** logs mostram `updateUsuarioNameAndPerfil_ok` com `perfil_id: a0000000-0000-0000-0000-000000000001` para o usuário editado.
- **Formulário de edição:** ao abrir de novo o membro, o perfil "Administrador" vem selecionado (o form usa `perfil_id` e/ou slug).
- **Sintoma:** na **lista**, a coluna PERFIL mostra **"agente"** em vez de "Administrador" para esse membro.
- **Hipóteses já consideradas:**
  - Diferença de capitalização do UUID (id em um lugar em maiúsculas, em outro em minúsculas) → foi feita normalização com `toLowerCase()` no Map e no find por id.
  - Slug em `equipe_membros` não atualizado → o form envia `perfil: 'admin'` e `updateEquipeMembro` grava; em tese deveria estar correto.
  - SELECT em `usuarios` não devolver a linha do usuário (ex.: RLS) → possível; não foi confirmado com log do retorno do SELECT.

---

## 5. O que foi feito (correções tentadas)

| Onde | O que foi feito |
|------|------------------|
| **equipe.ts** | Map `user_id → perfil_id` passou a usar chave em **lowercase** (set e get) para evitar falha por diferença de capitalização do UUID. |
| **equipe.ts** | Logs `fetchEquipeMembros_usuarios` (userIds, retorno de usuarios, erro) e `fetchEquipeMembros_result` (perfil_id e perfil de cada membro). |
| **EquipeMembrosTable (PerfilCell)** | 1) Busca do perfil por **id** com comparação **case-insensitive**. 2) Se não achar por id: busca por **slug** (`membro.perfil`) em `perfis` e usa o **nome** desse perfil. 3) Fallback final: exibir o slug. 4) Log `table_perfil_fallback` quando há `perfil_id` mas não se acha perfil em `perfis`. |
| **EquipeMembroForm** | Inicialização do perfil selecionado por `perfil_id` com comparação case-insensitive na lista de perfis. |
| **usuarios.ts** | `updateUsuarioNameAndPerfil` com logs e `.select('id, perfil_id')` após o UPDATE para confirmar escrita. |
| **Equipe.tsx** | Logs no fluxo de edição (user_id, perfil_id enviado, resolução por email quando user_id null). |

Ou seja: garantimos que, **mesmo quando o `perfil_id` não “bater” na lista de perfis**, a tabela tenta mostrar o nome pelo **slug** (`membro.perfil`). Se `equipe_membros.perfil` estiver `'admin'`, a lista deve mostrar "Administrador". Se ainda aparece "agente", então ou `equipe_membros.perfil` não está sendo gravado como `'admin'`, ou há outro caminho de dados (ex.: cache/estado).

---

## 6. Módulos / arquivos envolvidos

| Módulo / arquivo | Responsabilidade |
|------------------|------------------|
| **supabase: perfis** | id, nome, slug dos perfis. |
| **supabase: usuarios** | perfil_id (FK perfis); RLS SELECT/UPDATE. |
| **supabase: equipe_membros** | perfil (slug); user_id; sem coluna perfil_id. |
| **src/services/equipe.ts** | fetchEquipeMembros (equipe_membros + usuarios → perfil_id por user_id), updateEquipeMembro (grava perfil slug). |
| **src/services/usuarios.ts** | updateUsuarioNameAndPerfil (grava usuarios.perfil_id), fetchUsuarioIdByEmail (RPC). |
| **src/pages/configuracoes/Equipe.tsx** | handleSubmit: chama updateEquipeMembro e updateUsuarioNameAndPerfil; loadMembros após salvar. |
| **src/pages/configuracoes/components/EquipeMembroForm.tsx** | Envia perfil_id (UUID) e perfil (slug) no submit; inicializa seleção por perfil_id ou slug. |
| **src/pages/configuracoes/components/EquipeMembrosTable.tsx** | PerfilCell: exibe nome do perfil por perfil_id ou por slug em `perfis`, com fallback. |
| **src/services/perfis.ts** | fetchPerfis(): lista de perfis (id, nome, slug) usada no form e na tabela. |
| **src/utils/debugLog.ts** | Logs para debug (arquivo, localStorage, console). |

---

## 7. Possíveis causas ainda em aberto (para solução definitiva)

1. **RLS em `usuarios`:** o SELECT `id, perfil_id` com `.in('id', userIds)` pode não estar devolvendo a linha do usuário quando `usuarios.perfil_id` = Administrador (ex.: política que esconde perfil_id em certas condições). **Verificar:** ver no log `fetchEquipeMembros_usuarios` se o usuário em questão aparece no array `users` e com qual `perfil_id`.
2. **equipe_membros.perfil não está 'admin' após salvar:** o UPDATE em equipe_membros pode estar falhando silenciosamente, ou o payload pode não estar mandando `perfil: 'admin'`. **Verificar:** após salvar, checar no Supabase (Table Editor) a linha do membro: coluna `perfil` deve ser `'admin'`.
3. **Ordem/cache de carregamento:** `loadMembros()` e `loadPerfis()` rodam em paralelo; na primeira renderização da lista, `perfis` pode estar vazio e o fallback ser slug. Se por algum motivo o refetch não atualizar o estado do membro (ex.: referência de objeto antiga), a UI pode continuar mostrando "agente". **Verificar:** se após alguns segundos ou ao mudar de aba e voltar a lista corrige.
4. **Dupla fonte de verdade:** hoje temos `usuarios.perfil_id` (fonte rica) e `equipe_membros.perfil` (slug). A lista usa as duas (id primeiro, depois slug). Uma solução definitiva pode ser: **uma única fonte** (ex.: sempre derivar o que mostrar da tabela `usuarios` quando houver `user_id`, e tratar `equipe_membros.perfil` só para membros sem user_id ou como fallback legado).

---

## 8. Próximos passos sugeridos (para você analisar)

1. **Confirmar no banco (Supabase):** após reproduzir o bug (editar membro → Administrador → Salvar), abrir Table Editor e verificar:
   - **usuarios:** linha do usuário editado tem `perfil_id` = UUID do Administrador?
   - **equipe_membros:** linha do membro tem `perfil` = `'admin'`?
2. **Usar os logs:** com a instrumentação atual, rodar o fluxo e inspecionar:
   - `fetchEquipeMembros_usuarios`: o usuário em questão está em `users`? Com `perfil_id` preenchido?
   - `fetchEquipeMembros_result`: esse membro aparece com `perfil_id` preenchido ou null?
   - `table_perfil_fallback`: aparece para esse membro? Se sim, `perfisIds` contém o UUID do Administrador?
3. **Solução definitiva (desenho):**
   - Decidir: lista de membros deve mostrar sempre a partir de **usuarios.perfil_id** quando existir `user_id`, e usar **equipe_membros.perfil** só quando não houver vínculo (ou como fallback).
   - Garantir que o SELECT em `usuarios` (em fetchEquipeMembros) realmente retorne `perfil_id` para todos os userIds (revisar RLS se necessário).
   - Opcional: manter exibição por slug como fallback (já implementado em PerfilCell) para casos em que perfil_id falhe ou não exista.

---

## 9. Resumo em uma frase

O sistema usa **slug** para compatibilidade e constraints; a **fonte de verdade** do perfil do usuário é **usuarios.perfil_id**. O bug “Administrador vira agente na lista” indica que, naquele momento, a lista não está conseguindo obter ou exibir o nome a partir de `perfil_id` (ou do slug em `equipe_membros`), e a análise definitiva depende de confirmar no banco e nos logs se `usuarios.perfil_id` e `equipe_membros.perfil` estão corretos após o save e se o SELECT em `usuarios` está devolvendo esses dados para o front.
