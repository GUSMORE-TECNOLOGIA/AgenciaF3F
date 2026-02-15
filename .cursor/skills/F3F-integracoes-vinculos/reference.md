# Referência – F3F Integrações e vínculos

Padrões de vínculo entre módulos/áreas, contratos e sistemas satélites. **Registro progressivo:** cada integração ou satélite adotado deve ser listado aqui (e em data-flow quando for fluxo de dados).

**Documento oficial que esta skill mantém atualizado:** [PROJECT_INTEGRATIONS.md](.context/docs/PROJECT_INTEGRATIONS.md) ou doc equivalente em `.context/docs/` (ex.: `integracao-e-vinculos-modulos.md`). Sempre que um módulo for implementado ou uma integração for definida, atualizar esse documento: quem fala com quem, campos de integração, campos comuns, tabela de módulos e vínculos. A skill F3F-documentacao mantém o índice; esta skill é responsável pelo **conteúdo** do doc de integração.

---

## Padrões de vínculo (cliente_id, user_id, pessoa_id)

- **Entidade única:** Cliente (ou pessoa) é uma só; módulos/áreas referenciam por `cliente_id` ou `pessoa_id` conforme o modelo. Usuário (Auth) por `user_id`.
- **Sem duplicar cadastro:** nenhuma área cria "seu" cliente próprio; todas usam o mesmo registro e referenciam por ID.
- **Tabelas por módulo:** cada área pode ter tabelas próprias com FK para `cliente_id` ou `pessoa_id`; acesso entre áreas via leitura nas tabelas permitidas por RLS ou via API interna quando definido.
- **Quem pode acessar o quê:** regra geral: área acessa suas próprias tabelas e tabelas centrais (cliente, perfil) conforme RLS. Acesso à tabela de **outra** área só se houver contrato explícito e RLS/visão que permita. Documentar no contrato.

---

## Campos de integração e campos comuns entre módulos

- **Campos de integração:** são os que **ligam** uma área à outra (ou à entidade central). Ex.: `pessoa_id`, `cliente_id`, `user_id` em tabelas de módulo; ao definir uma integração, documentar no doc de integração e aqui quais campos fazem a ponte.
- **Campos comuns entre módulos:** são os que **vários módulos usam** (ex.: nome, email, telefone em cliente). Ficam em tabelas centrais ou em tabela de um módulo com contrato de leitura pelo outro; esta skill define o que é comum e onde vive, e registra no doc de integração.
- Ao implementar cada módulo novo, atualizar o doc de integração com: (1) tabela "Módulos e vínculos"; (2) campos de integração usados; (3) campos comuns que consome ou expõe.

---

## Contratos entre módulos

Para cada integração entre duas áreas (ou entre satélite e F3F), registrar:

| Campo | Descrição |
|-------|-----------|
| **De / Para** | Ex.: "Área A → Área B" ou "Sistema externo (satélite) → F3F". |
| **Gatilho** | O que inicia (ex.: evento; usuário clica em ação). |
| **Dados** | O que é enviado (ex.: cliente_id, payload do webhook). |
| **Quem consome no F3F** | Service ou rota. |
| **Onde documentar** | data-flow.md, este reference, ou ADR. |

---

## Sistemas satélites (registro progressivo)

Listar cada sistema externo que envia dados ou eventos para o F3F.

| Satélite | Evento / Entrada | Payload (resumo) | Consumidor no F3F | Status |
|----------|------------------|------------------|-------------------|--------|
| *(exemplo)* | Webhook X | id, status, ... | Service que processa | A definir. |
| *(outros)* | | | | Preencher quando adotar. |

---

## APIs internas (módulo → módulo)

Quando **não** bastar ler no mesmo banco:

- **Contrato:** método (GET/POST), path ou função, request/response (DTO), quem pode chamar (auth: service key ou mesmo processo).
- **Implementação:** F3F-backend (service + rota); esta skill mantém o contrato documentado.
- **Quando evitar:** se a área B só precisa ler dados já em tabela acessível por RLS, preferir leitura direta (repository) em vez de API interna.

Registrar APIs internas aqui quando forem criadas (nome, propósito, consumidor).

---

## Onde documentar

- **Documento principal (obrigatório esta skill atualizar):** PROJECT_INTEGRATIONS.md (ou equivalente em `.context/docs/`) – tabela de módulos e vínculos; quem fala com quem; campos de integração e campos comuns.
- **Fluxo de dados geral:** [data-flow.md](.context/docs/data-flow.md) – seção Integração entre módulos e Fontes e destinos externos.
- **Contrato detalhado:** este reference ou ADR se for decisão de arquitetura.
- **Novo satélite ou nova API interna:** adicionar na tabela correspondente neste reference; atualizar o doc de integração; atualizar data-flow se alterar fluxo geral.

---

## Links

- [data-flow.md](.context/docs/data-flow.md) – fluxo de dados e integração.
- [project-overview.md](.context/docs/project-overview.md) – objetivos e sistemas externos.
- [architecture.md](.context/docs/architecture.md) – princípios e componentes.
- [F3F-backend](.cursor/skills/F3F-backend/SKILL.md) – implementação de services e rotas.
