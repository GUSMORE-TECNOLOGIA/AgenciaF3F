# Guia de Deploy na Vercel - AgenciaF3F

## ✅ Arquivos de Configuração Criados

- `vercel.json` - Configuração do projeto Vercel
- `.gitignore` - Já configurado (inclui `.env`)

## 🚀 Opção 1: Deploy via Integração GitHub (RECOMENDADO)

Esta é a forma mais fácil e automática. Cada push no GitHub criará um deploy automático.

### Passos:

1. **Acesse o Dashboard da Vercel:**
   - Vá para: https://vercel.com/dashboard
   - Faça login com sua conta

2. **Adicione Novo Projeto:**
   - Clique em "Add New..." → "Project"
   - Ou acesse: https://vercel.com/new

3. **Importe do GitHub:**
   - Selecione "Import Git Repository"
   - Conecte sua conta GitHub se necessário
   - Procure por: `GUSMORE-TECNOLOGIA/AgenciaF3F`
   - Clique em "Import"

4. **Configure o Projeto:**
   - **Project Name:** `agenciaf3f` ou `agencia-f3f`
   - **Framework Preset:** Vite (deve detectar automaticamente)
   - **Root Directory:** `./` (raiz)
   - **Build Command:** `npm run build` (já configurado no vercel.json)
   - **Output Directory:** `dist` (já configurado no vercel.json)
   - **Install Command:** `npm install`

5. **Configure Variáveis de Ambiente:**
   - VITE_SUPABASE_URL: `https://rhnkffeyspymjpellmnd.supabase.co`
   - VITE_SUPABASE_ANON_KEY: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJobmtmZmV5c3B5bWpwZWxsbW5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY5NjA0MDAsImV4cCI6MjA1MjUzNjQwMH0.5OiPMqz8dPoC9O-qJMx_DkSxS21bZJZI9mEINJlgYFQ`
   - Clique em "Add" para cada variável

6. **Clique em "Deploy"**

7. **Configure o Domínio Personalizado:**
   - Após o deploy, vá em "Settings" → "Domains"
   - Clique em "Add Domain"
   - Digite: `agenciaf3f.app`
   - Siga as instruções para configurar os DNS

## 🔧 Opção 2: Deploy via CLI (Alternativa)

Se preferir usar a CLI:

### 1. Login na Vercel CLI:

```powershell
cd C:\Projetos\AgenciaF3F
vercel login
```

### 2. Fazer Deploy:

```powershell
vercel --prod
```

Quando solicitado:
- **Set up and deploy?** → Y
- **Which scope?** → GUSMORE TECNOLOGIA
- **Link to existing project?** → N (primeira vez)
- **Project name:** `agenciaf3f`
- **Directory:** `./`

### 3. Configurar Variáveis de Ambiente:

```powershell
vercel env add VITE_SUPABASE_URL production
# Cole: https://rhnkffeyspymjpellmnd.supabase.co

vercel env add VITE_SUPABASE_ANON_KEY production
# Cole: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJobmtmZmV5c3B5bWpwZWxsbW5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY5NjA0MDAsImV4cCI6MjA1MjUzNjQwMH0.5OiPMqz8dPoC9O-qJMx_DkSxS21bZJZI9mEINJlgYFQ
```

### 4. Configurar Domínio:

```powershell
vercel domains add agenciaf3f.app
```

Siga as instruções para configurar os registros DNS.

## 🌐 Configuração DNS do Domínio agenciaf3f.app

Após adicionar o domínio na Vercel, você receberá instruções de DNS. Geralmente:

1. **Acesse o painel do seu registrar de domínio** (onde você comprou agenciaf3f.app)

2. **Adicione os registros DNS:**
   - **Tipo:** CNAME
   - **Nome:** @ ou agenciaf3f.app
   - **Valor:** cname.vercel-dns.com (ou o fornecido pela Vercel)
   
   OU

   - **Tipo:** A
   - **Nome:** @
   - **Valor:** 76.76.21.21 (IP fornecido pela Vercel)

3. **Aguarde a propagação DNS** (pode levar de minutos a horas)

## ✅ Verificação

Após o deploy:

1. Acesse: https://vercel.com/dashboard
2. Encontre o projeto `agenciaf3f`
3. Verifique se o domínio está configurado
4. Teste a aplicação em: https://agenciaf3f.app

## 📝 Notas Importantes

- ⚠️ **Nunca commite o arquivo `.env`** - variáveis devem ser configuradas na Vercel
- ✅ O arquivo `vercel.json` já está configurado para SPA React Router
- ✅ Cada push no branch `main` criará um deploy automático (se usar integração GitHub)
- ✅ Preview deployments são criados automaticamente para Pull Requests

## 🔄 Atualizações Futuras

Após configurar a integração GitHub:
- Cada `git push` no branch `main` = deploy automático em produção
- Cada Pull Request = preview deployment automático
- Não é necessário fazer nada manualmente!
