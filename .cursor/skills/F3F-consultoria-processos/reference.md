# Referência – F3F Consultoria / Analista de Processos

Template de requisitos, onde salvar e exemplo negócio → técnico. **Registro progressivo:** convenções de documento e pasta podem ser documentadas aqui.

---

## Template de documento de requisitos

Cada fluxo ou processo analisado pode gerar um documento (ou seção) com:

| Seção | Conteúdo |
|-------|----------|
| **Contexto de negócio** | Por que isso existe; dor do usuário ou regra de negócio; valor esperado. |
| **Atores** | Quem participa (cliente, responsável, financeiro, sistema externo). |
| **Fluxo (passos)** | Passos em linguagem de negócio; depois equivalente em "o que o sistema faz" (ex.: "Financeiro confirma pagamento" → "Update em transações; disparar evento ou atualizar status do cliente"). |
| **Campos / dados necessários** | Quais dados o sistema precisa (ex.: status do cliente, data de liberação, vínculo pagamento–cliente). Indicar se já existem nas entidades centrais ou se é novo. |
| **Estados e transições** | Estados possíveis (ex.: pendente_pagamento, pago, acesso_liberado) e o que causa cada transição (evento, ação do usuário, job). |
| **Eventos / integrações** | Se há sistema externo (pagamento, contrato): evento recebido, payload esperado, quem no projeto consome. Alinhar à skill F3F-integracoes-vinculos para contrato formal. |
| **Regras de exceção** | O que fazer em caso de estorno, cancelamento, atraso; validações (ex.: não liberar acesso se cancelado). |
| **Critérios de aceite** | Lista de condições que devem ser verdadeiras para o processo ser considerado concluído com sucesso (ex.: "O cliente deve receber o e-mail após o status mudar para ativo"). A skill **F3F-qa-tester** usa essa lista para definir cenários de teste e validar que o processo foi atendido. |

---

## Onde salvar

- **Opção 1:** um arquivo por fluxo em `.context/docs/requisitos/` (ex.: `requisitos-liberacao-acesso-pagamento.md`). Listar no [.context/docs/README.md](.context/docs/README.md) (F3F-documentacao).
- **Opção 2:** seção ou anexo em [project-overview.md](.context/docs/project-overview.md) ou [data-flow.md](.context/docs/data-flow.md) quando o fluxo for central ao projeto.
- **Regra:** todo documento novo em `.context/docs/` deve ser **adicionado ao índice** (skill F3F-documentacao). Esta skill produz o conteúdo; não esquecer de pedir atualização do índice ao criar novo arquivo.

---

## Exemplo: negócio → técnico

**Input (negócio):**  
"O cliente paga e aí liberamos o acesso ao serviço."

**Output (requisitos técnicos):**

- **Contexto:** Liberar acesso somente após confirmação de pagamento (valor de negócio: evitar acesso sem pagamento).
- **Atores:** Cliente, sistema de pagamento (externo), módulo Financeiro, área de serviços.
- **Fluxo:**  
  1. Cliente tem contrato/serviço e valor gerado (Financeiro).  
  2. Pagamento confirmado (webhook ou atualização manual pelo financeiro).  
  3. Sistema atualiza status da transação e, em seguida, atualiza estado do cliente (ex.: acesso_liberado ou status equivalente).  
  4. Sistema passa a exibir conteúdo ou funcionalidade conforme esse estado.
- **Campos/dados:** Tabela de transações com status; vínculo transação–cliente; campo ou tabela de estado do cliente (acesso liberado por serviço/período). Usar `user_id`/`cliente_id` (entidades centrais).
- **Estados:** ex.: `pendente` → `pago` (transação); `sem_acesso` → `acesso_liberado` (cliente para aquele serviço/período). Transição: evento "pagamento confirmado" ou ação "Confirmar pagamento" (financeiro).
- **Eventos/integrações:** Se pagamento for externo: webhook ou API com payload (identificador do cliente, valor, status). Contrato documentado na skill F3F-integracoes-vinculos; Backend implementa o handler que atualiza transação e dispara liberação de acesso.
- **Exceção:** Se contrato for cancelado depois, revogar acesso (regra a detalhar).
- **Critérios de aceite:** Transação com status `pago`; cliente com estado de acesso liberado; funcionalidade visível para esse cliente; (opcional) cliente recebe e-mail de confirmação após liberação. QA usa esses critérios para cenários de teste (unitários e E2E).

---

## O que esta skill entrega e quem consome

| Entrega | Consumidor |
|---------|------------|
| Requisitos (documento) | Todas as skills de implementação (leem o doc). |
| Campos e entidades sugeridos | Entidades centrais (valida modelo); Supabase (cria tabelas). |
| Eventos e integrações | Integrações e vínculos (contrato); Backend (implementar handler). |
| Fluxo e estados | Backend (services, máquina de estados); UX (telas, copy); Frontend (implementar). |
| Critérios de aceite | QA / Tester (cenários de teste; validar que o processo foi atendido com sucesso). |

Esta skill **não** implementa; só especifica. A F3F-gerente usa o output para acionar na ordem correta: Entidades, Integrações, UX, Backend, Supabase, Frontend.

---

## Links

- [project-overview.md](.context/docs/project-overview.md) – contexto de negócio e estrutura.
- [data-flow.md](.context/docs/data-flow.md) – fluxo de dados e integração.
- [F3F-integracoes-vinculos](.cursor/skills/F3F-integracoes-vinculos/SKILL.md) – contratos e sistemas externos (quando existir).
- [F3F-entidades-centrais](.cursor/skills/F3F-entidades-centrais/SKILL.md) – modelo de usuário e cliente (quando existir).
