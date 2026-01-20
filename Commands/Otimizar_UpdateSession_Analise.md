# Análise: Chamadas auth.getUser() e updateSession()

## Resumo Executivo

**Total de arquivos com chamadas**: ~98 ocorrências de `auth.getUser()`
**Arquivos de API**: 62 arquivos
**Hooks e componentes**: ~4 arquivos
**Utilitários**: ~3 arquivos

## Categorização por Tipo

### 1. Rotas de API (62 arquivos)
**Status**: ✅ **NECESSÁRIAS** - Mas podem ser otimizadas

Todas as rotas de API fazem `auth.getUser()` para autenticação, o que é correto. No entanto, podemos:
- Criar um helper reutilizável para evitar código duplicado
- Implementar cache de sessão quando apropriado
- Verificar se há múltiplas chamadas na mesma rota

**Arquivos principais**:
- `/app/api/pessoas/**` - 15+ arquivos
- `/app/api/aluno/**` - 5 arquivos
- `/app/api/formularios/**` - 6 arquivos
- `/app/api/integrations/**` - 5 arquivos
- `/app/api/linha-editorial/**` - 5 arquivos
- Outros - 26 arquivos

### 2. Hooks (4 arquivos)
**Status**: ⚠️ **REVISAR** - Podem estar criando clientes repetidamente

- `web/lib/hooks/use-mentoria.ts` - 4 chamadas
- `web/lib/hooks/use-campanha.ts` - 1 chamada

**Ação**: Verificar se estão criando novos clientes a cada chamada ou reutilizando.

### 3. Componentes/Páginas (2 arquivos)
**Status**: ⚠️ **REVISAR** - Verificar necessidade

- `web/app/(auth)/role-select/page.tsx` - 2 chamadas
- Outros componentes podem ter chamadas indiretas

### 4. Utilitários (2 arquivos)
**Status**: ⚠️ **REVISAR** - Podem ser otimizados

- `web/lib/utils/get-aluno-pessoa-id.ts` - 2 chamadas
- `web/lib/utils/storage.ts` - 2 chamadas

### 5. Middleware (1 arquivo)
**Status**: ✅ **OTIMIZADO** - Já corrigido

- `web/middleware.ts` - Não chama mais `updateSession()` em rotas `/api/*`

## Padrões Identificados

### Padrão 1: Autenticação em Rotas de API (Muito Comum)
```typescript
// Padrão encontrado em ~60 arquivos
const supabase = await createClient()
const { data: { user }, error: authError } = await supabase.auth.getUser()
if (authError || !user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

**Oportunidade**: Criar helper `requireAuth()` para reduzir código duplicado.

### Padrão 2: Múltiplas Chamadas na Mesma Rota
Alguns arquivos fazem `auth.getUser()` múltiplas vezes:
- `web/app/api/pessoas/[id]/route.ts` - 3 vezes
- `web/app/api/pessoas/[id]/educacional/route.ts` - 3 vezes
- `web/app/api/pessoas/[id]/financeiro/route.ts` - 3 vezes
- `web/lib/hooks/use-mentoria.ts` - 4 vezes

**Oportunidade**: Cachear resultado da primeira chamada.

### Padrão 3: Hooks que Criam Clientes
```typescript
// Padrão em hooks
const supabase = createClient() // Novo cliente a cada render?
const { data: { user } } = await supabase.auth.getUser()
```

**Oportunidade**: Verificar se hooks estão criando clientes desnecessariamente.

## Plano de Ação Detalhado

### Fase 1: Criar Helper de Autenticação (Prioridade ALTA)
**Objetivo**: Reduzir código duplicado e padronizar autenticação

**Arquivo**: `web/lib/auth/require-auth.ts`
```typescript
// Helper para autenticação em rotas de API
export async function requireAuth() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    throw new Error('Unauthorized')
  }
  
  return { user, supabase }
}
```

**Benefícios**:
- Reduz código duplicado
- Facilita manutenção
- Permite adicionar cache futuramente

### Fase 2: Otimizar Rotas com Múltiplas Chamadas (Prioridade MÉDIA)
**Arquivos prioritários**:
1. `web/app/api/pessoas/[id]/route.ts` - 3 chamadas
2. `web/app/api/pessoas/[id]/educacional/route.ts` - 3 chamadas
3. `web/app/api/pessoas/[id]/financeiro/route.ts` - 3 chamadas

**Ação**: Cachear resultado da primeira chamada na mesma requisição.

### Fase 3: Revisar Hooks (Prioridade MÉDIA)
**Arquivos**:
1. `web/lib/hooks/use-mentoria.ts` - Verificar criação de clientes
2. `web/lib/hooks/use-campanha.ts` - Verificar criação de clientes

**Ação**: Garantir que clientes são reutilizados, não criados a cada chamada.

### Fase 4: Revisar Utilitários (Prioridade BAIXA)
**Arquivos**:
1. `web/lib/utils/get-aluno-pessoa-id.ts`
2. `web/lib/utils/storage.ts`

**Ação**: Verificar se podem receber cliente como parâmetro em vez de criar.

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

## Métricas de Progresso

### Antes
- Chamadas `auth.getUser()`: ~98
- Código duplicado: Alto
- Potencial de otimização: Alto

### Meta
- Chamadas `auth.getUser()`: ~62 (apenas 1 por rota de API)
- Código duplicado: Baixo (usando helper)
- Cache implementado: Em rotas com múltiplas chamadas

## Notas Importantes

⚠️ **NÃO remover autenticação necessária**
✅ **SEMPRE testar após cada mudança**
📝 **DOCUMENTAR todas as otimizações**
🔄 **REVISAR logs regularmente**
