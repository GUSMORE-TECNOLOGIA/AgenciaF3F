# Análise: Chamadas auth.getUser() e updateSession()

## Resumo Executivo

**Total de arquivos com chamadas**: 1 ocorrência de `auth.getUser()`
**Arquivos de API**: 0
**Hooks e componentes**: 1 arquivo
**Utilitários**: 0

## Categorização por Tipo

### 1. Rotas de API (0 arquivos)
**Status**: ✅ **N/A**

Não há rotas de API no projeto. Nenhuma chamada `auth.getUser()` em API server-side.

**Arquivos principais**: N/A

### 2. Hooks (0 arquivos)
**Status**: ✅ **N/A**

N/A

**Ação**: N/A

### 3. Componentes/Páginas (1 arquivo)
**Status**: ✅ **OK**

- `src/contexts/AuthContext.tsx` - 1 chamada para fallback de perfil

### 4. Utilitários (0 arquivos)
**Status**: ✅ **N/A**

N/A

### 5. Middleware (0 arquivos)
**Status**: ✅ **N/A**

N/A

## Padrões Identificados

### Padrão 1: Autenticação em Rotas de API
```typescript
// N/A no projeto atual
```

**Oportunidade**: N/A

### Padrão 2: Múltiplas Chamadas na Mesma Rota
N/A

**Oportunidade**: N/A

### Padrão 3: Hooks que Criam Clientes
N/A

**Oportunidade**: N/A

## Plano de Ação Detalhado

### Fase 1: Criar Helper de Autenticação (Prioridade ALTA)
**Objetivo**: N/A para este projeto (sem rotas de API)

**Arquivo**: N/A
N/A

**Benefícios**: N/A

### Fase 2: Otimizar Rotas com Múltiplas Chamadas (Prioridade MÉDIA)
N/A

**Ação**: N/A

### Fase 3: Revisar Hooks (Prioridade MÉDIA)
N/A

**Ação**: N/A

### Fase 4: Revisar Utilitários (Prioridade BAIXA)
N/A

**Ação**: N/A

## Checklist de Revisão por Arquivo

### Template para cada arquivo:
```
[ ] Arquivo: _______________
[ ] Tipo: [ ] API Route [ ] Hook [ ] Component [ ] Utility
[ ] Chamadas auth.getUser(): ___ vezes
[ ] Chamadas createClient(): ___ vezes
[ ] Análise:
    - [ ] Todas as chamadas são necessárias?
    - [ ] Pode usar helper requireAuth()?
    - [ ] Pode cachear resultado?
    - [ ] Pode reutilizar cliente?
[ ] Ação necessária:
    - [ ] Substituir por requireAuth()
    - [ ] Implementar cache
    - [ ] Otimizar criação de clientes
    - [ ] Nenhuma ação
[ ] Status: [ ] Pendente [ ] Em revisão [ ] Otimizado [ ] Validado
```

## Ordem de Execução Recomendada

### Semana 1: Fundação
1. ✅ Criar helper `requireAuth()`
2. ✅ Testar helper em 2-3 rotas
3. ✅ Documentar uso do helper

### Semana 2: Rotas de API - Grupo 1
1. ⏭️ Revisar `/app/api/pessoas/**` (15 arquivos)
2. ⏭️ Aplicar helper onde apropriado
3. ⏭️ Otimizar rotas com múltiplas chamadas

### Semana 3: Rotas de API - Grupo 2
1. ⏭️ Revisar `/app/api/aluno/**` (5 arquivos)
2. ⏭️ Revisar `/app/api/formularios/**` (6 arquivos)
3. ⏭️ Aplicar otimizações

### Semana 4: Rotas de API - Grupo 3
1. ⏭️ Revisar `/app/api/integrations/**` (5 arquivos)
2. ⏭️ Revisar `/app/api/linha-editorial/**` (5 arquivos)
3. ⏭️ Revisar outros (26 arquivos)

### Semana 5: Hooks e Utilitários
1. ⏭️ Revisar hooks
2. ⏭️ Revisar utilitários
3. ⏭️ Validar otimizações

## Checklist rápido (AgenciaF3F)

- [ ] Algum componente chamou `supabase.auth.getUser()` diretamente?
- [ ] Algum hook criou `createClient()` localmente?
- [ ] Existe mais de um client Supabase no mesmo arquivo?
- [ ] Uso do `useAuth()` sempre que possível?
- [ ] Serviços importam `supabase` de `src/services/supabase.ts`?
- [ ] Não há chamadas de `updateSession()` (projeto Vite/React)?

## Métricas de Progresso

### Antes
- Chamadas `auth.getUser()`: 1
- Código duplicado: Baixo
- Potencial de otimização: Baixo

### Meta
- Chamadas `auth.getUser()`: 1 (mantida em `AuthContext` para fallback de perfil)
- Código duplicado: Baixo
- Cache implementado: N/A

## Notas Importantes

⚠️ **NÃO remover autenticação necessária**
✅ **SEMPRE testar após cada mudança**
📝 **DOCUMENTAR todas as otimizações**
🔄 **REVISAR logs regularmente**
