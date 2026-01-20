# Protocolo: Otimização de Chamadas updateSession() e Auth

## Objetivo
Reduzir requisições desnecessárias ao Supabase Auth, evitando bloqueios por rate limit e melhorando a performance do sistema.

## Contexto do AgenciaF3F
- Projeto Vite/React (sem middleware/rotas server-side).
- Não usamos `updateSession()` neste projeto.
- Há apenas 1 chamada a `supabase.auth.getUser()` em `src/contexts/AuthContext.tsx` (fallback de perfil).

## Estratégia de Revisão

### Fase 1: Identificação e Mapeamento
1. **Localizar todas as chamadas**:
   - `updateSession()` (não aplicável neste projeto)
   - `supabase.auth.getUser()`
   - `createClient()` em contextos que podem ser otimizados
   - Middleware e rotas de API (não aplicável)

2. **Categorizar por tipo**:
   - ✅ **NECESSÁRIAS**: Rotas que realmente precisam verificar autenticação
   - ⚠️ **CONDICIONAIS**: Rotas que podem usar cache ou validação local
   - ❌ **DESNECESSÁRIAS**: Rotas que não precisam de verificação (APIs, assets, etc.)

### Fase 2: Critérios de Decisão

#### ✅ DEVE usar `updateSession()`:
- N/A neste projeto (sem middleware/SSR)

#### ⚠️ PODE otimizar (usar cache/contexto local):
- Rotas que já validaram sessão recentemente
- Rotas que usam contexto local válido
- Rotas que podem usar sessão em cache
 - Componentes que podem ler `useAuth()` sem chamar `auth.getUser()`

#### ❌ NÃO DEVE usar `updateSession()`:
- N/A (sem middleware)

### Fase 3: Plano de Execução por Partes

#### Parte 1: Middleware (N/A)
- Este projeto não possui middleware.

#### Parte 2: Rotas de API (N/A)
- Este projeto não possui rotas server-side.

#### Parte 3: Componentes e Hooks
- [ ] Garantir que componentes usam `useAuth()` em vez de chamar `auth.getUser()` diretamente
- [ ] Evitar criar novo client do Supabase fora de `src/services/supabase.ts`

#### Parte 4: Páginas e Layouts
- [ ] Evitar `auth.getUser()` em páginas; usar `useAuth()`

#### Parte 5: Serviços e Utilitários
- [ ] Garantir que serviços importam `supabase` do singleton em `src/services/supabase.ts`

### Fase 4: Checklist de Revisão por Arquivo

Para cada arquivo que usa Supabase Auth:

```
[ ] Arquivo: _______________
[ ] Tipo: [ ] Middleware [ ] API Route [ ] Component [ ] Hook [ ] Service
[ ] Chamadas encontradas:
    - updateSession(): ___ vezes
    - auth.getUser(): ___ vezes
    - createClient(): ___ vezes
[ ] Análise:
    - [ ] Todas as chamadas são necessárias?
    - [ ] Pode usar cache/contexto local?
    - [ ] Pode reutilizar cliente existente?
    - [ ] Está em loop ou chamada repetitiva?
[ ] Ação necessária:
    - [ ] Remover chamadas desnecessárias
    - [ ] Implementar cache
    - [ ] Otimizar criação de clientes
    - [ ] Nenhuma ação necessária
[ ] Status: [ ] Pendente [ ] Em revisão [ ] Otimizado [ ] Validado
```

## Padrões de Otimização

### Padrão 1: Rotas de API
```typescript
// N/A neste projeto (sem middleware/SSR)
```

### Padrão 2: Cache de Sessão
```typescript
// ✅ Preferir contexto local
const { user } = useAuth()
if (!user) return null
```

### Padrão 3: Reutilização de Cliente
```typescript
// ✅ DEPOIS (AgenciaF3F)
import { supabase } from '@/services/supabase'
export async function getData() {
  return supabase.from('table').select()
}
```

### Padrão 4: Validação Condicional
```typescript
// N/A neste projeto (sem middleware)
```

## Métricas de Sucesso

### Antes da Otimização
- Requisições ao `/auth/v1/user`: mínimas (1 chamada em AuthContext)
- Rate limit errors: 0
- Tempo médio de resposta: N/A

### Após Otimização (Meta)
- Requisições ao `/auth/v1/user`: manter baixas (evitar novas chamadas diretas)
- Rate limit errors: 0

## Ferramentas de Monitoramento

1. **Logs do Supabase**:
   - Verificar requisições a `/auth/v1/user`
   - Monitorar rate limit errors
   - Analisar padrões de uso

2. **Logs da Aplicação**:
   - Adicionar logs em chamadas críticas
   - Rastrear criação de clientes
   - Monitorar cache hits/misses

3. **Dashboard do Supabase**:
   - Verificar rate limits atuais
   - Monitorar uso de recursos
   - Ajustar limites se necessário

## Ordem de Execução Recomendada

1. ✅ **Parte 1: Middleware** (N/A)
2. ✅ **Parte 2: Rotas de API** (N/A)
3. ⏭️ **Parte 3: Componentes e Hooks**
4. ⏭️ **Parte 4: Páginas e Layouts**
5. ⏭️ **Parte 5: Serviços e Utilitários**

## Validação Pós-Otimização

Após cada parte:
1. ✅ Testar funcionalidades afetadas
2. ✅ Verificar logs do Supabase
3. ✅ Confirmar redução de requisições
4. ✅ Validar que não quebrou nada
5. ✅ Documentar mudanças

## Notas Importantes

- ⚠️ **NÃO remover** autenticação necessária para segurança
- ✅ **SEMPRE testar** após cada otimização
- 📝 **DOCUMENTAR** todas as mudanças
- 🔄 **REVISAR** logs regularmente
- 🎯 **FOCO** em reduzir requisições, não em remover segurança

## Próximos Passos

1. Revisar novos componentes/hooks que usem Supabase Auth
2. Garantir uso do `useAuth()` e singleton `supabase`
3. Atualizar este protocolo quando o projeto ganhar SSR/APIs
