# 🛡️ Setup de Segurança - PortalUploaders

> **Template:** Em uso para outro projeto, substitua refs em [.context/docs/PROJECT_INTEGRATIONS.md](../.context/docs/PROJECT_INTEGRATIONS.md) e `.env` pelos do novo projeto.

Este guia ajuda a configurar as proteções contra erros críticos com múltiplos repositórios.

## ✅ O que foi criado

1. **Scripts de Verificação:**
   - `scripts/verify-repo.ps1` - Valida repositório Git e remote
   - `scripts/verify-supabase.ps1` - Valida conexão com Supabase
   - `scripts/setup-git-hooks.ps1` - Configura hooks do Git

2. **Git Hook:**
   - `.git/hooks/pre-push` - Valida antes de cada push

3. **Documentação:**
   - `SECURITY-CHECKLIST.md` - Checklist completo de segurança
   - `REPO-INFO.md` - Informações do repositório
   - `SETUP-SEGURANCA.md` - Este arquivo

## 🚀 Configuração Inicial (FAÇA ISSO AGORA)

### Passo 1: Configurar IDs do Supabase

**IMPORTANTE:** Edite `scripts/verify-supabase.ps1` e adicione os IDs dos seus projetos:

```powershell
# Abra o arquivo scripts/verify-supabase.ps1
# Encontre a seção $expectedProjects e adicione os IDs:

$expectedProjects = @{
    "PortalUploaders" = @(
        "thckhkrbqtecouqlnaeq"  # Substitua pelo ID REAL do seu projeto
    )
    "Organizacao10X" = @(
        "abc123xyz456"  # Substitua pelo ID REAL do outro projeto
    )
}
```

**Como encontrar o ID:**
1. Acesse https://app.supabase.com
2. Selecione o projeto
3. Settings > General > Project URL
4. Copie a parte antes de `.supabase.co`

### Passo 2: Testar os Scripts

```powershell
# Testar verificação de repositório
.\scripts\verify-repo.ps1

# Testar verificação de Supabase
.\scripts\verify-supabase.ps1

# Testar modo strict (bloqueia se houver problema)
.\scripts\verify-supabase.ps1 -Strict
```

### Passo 3: Configurar Git Hooks

```powershell
# Executar script de setup
.\scripts\setup-git-hooks.ps1

# Ou manualmente (já foi feito):
git config core.hooksPath .git/hooks
```

### Passo 4: Adicionar Scripts NPM (opcional mas recomendado)

Os scripts já foram adicionados ao `package.json`. Use:

```bash
cd web
npm run verify:repo      # Verificar repositório
npm run verify:supabase  # Verificar Supabase
npm run verify:all       # Verificar ambos
```

## 📋 Uso Diário

### Antes de fazer PUSH

```powershell
# O hook pre-push já vai validar automaticamente
# Mas você pode verificar antes:
.\scripts\verify-repo.ps1 -Strict
git push
```

### Antes de executar MIGRATIONS

```powershell
# SEMPRE verifique antes de rodar migrations!
.\scripts\verify-supabase.ps1 -Strict

# Se estiver tudo certo, então execute a migration
# (exemplo usando MCP Supabase)
```

### Antes de COMMITS importantes

```powershell
# Verificar tudo
.\scripts\verify-repo.ps1
.\scripts\verify-supabase.ps1

# Se estiver tudo certo, commitar
git add .
git commit -m "sua mensagem"
```

## 🚨 Como Funciona a Proteção

### 1. Git Hook Pre-Push

- Executa **automaticamente** antes de cada `git push`
- Valida se o nome do repositório bate com o remote
- Se detectar inconsistência, **pede confirmação**
- Você pode cancelar se estiver no repositório errado

### 2. Script verify-repo.ps1

- Mostra informações do repositório atual
- Verifica remote do Git
- Compara nome da pasta com remote
- Modo `-Strict` **bloqueia** se houver problemas

### 3. Script verify-supabase.ps1

- Lê `.env.local` e extrai URL do Supabase
- Compara Project ID com lista de IDs permitidos
- Modo `-Strict` **bloqueia** se base estiver errada
- Pedirá confirmação antes de continuar

## 💡 Dicas Importantes

1. **Configure os IDs AGORA** - Sem isso, a proteção do Supabase não funciona
2. **Use modo `-Strict` em produção** - Bloqueia operações perigosas
3. **Execute os scripts ANTES, não depois** - Prevenir é melhor que remediar
4. **Atualize os IDs** se criar novos projetos Supabase

## ⚠️ Em Caso de Emergência

Se você acidentalmente:

- **Fez push para repo errado:** Verifique o que foi enviado, não faça force push sem pensar
- **Executou migration na base errada:** PARE imediatamente, documente o que foi feito
- **Conectou app na base errada:** Feche o servidor, corrija `.env.local`, reinicie

## 📞 Próximos Passos

1. ✅ Configure os IDs do Supabase (Passo 1 acima)
2. ✅ Teste os scripts
3. ✅ Faça um push de teste para ver o hook funcionando
4. ✅ Leia `SECURITY-CHECKLIST.md` para checklist completo

---

**Status:** 🟢 Configurado  
**Última atualização:** 2025-01-XX

