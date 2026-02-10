# Requisitos: Contrato como entidade vs. campo na aba Serviços

**Skill:** F3F-consultoria-processos  
**Objetivo:** Analisar se o "Contrato" deve permanecer como campo em cada plano/serviço ou ser promovido a entidade própria (painel de Contratos na aba Serviços), e incluir a opção "Contrato cancelado".

---

## 1. Contexto de negócio

- **Dor / regra:** Hoje o contrato é um **atributo** em cada item (plano ou serviço): "Assinado" ou "Não assinado". Não existe um "contrato" que agrupe vários planos/serviços.
- **Regra que o usuário trouxe:** O contrato é uma entidade **maior** que o plano: se eu **cancelar o contrato**, cancelo **todos** os planos/serviços daquele contrato; mas posso **cancelar um plano** e o contrato continuar ativo.
- **Valor esperado:** Poder gerenciar contratos em um painel próprio (como se faz com planos), com status do contrato (incluindo "cancelado"), e que "cancelar contrato" reflita em todos os itens vinculados; além de ter a opção "Contrato cancelado" disponível (que faltava).

---

## 2. Análise: dois modelos

### Modelo A – Contrato como **campo** (situação atual + opção cancelado)

- **O que é:** Cada linha de `cliente_planos` e `cliente_servicos` tem o campo `contrato_assinado` (hoje: `assinado` | `nao_assinado`).
- **Alteração imediata:** Incluir valor `cancelado` no enum (ex.: `contrato_assinado` = `assinado` | `nao_assinado` | `cancelado`).
- **Prós:** Pouca mudança; rápido.
- **Contras:** Não existe um "contrato" único que agrupe vários planos/serviços. "Cancelar o contrato" significaria marcar **cada** plano/serviço como cancelado manualmente (um por um). Não há entidade "maior" para operar em lote.

### Modelo B – Contrato como **entidade** (painel próprio)

- **O que é:** Criar a entidade **Contrato** (ex.: tabela `cliente_contratos` ou `contratos`):
  - Um contrato pertence a um **cliente** (`cliente_id`).
  - Um contrato tem **status** (ex.: ativo, pausado, cancelado, finalizado) e pode ter **contrato_assinado** (assinado | não assinado | cancelado, conforme regra de negócio).
  - **Planos e serviços** são vinculados ao contrato: `cliente_planos` e `cliente_servicos` ganham `contrato_id` (FK para a nova tabela). Itens sem contrato (`contrato_id` NULL) podem existir para migração ou itens avulsos.
- **Fluxo:** Na aba Serviços do cliente: primeiro painel **"Contratos"** (lista de contratos do cliente; adicionar/editar contrato; mesmo padrão de UX do painel de Planos). Ao abrir um contrato, exibir os **planos** e **serviços** daquele contrato. "Cancelar contrato" = uma ação que altera o status do contrato (e, por regra de negócio, pode refletir nos itens vinculados, ex.: considerar todos como cancelados ou exibir badge "Contrato cancelado").
- **Prós:** Reflete a regra "contrato é maior que o plano"; cancelar contrato = uma ação; painel dedicado; mesma lógica de UX já usada para planos.
- **Contras:** Exige nova tabela, migração, ajuste de telas e serviços (Supabase → Backend → Frontend).

---

## 3. Recomendação

- **Curto prazo (fazer já):** Incluir a opção **"Contrato cancelado"** no campo atual `contrato_assinado` (Modelo A). Assim o usuário já pode marcar itens como contrato cancelado, mesmo que "por item".
- **Médio/longo prazo (evolução):** Adotar o **Modelo B** — Contrato como entidade, com painel próprio na aba Serviços e vínculo contrato → planos/serviços. Ordem sugerida: **Consultoria (este doc)** → **Entidades centrais** (validar modelo) → **Integrações** (se houver impacto em outros módulos) → **Supabase** (tabela + migração) → **UX** (mockup do painel Contratos) → **Backend** (services) → **Frontend** (telas).

---

## 4. Campos / dados necessários

### 4.1 Imediato (só opção "cancelado")

- Em `cliente_planos` e `cliente_servicos`: estender o CHECK de `contrato_assinado` para aceitar `'cancelado'` além de `'assinado'` e `'nao_assinado'`.
- Tipos e validadores no frontend: incluir `'cancelado'` no enum; copy na UI: "Assinado", "Não assinado", "Cancelado".

### 4.2 Evolução (Modelo B – Contrato como entidade)

