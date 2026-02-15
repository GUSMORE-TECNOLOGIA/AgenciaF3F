---
name: F3F-consultoria-processos
description: "Consulting and process analysis for F3F (AgenciaF3F). Bridge between business language and system: translates routines, pains and rules into technical requirements, fields and state flows. First skill for the Gerente when input is raw business idea. Use when translating business idea into requirements, new process rule, or user pain into specs."
---

# F3F Consultoria / Analista de Processos

Responsável por **traduzir** a linguagem "do mundo real" (rotinas do dia a dia, dores do usuário, regras de negócio, processos) em **linguagem do sistema** (requisitos técnicos, campos necessários, fluxos de estado, integrações). É a **ponte** de engenharia de requisitos: deve ser a **primeira** a ser chamada pela **F3F-gerente** quando o usuário trouxer uma **ideia bruta de negócio** (ex.: "o cliente paga e liberamos o acesso ao serviço"). O output alimenta Entidades centrais, Integrações, Backend, Supabase e UX; garante que o desenvolvedor (e a IA) entendam o **valor de negócio** por trás de cada botão e de cada regra.

## Regra de ouro

- **Input:** rotina do dia a dia, dor do usuário, regra de negócio descrita em linguagem de negócio (ex.: "quando o contrato é assinado, o cliente ganha acesso").
- **Output:** documento de requisitos técnicos (ou seção em doc existente) com: **o que** o sistema deve fazer; **quais campos/dados** são necessários; **fluxo de estados** (ex.: status do pedido, status do cliente); **eventos** (ex.: pagamento confirmado → liberar acesso); **critérios de aceite** (condições para o processo ser considerado concluído com sucesso, para a QA testar). Tudo alinhado a [project-overview.md](.context/docs/project-overview.md) e [data-flow.md](.context/docs/data-flow.md).
- **Não implementa:** esta skill **não** cria tabelas, services nem telas; produz **especificação** que as outras skills usarão. Entidades centrais, Integrações, Backend, Supabase, UX e Frontend implementam.
- **Valor de negócio explícito:** cada requisito ou fluxo deve deixar claro **por que** existe (ex.: "campo status do cliente existe para controlar se pode acessar o portal").

## Quando usar esta skill

- **Ideia bruta de negócio:** "precisamos que o cliente pague e libere o acesso"; "quando o contrato for assinado, queremos disparar X"; "o responsável precisa ser notificado quando Y". A **F3F-gerente** deve acionar esta skill **primeiro** nesses casos.
- **Nova regra de processo** ou mudança em fluxo existente (ex.: nova etapa de aprovação, novo status).
- **Dor do usuário** ou rotina que ainda não está no sistema: analisar e produzir requisitos (campos, estados, integrações) antes de qualquer implementação.
- **Dúvida** "o que o sistema precisa fazer para atender a esse processo?" ou "quais dados e estados são necessários?".

## Regras

- **Documentar o output:** requisitos técnicos em `.context/docs/` (ex.: novo doc `requisitos-<fluxo>.md` ou seção em project-overview/data-flow). A skill **F3F-documentacao** atualiza o índice; esta skill produz o **conteúdo** do requisito.
- **Alinhar ao modelo existente:** usar entidades centrais (usuário, cliente, user_id) e contratos entre módulos (skill F3F-integracoes-vinculos) já definidos; não inventar entidades duplicadas. Se o requisito exigir nova entidade ou novo contrato, indicar e deixar para Entidades centrais ou Integrações definir.
- **Estados e transições:** deixar explícito quais estados existem (ex.: pendente_pagamento, pago, acesso_liberado) e quais eventos ou ações causam a transição (ex.: webhook de pagamento → pago; botão → acesso_liberado).
- **Registro progressivo:** decisões de formato de documento de requisitos (template, onde salvar) podem ser documentadas no [reference.md](reference.md).

## Conteúdo do reference.md

O [reference.md](reference.md) contém:

- **Template de documento de requisitos:** seções sugeridas (contexto de negócio, atores, fluxo, campos/dados, estados, eventos, integrações, regras de exceção, **critérios de aceite** para a QA testar).
- **Onde salvar:** convenção (ex.: `.context/docs/requisitos/` ou seção em project-overview); referência ao índice (F3F-documentacao).
- **Exemplo:** de frase de negócio → requisitos técnicos (campos, tabela, trigger/evento).
- **Integração com outras skills:** o que esta skill entrega e quem consome (Entidades, Integrações, Backend, UX).

## Integração com outras skills

- **F3F-gerente:** aciona esta skill **primeiro** quando a entrada for ideia/dor de negócio ou processo novo. Depois: Consultoria (requisitos) → Entidades centrais / Integrações / UX / Backend / Supabase conforme o conteúdo do requisito.
- **Entidades centrais (F3F-entidades-centrais):** requisitos podem indicar necessidade de novo campo ou estado em usuário/cliente; esta skill descreve o quê; Entidades define o modelo.
- **Integrações e vínculos (F3F-integracoes-vinculos):** requisitos podem indicar evento externo (ex.: pagamento, contrato assinado); esta skill descreve o fluxo; Integrações define o contrato (payload, quem consome).
- **Backend / Supabase / Frontend:** consomem o documento de requisitos para implementar (services, tabelas, telas). Esta skill não implementa.
- **UX / Designer (F3F-ux-designer):** pode usar o requisito (fluxo, atores, estados) para desenhar mockups e copy; Consultoria entrega "o que o sistema faz"; UX entrega "como a tela mostra".
- **Documentação (F3F-documentacao):** novo doc de requisitos deve ser listado no índice (.context/docs/README.md); esta skill produz o conteúdo; Documentação mantém o índice.

## Referência adicional

- Template, onde salvar e exemplo: [reference.md](reference.md).
- Contexto de negócio e estrutura: [project-overview.md](.context/docs/project-overview.md). Fluxo de dados: [data-flow.md](.context/docs/data-flow.md).
