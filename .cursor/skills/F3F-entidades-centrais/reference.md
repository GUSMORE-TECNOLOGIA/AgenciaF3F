# Referência – F3F Entidades centrais

Modelo de usuário e entidade principal do negócio, tabelas centrais e regras de referência por ID. **Registro progressivo:** decisões sobre nomes de tabelas, campos e convenções documentar aqui.

---

## Modelo das entidades

### Usuário (Auth + perfil)

- **Identidade:** Supabase Auth → `user_id` (UUID). Um login para todo o app.
- **Perfil:** tabela `profiles` (ou extensão de Auth) com papel (role) e, quando aplicável, vínculo com a entidade principal (ex.: usuário ligado a um cliente para contexto).
- **Uso:** em todo módulo, operações usam `auth.uid()`; RLS filtra por `user_id` e por role.
- **Responsável por cadastrar:** fluxo de signup/convite para equipe; perfil criado ou atualizado conforme Configurações.

### Entidade principal do negócio (ex.: Cliente)

- **Conceito:** uma única entidade no banco que representa a pessoa ou o cliente do negócio. Módulos/áreas referenciam por ID; mesmo registro, contextos diferentes quando aplicável.
- **Dono do cadastro:** definir qual área é o ponto de entrada (ex.: módulo Clientes cadastra; outras áreas só referenciam). Nunca duplicar por módulo.
- **Cadastro:** uma área cria o registro na tabela central; demais referenciam por `cliente_id` ou `pessoa_id` e têm tabelas de contexto com FK. Nunca duplicar.

---

## Tabelas centrais (convenção)

Definir e manter aqui os nomes e responsabilidades. Ajustar quando o projeto adotar esquema no Supabase.

| Entidade | Tabela | Responsabilidade |
|----------|--------|-------------------|
| **Usuário / Perfil** | `profiles` (ou extensão de Auth) | Dados do usuário logado; papel; vínculo com entidade principal quando aplicável. |
| **Entidade principal** | **`clientes`** ou **`pessoas`** | Dados cadastrais (nome, documento, contato); um registro por pessoa/cliente. Dono do cadastro conforme regra do projeto. |

- **RLS:** políticas garantem que cada usuário só acessa os dados permitidos pelo perfil. Definir na skill F3F-supabase-data-engineer conforme modelo desta skill.
- **Módulos:** tabelas de módulo têm FK para a tabela central (ex.: `cliente_id`), nunca cópia de nome/CPF como "cadastro do módulo".

---

## Como referenciar (user_id, cliente_id, pessoa_id)

| ID | Uso |
|----|-----|
| **user_id** | Operações do usuário logado; RLS; "quem fez"; vínculo perfil ↔ entidade principal quando aplicável. |
| **cliente_id** / **pessoa_id** | Registro único da entidade principal. Convenção do projeto: definir um (ex.: `cliente_id`). |

- Em **queries e tipos:** sempre usar o ID; buscar dados quando precisar (join ou service). Não armazenar nome/CPF em tabela de módulo "por conveniência".
- **Unicidade:** a tabela central **DEVE** ter constraint UNIQUE no campo de documento (ex.: CPF). Verificar existência antes de `INSERT`; fluxo de merge ou deduplicação se houver legado.

---

## Código (shared / domain)

- **Tipos e entidades** de usuário e entidade principal (interfaces, tipos TypeScript) usados em mais de um módulo devem ficar em **`src/types/`**, **`src/shared/types/`** ou **`src/domain/`** (conforme convenção do projeto), não duplicados em cada módulo.
- **Services/repositories** que criam ou alteram a entidade central podem ficar em um módulo "dono" ou em **shared** se forem usados por vários. Manter um único ponto de escrita para a tabela central; leitura pode ser feita por qualquer módulo via repository com RLS.
- Alinhar com a skill [F3F-backend](.cursor/skills/F3F-backend/reference.md) para estrutura de pastas.

---

## Decisão de nomenclatura (registro progressivo)

| Decisão | Valor (exemplo) | Observação |
|---------|------------------|------------|
| **Nome da tabela entidade principal** | `clientes` ou `pessoas` | Definir e documentar aqui. |
| **FK padrão** | `cliente_id` ou `pessoa_id` | |
| **Identificador Auth** | `user_id` | |

Outras decisões (ex.: campos de `profiles`) documentar abaixo quando definidas.

---

## Links

- [project-overview.md](.context/docs/project-overview.md) – regras de negócio.
- [data-flow.md](.context/docs/data-flow.md) – entidades core e fluxo de dados.
- [F3F-integracoes-vinculos](.cursor/skills/F3F-integracoes-vinculos/reference.md) – contratos entre áreas e integração.
- [F3F-backend](.cursor/skills/F3F-backend/reference.md) – onde ficam services e repositories.
