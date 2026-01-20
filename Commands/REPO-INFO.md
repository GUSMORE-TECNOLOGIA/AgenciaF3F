# PortalUploaders

**Status:** 🔴 PROJETO ATIVO  
**Última atualização:** 2025-01-XX  
**Branch padrão:** main  
**Ambiente:** Desenvolvimento + Produção

## Identificação Rápida

- **Nome do repositório:** PortalUploaders
- **Caminho local:** `C:\Projetos\PortalUploaders`
- **Remote esperado:** Contém "portaluploaders" no nome/URL

## Configuração de Ambiente

### Supabase

- **Project ID esperado:** [CONFIGURE EM scripts/verify-supabase.ps1]
- **Variáveis necessárias:** Ver `web/VARIAVEIS_AMBIENTE.md`

### GitHub

- **Repositório remoto:** [URL do seu repo GitHub]
- **Proteções:** Hook pre-push ativo

## Verificações Rápidas

```powershell
# Verificar repositório
.\scripts\verify-repo.ps1

# Verificar Supabase
.\scripts\verify-supabase.ps1

# Verificar tudo (modo strict)
.\scripts\verify-repo.ps1 -Strict
.\scripts\verify-supabase.ps1 -Strict
```

## Estrutura do Projeto

```
PortalUploaders/
├── web/                    # Aplicação Next.js
├── scripts/                # Scripts de segurança e utilitários
└── Commands/               # Documentação de comandos
```

## Comandos Úteis

```powershell
# Verificar status completo
git status
.\scripts\verify-repo.ps1

# Antes de push
.\scripts\verify-repo.ps1 -Strict
git push

# Antes de migrations
.\scripts\verify-supabase.ps1 -Strict
```

---

⚠️ **IMPORTANTE:** Sempre execute os scripts de verificação antes de operações críticas!