- **Nova tabela (ex.: `cliente_contratos`):**
  - `id` (uuid, PK)
  - `cliente_id` (uuid, FK → clientes)
  - `nome` ou `identificador` (text, opcional) – ex.: "Contrato 2025-01"
  - `status` (text) – ex.: ativo, pausado, cancelado, finalizado
  - `contrato_assinado` (text) – assinado | nao_assinado | cancelado (conforme regra)
  - `data_inicio` (date), `data_fim` (date, opcional)
  - `observacoes` (text, opcional)
  - `created_at`, `updated_at`, `deleted_at`
- **Tabelas existentes:** `cliente_planos` e `cliente_servicos` ganham coluna `contrato_id` (uuid, FK → cliente_contratos, nullable). Itens já existentes ficam com `contrato_id` NULL (ou migração cria um contrato por item, conforme decisão do time).

---

## 5. Estados e transições (Modelo B)

- **Contrato:** ativo → pausado | cancelado | finalizado. Cancelado e finalizado são terminais (ou com reabertura, se houver regra).
- **Efeito de "Cancelar contrato":** atualizar status do contrato para `cancelado`; em relatórios e listas, planos/serviços vinculados podem ser exibidos como "Contrato cancelado" (ou o status do item pode ser atualizado em cascata, conforme regra definida com o negócio).
- **Plano/serviço:** continua podendo ter status próprio (ativo, pausado, cancelado, finalizado). Cancelar **um** plano não altera o status do contrato.

---

## 6. Atores

- Usuário da agência (admin/gerente/agente) gerencia contratos e planos/serviços na aba Serviços do cliente.
- Sistema persiste contrato e vínculos; aplica regras de exibição (ex.: badge "Contrato cancelado" quando o contrato estiver cancelado).

---

## 7. Fluxo resumido (Modelo B)

1. Usuário abre Cliente → aba Serviços.
2. Vê seção **Contratos** (lista de contratos do cliente); pode **Adicionar contrato** (nome, status, contrato assinado/não assinado/cancelado, datas).
3. Ao abrir um contrato, vê os **planos** e **serviços** vinculados àquele contrato (mesma lógica de cards/lista atual).
4. **Cancelar contrato:** uma ação no contrato que seta status = cancelado; itens vinculados passam a ser considerados sob contrato cancelado (exibição/regras conforme definição).
5. **Cancelar um plano** (ou serviço) não altera o status do contrato.

---

## 8. Regras de exceção

- Itens sem `contrato_id` (avulsos ou legado): continuam sendo exibidos (ex.: seção "Planos/Serviços sem contrato" ou na lista geral).
- Se no futuro houver cascade: ao cancelar contrato, decidir se apenas o status do contrato muda ou se os status dos planos/serviços também são atualizados (documentar na implementação).

---

## 9. Critérios de aceite

### Imediato (opção "Contrato cancelado" no campo atual)

- [ ] Campo "Contrato" (ou "Contrato assinado") em plano e serviço aceita três valores: Assinado, Não assinado, **Cancelado**.
- [ ] Criação e edição de plano/serviço permitem escolher "Cancelado".
- [ ] Lista/cards exibem o badge correspondente (ex.: "Contrato cancelado" em estilo distinto).
- [ ] Banco e validadores aceitam o valor `cancelado`.

### Evolução (Modelo B – Contrato como entidade)

- [ ] Existe tabela de contratos por cliente e `cliente_planos`/`cliente_servicos` com `contrato_id` (nullable).
- [ ] Na aba Serviços há painel "Contratos" com lista, adicionar e editar contrato (mesma lógica de UX que planos).
- [ ] Ao selecionar um contrato, exibem-se apenas os planos/serviços daquele contrato (ou exibição clara do vínculo).
- [ ] Ação "Cancelar contrato" altera o status do contrato; itens vinculados refletem essa informação (badge ou regra definida).
- [ ] Cancelar um plano não altera o status do contrato.

---

## 10. Próximos passos (para a F3F-gerente)

1. **Imediato:** Implementar opção "Contrato cancelado" no modelo atual (Supabase: alterar CHECK; tipos/validators/services; UX/Frontend: select e badge). Skills: Supabase → Backend (validators/services) → UX (copy) → Frontend.
2. **Evolução:** Tratar Contrato como entidade (este doc como base). Ordem: Entidades centrais → Integrações (se necessário) → Supabase (tabela + migração) → UX (mockup painel Contratos) → Backend → Frontend. Documentação atualiza índice em `.context/docs/README.md`.

---

*Documento gerado pela skill F3F-consultoria-processos. Conteúdo para consumo por Entidades centrais, Supabase, Backend, UX e Frontend; esta skill não implementa.*
