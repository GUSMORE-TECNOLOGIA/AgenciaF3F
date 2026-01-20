# 🛡️ Checklist de Segurança - Repositórios Múltiplos

Este documento ajuda a evitar erros críticos ao trabalhar com múltiplos repositórios.

## ⚠️ ANTES DE QUALQUER OPERAÇÃO CRÍTICA

### 1. Verificar Repositório e Ambiente

```powershell
# Execute este script ANTES de commits/push/migrations
.\scripts\verify-repo.ps1

# Modo strict (bloqueia se detectar problemas)
.\scripts\verify-repo.ps1 -Strict
```

### 2. Verificar Supabase Específico

```powershell
# Valida se está usando a base de dados correta
.\scripts\verify-supabase.ps1

# Modo strict (bloqueia se base estiver incorreta)
.\scripts\verify-supabase.ps1 -Strict
```

## 🔐 Configuração Inicial

### Passo 1: Configurar IDs Esperados do Supabase

Edite `scripts/verify-supabase.ps1` e configure os IDs dos projetos Supabase:

```powershell
$expectedProjects = @{
    "PortalUploaders" = @("seu-projeto-id-portal-uploaders")
    "Organizacao10X" = @("seu-projeto-id-organizacao10x")
}
```

**Como encontrar o ID do projeto:**
1. Acesse o dashboard do Supabase
2. Vá em Settings > General
3. O Project URL contém o ID: `https://[ID-AQUI].supabase.co`

### Passo 2: Ativar Git Hook Pre-Push

```powershell
# No PowerShell (Windows)
cd web
if (Test-Path ".git\hooks\pre-push") {
    Write-Host "Hook já existe"
} else {
    # Copiar hook (se não foi criado automaticamente)
    Copy-Item "..\..\web\.git\hooks\pre-push" ".git\hooks\pre-push" -ErrorAction SilentlyContinue
}

# Dar permissão de execução (Git Bash)
# git update-index --chmod=+x .git/hooks/pre-push
```

## 📋 Checklist Pré-Commit

Antes de fazer `git commit`:

- [ ] Execute `.\scripts\verify-repo.ps1`
- [ ] Confirme que o nome do repositório está correto
- [ ] Confirme que o remote está correto
- [ ] Verifique a branch atual

## 📋 Checklist Pré-Push

Antes de fazer `git push`:

- [ ] Execute `.\scripts\verify-repo.ps1 -Strict`
- [ ] O hook pre-push será executado automaticamente
- [ ] Confirme o remote que aparecer no hook
- [ ] Se aparecer aviso, CANCELE e verifique

## 📋 Checklist Pré-Migration (Supabase)

Antes de executar migrations no Supabase:

- [ ] Execute `.\scripts\verify-supabase.ps1 -Strict`
- [ ] Confirme que o Project ID está correto
- [ ] Verifique o nome do projeto no dashboard do Supabase
- [ ] Se estiver em dúvida, NÃO execute a migration

## 📋 Checklist Pré-Deploy

Antes de fazer deploy:

- [ ] Execute `.\scripts\verify-repo.ps1 -Strict`
- [ ] Execute `.\scripts\verify-supabase.ps1 -Strict`
- [ ] Verifique variáveis de ambiente no Vercel/plataforma
- [ ] Confirme que está no projeto correto na plataforma de deploy

## 🚨 Sinais de Alerta

**CANCELE IMEDIATAMENTE se ver:**

1. ❌ Nome do repositório não bate com remote
2. ❌ Project ID do Supabase diferente do esperado
3. ❌ URL do Supabase apontando para projeto diferente
4. ❌ Mensagens de erro sobre autenticação/conexão inesperadas

## 💡 Boas Práticas

1. **Sempre verifique ANTES, não depois**
2. **Use modo `-Strict` em produção**
3. **Mantenha os IDs atualizados** nos scripts de verificação
4. **Configure aliases** no terminal para acesso rápido:

```powershell
# Adicionar ao $PROFILE
function check-repo { .\scripts\verify-repo.ps1 }
function check-supabase { .\scripts\verify-supabase.ps1 }
function check-all { 
    .\scripts\verify-repo.ps1 -Strict
    .\scripts\verify-supabase.ps1 -Strict 
}
```

## 📞 Em Caso de Erro

Se você acidentalmente:

1. **Fez push para repo errado:**
   - NÃO faça force push imediatamente
   - Verifique o que foi enviado
   - Se for crítico, contacte administradores do repo

2. **Executou migration na base errada:**
   - **PARE IMEDIATAMENTE**
   - NÃO execute mais nada
   - Documente o que foi executado
   - Contate suporte do Supabase se necessário

3. **Conectou app na base errada:**
   - Feche o servidor
   - Verifique `.env.local`
   - Corrija a URL
   - Reinicie o servidor

## 🔄 Atualização dos Scripts

Periodicamente, atualize os scripts com:

- Novos IDs de projetos Supabase
- Novos repositórios
- Novas regras de validação

---

**Última atualização:** 2025-01-XX  
**Mantido por:** Equipe de Desenvolvimento

