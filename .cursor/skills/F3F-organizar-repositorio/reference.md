# Referência – F3F Organizar repositório

Mapa de diretórios e convenções de onde colocar arquivos. **Registro progressivo:** alterações na estrutura (novas pastas, exceções) documentar aqui e em AGENTS.md quando for mudança de scaffolding.

---

## Mapa de diretórios (padrão F3F – Vite + React)

```
src/
├── main.tsx
├── App.tsx
├── index.css
├── vite-env.d.ts
├── pages/                    # Páginas por área (rotas)
│   ├── auth/
│   ├── clientes/
│   │   └── components/       # Componentes específicos da área
│   ├── atendimento/
│   ├── configuracoes/
│   ├── financeiro/
│   ├── ocorrencias/
│   ├── planos/
│   ├── servicos/
│   └── Dashboard.tsx
├── components/               # Componentes compartilhados
│   ├── auth/
│   ├── layout/
│   └── ...
├── services/                 # Serviços e acesso a dados (Supabase, APIs)
├── hooks/                    # Hooks compartilhados
├── lib/                      # Utilitários, validadores (ex.: schemas Zod)
│   └── validators/
├── contexts/                 # Contextos React (Auth, Modal, etc.)
└── types/                    # Tipos e interfaces compartilhados

.context/                     # Docs, skills, artefatos de IA
├── docs/
│   ├── guias/                # Guias operacionais (setup, deploy, migrações, checklists)
│   └── ...
├── workflow/
└── ...

Commands/                     # Comandos e playbooks (Git, migrações, segurança) – mantido na raiz; ver .context/docs/README
```

Raiz: `package.json`, `tsconfig.json`, `tailwind.config.js`, `vite.config.ts`, `.env.example`, `README.md`, `AGENTS.md`, `CONVENTIONS.md`. Guias operacionais (APLICAR_MIGRATIONS, CRIAR_USUARIO_ADMIN, VERCEL_DEPLOY, etc.) foram movidos para `.context/docs/guias/`. Código de aplicação em `src/`; artefatos e contexto em `.context/`.

**Pastas de outros agentes (fora do escopo F3F):** `.agent/`, `.claude/`, `.codex/`, `.continue/`, `.gemini/`, `.windsurf/`, `.zed/`, `.trae/` – não são movidas nem alteradas pela skill Organizar; podem ser referenciadas no mapa apenas como “configurações de outros IDEs/agentes”.

---

## Onde colocar cada tipo de arquivo

| Tipo | Diretório | Observação |
|------|-----------|------------|
| **Páginas (rotas)** | `src/pages/<area>/` | Ex.: clientes, atendimento, configuracoes. Uma pasta por área. |
| **Componentes de uma área** | `src/pages/<area>/components/` | Componentes usados só naquela área (ex.: ClienteForm, tabs). |
| **Componentes compartilhados** | `src/components/` | Layout, auth, UI reutilizável entre áreas. |
| **Services (dados/API)** | `src/services/` | Ex.: clientes.ts, supabase.ts, equipe.ts. |
| **Hooks compartilhados** | `src/hooks/` | Ex.: useClientes, useAuth, useDashboard. |
| **Validadores (Zod, etc.)** | `src/lib/validators/` | Schemas de validação. |
| **Outros utils** | `src/lib/` | Helpers, formatação, quando não forem validadores. |
| **Contextos React** | `src/contexts/` | AuthContext, ModalContext, etc. |
| **Tipos compartilhados** | `src/types/` | Interfaces e tipos usados em mais de um lugar. |
| **Testes** | Junto ao arquivo (`*.spec.ts`) ou `__tests__/` na pasta | Convenção do projeto. |
| **Documentação** | `.context/docs/` | ADRs, arquitetura, project-overview. |
| **Skills** | `.cursor/skills/` | Não mover para src. |

---

## Convenções de pastas

- **Áreas (pages):** nome em minúsculo, plural quando for lista (clientes, atendimento, planos, servicos).
- **Subpastas por área:** `components/` para componentes específicos da área; manter padrão consistente.
- **services:** um arquivo por domínio ou recurso (clientes.ts, equipe.ts); não colocar regras de negócio pesadas fora de services/hooks.
- **components:** agrupar por função (layout/, auth/) quando fizer sentido.

---

## Padrão de imports (aliases)

Utilizar **aliases** definidos em `tsconfig.json` (paths) para evitar caminhos relativos longos. Isso reduz quebras ao mover arquivos.

| Alias (verificar tsconfig) | Uso |
|----------------------------|-----|
| **@/** ou **@/*** | Raiz de `src/` (ex.: `@/components/`, `@/services/`). |

Exemplo: `import { useClientes } from '@/hooks/useClientes'` em vez de `import { useClientes } from '../../../hooks/useClientes'`. Definir paths em `tsconfig.json` (ex.: `"paths": { "@/*": ["./src/*"] }`).

---

## Desfazer bagunça (checklist)

- Arquivos de **código de aplicação** fora de `src/` → mover para o diretório correto dentro de `src/` conforme a tabela acima.
- **Pasta com nome inconsistente** (ex.: maiúsculas, singular/plural misturado) → renomear para o padrão (minúsculo, consistente com o resto).
- **Raiz** com muitos arquivos ou pastas que são código → mover para `src/` ou `.context/` conforme o caso.
- **Imports** quebrados após mover → atualizar todos os caminhos; preferir aliases; rodar build (e testes se existirem).
- **Documentação:** atualizar AGENTS.md (Repository Map) e `.context/docs/README.md` se a estrutura tiver mudado de forma relevante.

---

## Registro progressivo

Alterações na estrutura adotadas pelo projeto.

| Item | Descrição |
|------|------------|
| Guias na raiz → `.context/docs/guias/` | Guias operacionais (APLICAR_MIGRATIONS, CRIAR_USUARIO_ADMIN, VERCEL_DEPLOY, etc.) movidos para `.context/docs/guias/`; índice em `.context/docs/README.md`. |
| `Commands/` | Mantido na raiz como pasta de comandos/playbooks; referência no índice de docs. |
| Pastas de outros agentes | `.agent/`, `.claude/`, `.codex/`, etc. – fora do escopo F3F; não movidas. |

---

## Links

- [AGENTS.md](AGENTS.md) – Repository Map.
- [project-overview.md](.context/docs/project-overview.md) – stack e estrutura.
- [F3F-limpeza-codigo](.cursor/skills/F3F-limpeza-codigo/SKILL.md) – conteúdo dos arquivos; esta skill = onde ficam.
- [F3F-backend](.cursor/skills/F3F-backend/SKILL.md) – quando existir, estrutura de services.
