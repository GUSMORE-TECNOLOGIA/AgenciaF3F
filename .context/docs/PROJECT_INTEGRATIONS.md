# Agência F3F - Integrações do Projeto

> **DOCUMENTO CRÍTICO**: Este documento define todas as integrações do projeto.
> Consulte SEMPRE este documento antes de qualquer operação de banco de dados.
>
> **Uso como template:** Se este repositório for usado para **outro** projeto ou cliente, substitua aqui e em `.env` todos os refs (Supabase, GitHub, Vercel, domínio e chaves) pelos do novo projeto; caso contrário ferramentas e MCP podem apontar para o projeto errado.

## Supabase

> **Um único Supabase:** O projeto Agência F3F utiliza **apenas este** projeto Supabase (F3F). Não existe outro Supabase para produção; desenvolvimento e produção usam o mesmo projeto. Não pergunte se há outro Supabase.

### Projeto Principal (F3F)

| Campo | Valor |
|-------|-------|
| **Nome** | F3F |
| **Project ID** | `rhnkffeyspymjpellmnd` |
| **URL** | `https://rhnkffeyspymjpellmnd.supabase.co` |
| **Dashboard** | https://app.supabase.com/project/rhnkffeyspymjpellmnd |
| **Região** | South America (São Paulo) |
| **Propósito** | Backend do sistema Agência F3F |

### Credenciais de Acesso

```env
VITE_SUPABASE_URL=https://rhnkffeyspymjpellmnd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJobmtmZmV5c3B5bWpwZWxsbW5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY5NjA0MDAsImV4cCI6MjA1MjUzNjQwMH0.5OiPMqz8dPoC9O-qJMx_DkSxS21bZJZI9mEINJlgYFQ
```

### Usuário Admin

| Campo | Valor |
|-------|-------|
| **Email** | adm@agenciaf3f.com.br |
| **Senha** | adm@123 |
| **Role** | admin |

---

## ⚠️ PROJETOS QUE NÃO PERTENCEM A ESTE REPOSITÓRIO

### Uploaders (Organização 10x)

| Campo | Valor |
|-------|-------|
| **Nome** | Uploaders |
| **Project ID** | `thckhkrbqtecouqlnaeq` |
| **URL** | `https://thckhkrbqtecouqlnaeq.supabase.co` |
| **Propósito** | Backend do projeto Organização 10x V2 (OUTRO PROJETO) |

> **NUNCA** execute migrations ou operações deste projeto no Supabase Uploaders.
> Este projeto é completamente separado e pertence ao workspace `Organizacao10x`.

---

## GitHub

| Campo | Valor |
|-------|-------|
| **Repositório** | https://github.com/GUSMORE-TECNOLOGIA/AgenciaF3F |
| **Organização** | GUSMORE-TECNOLOGIA |
| **Branch Principal** | main |
| **Workflow** | GitHub Flow |
| **Status** | ✅ Repositório criado e código enviado |

---

## Vercel

| Campo | Valor |
|-------|-------|
| **Team** | GUSMORE TECNOLOGIA |
| **Projeto** | agenciaf3f (a criar) |
| **Domínio** | agenciaf3f.app |
| **URL de Produção** | https://agenciaf3f.app (após configurar) |
| **Framework** | Vite (React + TypeScript) |
| **Status** | ⏳ Configuração pronta, aguardando deploy |
| **Configuração** | `vercel.json` criado |
| **Guia de Deploy** | Ver `VERCEL_DEPLOY.md` |

### Variáveis de Ambiente Necessárias

Configure estas variáveis no painel da Vercel:

- `VITE_SUPABASE_URL`: `https://rhnkffeyspymjpellmnd.supabase.co`
- `VITE_SUPABASE_ANON_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJobmtmZmV5c3B5bWpwZWxsbW5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY5NjA0MDAsImV4cCI6MjA1MjUzNjQwMH0.5OiPMqz8dPoC9O-qJMx_DkSxS21bZJZI9mEINJlgYFQ`

---

## Estrutura do Banco de Dados

### Tabelas Principais

| Tabela | Descrição |
|--------|-----------|
| `usuarios` | Perfis de usuários (extensão de auth.users) |
| `clientes` | Clientes da agência |
| `servicos` | Cadastro mestre de serviços |
| `servicos_prestados` | Serviços prestados a clientes (legado) |
| `planos` | Cadastro de planos |
| `plano_servicos` | Relação N:N planos-serviços |
| `cliente_planos` | Contratos de planos |
| `cliente_servicos` | Contratos de serviços avulsos |
| `transacoes` | Transações financeiras |
| `ocorrencia_grupos` | Grupos de ocorrências |
| `ocorrencia_tipos` | Tipos de ocorrências |
| `ocorrencias` | Ocorrências registradas |
| `atendimentos` | Histórico de atendimentos |
| `equipe_membros` | Membros da equipe |
| `cliente_responsaveis` | Responsáveis de clientes |
| `contrato_status_historico` | Histórico de status |

---

## Checklist de Verificação

Antes de qualquer operação de banco de dados:

- [ ] Verificar se está no projeto Supabase correto (F3F)
- [ ] URL deve conter `rhnkffeyspymjpellmnd`
- [ ] Verificar arquivo `.env` está apontando para F3F
- [ ] Verificar se migrations estão na pasta correta (`supabase/migrations/`)

---

## Histórico de Incidentes

### 16/01/2026 - Migrations em Projeto Errado

**Problema**: Migrations foram executadas no projeto Supabase errado (Uploaders ao invés de F3F).

**Causa**: Confusão entre projetos Supabase de diferentes workspaces.

**Resolução**: 
1. Criado script de limpeza para Uploaders: `.context/cleanup/uploaders_cleanup.sql`
2. Criado script consolidado para F3F: `.context/cleanup/f3f_apply_all.sql`
3. Criado este documento de integrações.

**Lição**: Sempre verificar o Project ID antes de executar qualquer operação.

---

## Arquivos de Configuração

### .env

```env
VITE_SUPABASE_URL=https://rhnkffeyspymjpellmnd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJobmtmZmV5c3B5bWpwZWxsbW5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY5NjA0MDAsImV4cCI6MjA1MjUzNjQwMH0.5OiPMqz8dPoC9O-qJMx_DkSxS21bZJZI9mEINJlgYFQ
```

### Localização dos Scripts

| Script | Caminho | Propósito |
|--------|---------|-----------|
| Migrations consolidadas | `.context/cleanup/f3f_apply_all.sql` | Aplicar no F3F |
| Limpeza Uploaders | `.context/cleanup/uploaders_cleanup.sql` | Limpar Uploaders |
| Documentação | `.context/docs/PROJECT_INTEGRATIONS.md` | Este documento |

---

## Resumo de Tabelas

| Tabela | Linhas no Script | RLS |
|--------|-----------------|-----|
| usuarios | ✅ | ✅ |
| clientes | ✅ | ✅ |
| servicos | ✅ | ✅ |
| servicos_prestados | ✅ | ✅ |
| planos | ✅ | ✅ |
| plano_servicos | ✅ | ✅ |
| cliente_planos | ✅ | ✅ |
| cliente_servicos | ✅ | ✅ |
| transacoes | ✅ | ✅ |
| ocorrencia_grupos | ✅ | ✅ |
| ocorrencia_tipos | ✅ | ✅ |
| ocorrencias | ✅ | ✅ |
| atendimentos | ✅ | ✅ |
| equipe_membros | ✅ | ✅ |
| cliente_responsaveis | ✅ | ✅ |
| contrato_status_historico | ✅ | ✅ |

---

*Última atualização: 20/01/2026 10:27:05*
