---
name: F3F-organizar-repositorio
description: "Folder structure and repository organization for F3F (AgenciaF3F). Defines where to put files (src/pages, src/services, src/components, src/shared), cleans up src/ and root, bulk moves files and keeps directory conventions. Use when defining or changing folder structure, moving files, or fixing disorganization."
---

# F3F Organizar repositório

Responsável pela **estrutura de pastas** e por **onde colocar arquivos** no projeto F3F. Define o mapa de diretórios (src/pages, src/services, src/components, src/hooks, src/lib, .context), desfaz bagunça em `src/` e na raiz, move arquivos em massa e mantém convenções. O **conteúdo** do código (limpeza, duplicação, refatoração) é da skill [F3F-limpeza-codigo](.cursor/skills/F3F-limpeza-codigo/SKILL.md); esta skill cuida da **organização física** (pastas e localização dos arquivos). Referência: [AGENTS.md](AGENTS.md) (Repository Map) e [project-overview.md](.context/docs/project-overview.md).

## Regra de ouro

- **Estrutura de pastas** (mapa de diretórios, convenções) → esta skill.
- **Onde colocar** cada tipo de arquivo (página, service, componente, util) → esta skill.
- **Mover arquivos em massa** ou **reorganizar** pastas (ex.: nova área, desfazer bagunça) → esta skill.
- **Limpeza de conteúdo** (código morto, duplicação, refatoração) → skill [F3F-limpeza-codigo](.cursor/skills/F3F-limpeza-codigo/SKILL.md); esta skill não altera o que está dentro dos arquivos, só onde eles ficam.

## Quando usar esta skill

- Definir ou **alterar a estrutura de pastas** do projeto (ex.: adicionar `src/shared/utils/`, reorganizar páginas por domínio).
- Dúvida **"onde coloco este arquivo?"** (novo service, novo componente, util, tipo compartilhado) → consultar o [reference.md](reference.md) e colocar no diretório correto.
- **Desfazer bagunça**: arquivos em pastas erradas, nomes de pasta inconsistentes, raiz poluída; mover e renomear conforme o mapa.
- **Criar uma nova área** do ponto de vista de pastas (ex.: nova pasta em `src/pages/<area>/` com components locais) – a lógica e o código são das skills Backend/Frontend; esta skill define a **estrutura de diretórios**.
- **Mover arquivos em massa** (ex.: extrair utils para `src/lib/` ou `src/shared/utils/`) sem mudar o conteúdo; atualizar imports após a movimentação.
- Atualizar **documentação de estrutura** (AGENTS.md, .context/docs) quando o mapa de diretórios mudar.

## Regras

- **Um mapa único:** a estrutura padrão está no [reference.md](reference.md); todo novo arquivo ou pasta deve seguir esse mapa. Exceções documentar no reference.
- **Mover sem quebrar:** ao mover arquivos, atualizar todos os imports; preferir **aliases** (`@/components/*`, `@/services/*` conforme tsconfig) em vez de caminhos relativos longos. Rodar `npm run build` (e testes se existirem) após reorganização.
- **Raiz limpa:** arquivos de configuração (package.json, tsconfig, tailwind.config, vite.config, .env.example) na raiz; código de aplicação dentro de `src/` (e artefatos em `.context/`). Evitar pastas ou arquivos soltos na raiz que deveriam estar em src ou .context.
- **Registro progressivo:** quando o projeto adotar uma convenção nova (ex.: pasta `src/domain/` para entidades), documentar no [reference.md](reference.md).

## Mapa de diretórios (resumo)

- **`src/pages/`** – Páginas por área (clientes, atendimento, configuracoes, etc.); cada área pode ter `components/` locais.
- **`src/components/`** – Componentes compartilhados (layout, auth, UI reutilizável).
- **`src/services/`** – Serviços e acesso a dados (Supabase, APIs).
- **`src/hooks/`** – Hooks compartilhados (useClientes, useAuth, etc.).
- **`src/lib/`** – Utilitários, validadores (ex.: schemas Zod).
- **`src/contexts/`** – Contextos React (Auth, Modal, etc.).
- **`src/types/`** – Tipos e interfaces compartilhados.
- **`.context/`** – docs, skills, workflow; não é código de aplicação.

Detalhes e "onde colocar cada tipo" no [reference.md](reference.md) (neste diretório).

## Integração com outras skills

- **Limpeza de código (F3F-limpeza-codigo):** conteúdo (remover morto, unificar); esta skill = onde os arquivos ficam. Ao extrair código para shared/lib, a Limpeza pode indicar "mover para src/lib"; esta skill garante que a pasta existe e que o arquivo vai para o lugar certo.
- **Backend / Frontend / Componentes:** definem o que vai dentro de cada arquivo; esta skill define em qual pasta o arquivo vive.
- **Documentação (F3F-documentacao):** ao mudar estrutura, atualizar AGENTS.md (Repository Map) e índice em `.context/docs/README.md` se necessário.

## Referência adicional

- Mapa completo, onde colocar cada tipo de arquivo e convenções: [reference.md](reference.md) (neste diretório).
- Repository Map do projeto: [AGENTS.md](AGENTS.md).
