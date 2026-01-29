# Importação da planilha AgenciaF3F.xlsx

## O que foi implementado

- **Fase 0:** Script `npm run import:inspect` — lê `Estrutura/AgenciaF3F.xlsx`, grava estrutura em `.context/import-estrutura.json`.
- **Fase 1–2:** Mapeamento em `.context/import-mapping.json`; validação com Zod no CLI.
- **Fase 3:** CLI `npm run import:clientes` — importa clientes (requer `.env` com `VITE_SUPABASE_*`, `IMPORTER_EMAIL`, `IMPORTER_PASSWORD`). Use `--dry-run` para apenas validar.
- **Fase 4:** Modo “sempre criar” (sem checagem de duplicados).
- **Fase 5:** Geração de migrations de seed e aplicação via MCP (protocolo `Aplicar_Migration`).

## Scripts

| Comando | Descrição |
|--------|-----------|
| `npm run import:inspect` | Inspeciona o xlsx e atualiza `.context/import-estrutura.json` |
| `npm run import:equipe` | **Via rotina:** Auth Admin API + `usuarios`. Requer `SUPABASE_SERVICE_ROLE_KEY`. |
| `npm run import:clientes` | Importa clientes (env obrigatório). Use `--dry-run` para só validar. |
| `npm run import:links` | **Via rotina:** cria `cliente_links` pela API. Requer clientes existentes; match por nome. |
| `npm run import:responsaveis` | Vincula `responsavel_id` dos clientes conforme coluna "Responsável" do xlsx. Match por nome (usuarios.name). |
| `npm run import:sql` | Regenera migrations de seed (equipe + clientes) a partir do xlsx. |

## Migrations de seed

1. **Equipe:** `20260129130000_seed_equipe_usuarios.sql` (Rafinha) e `20260129130100_seed_equipe_usuarios_remaining.sql` (Rafão, Arthur, Diogo, Yuri, Denzel, Mazon, Paulo, Lucão, Gui Careca, Gonkas).
2. **Clientes:** `20260129140000_seed_clientes.sql` — 104 clientes com `responsavel_id` dos usuários da equipe.

**Senha inicial dos usuários seed:** `F3f@123trocar`

### Aplicar via protocolo Aplicar_Migration (MCP)

Seguir `Commands/Aplicar_Migration.md`. Ordem:

1. `20260129130100_seed_equipe_usuarios_remaining.sql` → nome MCP: `seed_equipe_usuarios_remaining`
2. `20260129140000_seed_clientes.sql` → nome MCP: `seed_clientes`

Gerar payloads para o MCP: `npm run apply:seed-mcp` (grava `.context/mcp_args_remaining.json` e `.context/mcp_args_clientes.json`). Ou manualmente:

```bash
node scripts/mcp-apply-args.mjs supabase/migrations/20260129130100_seed_equipe_usuarios_remaining.sql .context/mcp_args_remaining.json
node scripts/mcp-apply-args.mjs supabase/migrations/20260129140000_seed_clientes.sql .context/mcp_args_clientes.json
```

Usar o tool `apply_migration` do MCP `user-supabaseF3F` com `name` e `query` do JSON gerado (na ordem acima). **Já aplicado** nesta ordem em 2025-01-27.

## Importar via rotina (recomendado)

Para **equipe** e **links** o ideal é usar as rotinas do sistema (Auth API + API de links), em vez de INSERT direto no banco. Assim o cadastro passa pelos fluxos normais da aplicação.

### 1. Equipe

Configure `.env` com **service role** (Dashboard Supabase → Settings → API → `service_role`):

```env
VITE_SUPABASE_URL=https://....supabase.co
SUPABASE_SERVICE_ROLE_KEY=...   # nunca exponha no front-end
```

Depois:

```bash
npm run import:equipe -- --dry-run   # Só listar
npm run import:equipe                # Criar usuários (Auth Admin API) + upsert em usuarios
```

Senha inicial: `F3f@123trocar`.

### 2. Clientes

```env
VITE_SUPABASE_ANON_KEY=...
IMPORTER_EMAIL=adm@agenciaf3f.com.br
IMPORTER_PASSWORD=...
```

```bash
npm run import:clientes -- --dry-run
npm run import:clientes
```

A equipe precisa já existir; o CLI faz match do “Responsável” com `usuarios` (nome/email).

### 3. Links

Com clientes já importados:

```bash
npm run import:links -- --dry-run
npm run import:links
```

Usa as colunas de link da planilha (`linkColumns` em `import-mapping.json`): Conta de Anúncio - F3F, Instagram link, Dashboard, etc. Cada URL vira um registro em `cliente_links` (tipo = nome da coluna).

### 4. Responsáveis

Com clientes e usuários (equipe) já cadastrados, vincule o responsável de cada cliente conforme a coluna **Responsável** da planilha:

```bash
npm run import:responsaveis -- --dry-run   # Só simular
npm run import:responsaveis                # Atualizar clientes.responsavel_id
```

Requer `.env`: `VITE_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`. Match do valor da coluna (ex.: Diogo, Rafão, Yuri) com `usuarios.name`. Opcional: `clientes.responsavelMapping` em `import-mapping.json` para apelidos → nome em usuarios.
