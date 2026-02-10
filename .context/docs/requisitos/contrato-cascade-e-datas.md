# Requisitos: Cascade ao cancelar contrato e datas de assinatura/cancelamento

**Skill:** F3F-consultoria-processos  
**Objetivo:** Definir regra ao cancelar contrato (cascade nos planos/serviços vinculados) e incluir campos de data de assinatura e data de cancelamento.

---

## 1. Cascade ao cancelar contrato

- **Regra:** Quando o usuário alterar o **contrato** (entidade `cliente_contratos`) para `status = 'cancelado'` **ou** `contrato_assinado = 'cancelado'`, o sistema deve atualizar **em cascata** todos os planos e serviços vinculados àquele contrato (`contrato_id` = esse contrato):
  - `status = 'cancelado'`
  - `contrato_assinado = 'cancelado'`
  - `data_cancelamento = data de hoje` (se o campo existir)
- **Onde implementar:** Na aplicação (Backend), no `updateClienteContrato`: após o update do contrato, se o novo status ou contrato_assinado for `'cancelado'`, executar update em lote em `cliente_planos` e `cliente_servicos` onde `contrato_id = id` do contrato.
- **Cancelar um plano/serviço** não altera o contrato (regra já existente).

---

## 2. Datas de assinatura e cancelamento

- **Campos:** Incluir em **três** tabelas:
  - `cliente_contratos`: `data_assinatura` (DATE, nullable), `data_cancelamento` (DATE, nullable)
  - `cliente_planos`: `data_assinatura` (DATE, nullable), `data_cancelamento` (DATE, nullable)
  - `cliente_servicos`: `data_assinatura` (DATE, nullable), `data_cancelamento` (DATE, nullable)
- **Preenchimento:**
  - **data_assinatura:** Preenchida manualmente pelo usuário ou, opcionalmente, quando o usuário alterar `contrato_assinado` para `'assinado'` (pode-se usar a data do dia como default se não informada).
  - **data_cancelamento:** Preenchida manualmente ou, quando o usuário alterar `status` ou `contrato_assinado` para `'cancelado'`, usar a data do dia como default se não informada.
- **Exibição:** Mostrar nas telas (contrato, plano, serviço) quando preenchidas; campos opcionais nos formulários.

---

## 3. Checklist de implementação (F3F-gerente)

| # | Skill | Tarefa |
|---|--------|--------|
| 1 | Consultoria | Este doc (requisitos) |
| 2 | Supabase | Migration: ADD COLUMN data_assinatura, data_cancelamento nas três tabelas |
| 3 | Backend | Types, validators, services: novos campos + cascade em updateClienteContrato |
| 4 | Frontend | Campos nos formulários e exibição; refetch após salvar contrato (para refletir cascade) |
| 5 | Documentação | Atualizar .context/docs (ux-aba-servicos, índice) |

---

## 4. Referências

- [contrato-entidade-vs-campo-servicos.md](./contrato-entidade-vs-campo-servicos.md) – Modelo B (Contrato como entidade).
- [ux-aba-servicos-cliente.md](../ux-aba-servicos-cliente.md) – UX da aba Serviços.
