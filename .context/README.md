# Contexto do Projeto - Agência F3F

> **Template:** Em uso para outro projeto, substitua refs em [PROJECT_INTEGRATIONS.md](docs/PROJECT_INTEGRATIONS.md) e `.env` pelos do novo projeto.

Esta pasta contém documentação e scripts de contexto para o projeto Agência F3F.

## Estrutura

```
.context/
├── README.md          # Este arquivo
├── cleanup/           # Scripts SQL de manutenção
│   ├── f3f_apply_all.sql         # Script consolidado para aplicar migrations no F3F
│   └── uploaders_cleanup.sql     # Script para limpar Uploaders (após incidente)
└── docs/              # Documentação do projeto
    └── PROJECT_INTEGRATIONS.md   # Integrações do projeto (CRÍTICO)
```

## Arquivos Importantes

### PROJECT_INTEGRATIONS.md

**LEIA SEMPRE ANTES DE QUALQUER OPERAÇÃO NO SUPABASE**

Este documento contém:
- IDs e URLs dos projetos Supabase
- Credenciais de acesso
- Lista de projetos que NÃO pertencem a este repositório
- Histórico de incidentes

### f3f_apply_all.sql

Script SQL consolidado com TODAS as migrations do projeto.
- Idempotente (pode ser executado múltiplas vezes)
- Cria todas as tabelas, índices, funções, triggers e políticas RLS
- Deve ser executado no Supabase F3F (ID: rhnkffeyspymjpellmnd)

### uploaders_cleanup.sql

Script para remover tabelas criadas por engano no projeto Uploaders.
- Use apenas se tabelas do AgenciaF3F foram criadas no Uploaders
- Projeto Uploaders (ID: thckhkrbqtecouqlnaeq)

## Uso

### Para aplicar todas as migrations:

1. Acesse o Supabase Dashboard: https://app.supabase.com/project/rhnkffeyspymjpellmnd
2. Vá para SQL Editor
3. Cole o conteúdo de `cleanup/f3f_apply_all.sql`
4. Execute

### Para limpar o Uploaders (se necessário):

1. Acesse: https://app.supabase.com/project/thckhkrbqtecouqlnaeq
2. Vá para SQL Editor
3. Cole o conteúdo de `cleanup/uploaders_cleanup.sql`
4. Execute

---

*Última atualização: 16/01/2026*
