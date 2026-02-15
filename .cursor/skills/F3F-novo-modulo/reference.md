# Referência – F3F Novo módulo

Checklist para criar um novo módulo no F3F: **card no dashboard**, **rotas**, **menu** (e sub-opções), **config** e scaffold. **Registro progressivo:** cada módulo criado deve ser listado na tabela ao final.

---

## Checklist de criação (ordem obrigatória para fundação)

| # | Passo | Onde / como | Conferir |
|---|--------|-------------|----------|
| 1 | **Nome e id** | Esta skill | Normalizar nome → id (minúsculo, kebab-case). Verificar se id já existe em "Módulos criados", config de módulos, `src/modules/`, `src/pages/`. |
| 2 | **Card no dashboard** | Config do projeto (ex.: `src/lib/modulos-por-role.ts`) | Adicionar id em ORDEM_APROVADA; em TODOS_MODULOS: id, nome, href: /<id>, descricao, icon. Em MODULOS_POR_ROLE: incluir id nos roles. Se ícone novo, adicionar no componente de card. |
| 3 | **Rotas e scaffold** | Script ou manual | Rodar `bash .cursor/skills/F3F-novo-modulo/scripts/create-module-full.sh <id>`: cria `src/modules/<id>/` (services, repositories, entities, components, dtos) e `src/pages/<id>.tsx`. A página inicial deve seguir o padrão (header com "← Início", título do módulo). |
| 4 | **Menu (sub-opções do módulo)** | Config (ex.: `submodulos-por-modulo.ts`) | Se o arquivo existir: adicionar entrada para moduloId: id com array de itens (ex.: { label: "Início", href: "/<id>" }). Se não existir: criar ou pular conforme convenção do projeto. |
| 5 | **Tabelas no Supabase (se necessário)** | Skill F3F-supabase-data-engineer | Tabelas com FK para entidades centrais; RLS. Só quando o módulo tiver dados próprios. |
| 6 | **Backend (services + repositories)** | Skill F3F-backend | Após scaffold; ao menos um service e um repository quando houver domínio. |
| 7 | **Proteção e perfil** | F3F-auth-rotas | Rotas do módulo protegidas; perfil com acesso ao módulo. |
| 8 | **Integração (se necessário)** | F3F-integracoes-vinculos | Contrato antes de integrar com outro módulo ou satélite. |
| 9 | **Documentação** | Esta skill + F3F-documentacao | Atualizar tabela "Módulos criados" neste reference; Documentação atualiza project-overview e índice. |
| 10 | **Testes** | F3F-qa-tester | Conforme política do projeto. |

---

## Estrutura padrão do módulo

```
src/modules/<nome-modulo>/
├── services/           # Casos de uso (ex.: ClienteService.ts)
├── repositories/       # Acesso Supabase (ex.: ClienteRepository.ts)
├── components/         # Componentes específicos do módulo (telas, formulários)
├── entities/           # Entidades ou tipos do domínio do módulo (ou types/)
├── dtos/               # DTOs de entrada/saída (sufixo Dto; ver skill F3F-backend)
└── (opcional) types/   # Se preferir types/ em vez de entities/
```

O script `scripts/create-module-full.sh` cria essa árvore e a página em `src/pages/<modulo>.tsx`. Uso: `bash .cursor/skills/F3F-novo-modulo/scripts/create-module-full.sh <modulo>` (a partir da raiz do repo).

- **services/:** uma classe ou módulo por arquivo; sufixo `Service`; recebem repositories (ou chamam Supabase via service).
- **repositories/:** encapsulam acesso ao Supabase; referenciam apenas IDs das entidades centrais nas tabelas.
- **components/:** componentes React usados só neste módulo; para compartilhados, usar `src/components/` ou `src/shared/ui/`.
- **entities/ ou types/:** tipos ou classes de domínio do módulo; entidades **centrais** (Cliente, Usuário) ficam em shared/types/domain, não aqui.

Páginas do módulo ficam em **`src/pages/`** (ex.: `src/pages/clientes.tsx` ou `src/pages/atendimento.tsx`). A lógica de negócio fica nos services/repositories do módulo em `src/modules/<id>/`.

---

## Entidades centrais e tabelas do módulo

- **Não criar** tabela de "cliente" ou "usuário" dentro do módulo. Usar sempre **FK** para as tabelas centrais (ex.: `cliente_id`, `user_id`, `pessoa_id`).
- **Tabelas específicas do módulo:** nome claro (ex.: `atendimentos`, `agendamentos`) conforme convenção do projeto (skill F3F-supabase-data-engineer).
- **RLS:** políticas que garantem que o usuário só acessa dados permitidos pelo perfil.

---

## Módulos criados (registro progressivo)

Listar aqui cada módulo criado com esta skill. **Atualizar esta tabela imediatamente após rodar o script de scaffold.**

| Módulo | Descrição breve | Status | Observação |
|--------|------------------|--------|------------|
| *(ex.: clientes)* | Cadastro de clientes; tabela central conforme F3F-entidades-centrais. | Em progresso | Card no dashboard; rota /clientes; scaffold em src/modules/clientes. |
| *(outros)* | | | Preencher ao criar. |

A lista de módulos planejados está em [project-overview.md](.context/docs/project-overview.md) quando existir.

---

## Links

- [project-overview.md](.context/docs/project-overview.md) – objetivos, módulos, regras.
- [architecture.md](.context/docs/architecture.md) – princípios, componentes.
- [F3F-organizar-repositorio](.cursor/skills/F3F-organizar-repositorio/reference.md) – mapa de diretórios.
- [F3F-backend](.cursor/skills/F3F-backend/reference.md) – convenções de services e repositories.
- [F3F-integracoes-vinculos](.cursor/skills/F3F-integracoes-vinculos/reference.md) – contratos entre módulos.
