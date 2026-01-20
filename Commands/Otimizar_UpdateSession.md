# Protocolo: Otimização de Chamadas updateSession() e Auth

## Objetivo
Reduzir requisições desnecessárias ao Supabase Auth, evitando bloqueios por rate limit e melhorando a performance do sistema.

## Problema Identificado
Chamadas excessivas a `updateSession()` e `supabase.auth.getUser()` estão gerando muitas requisições ao Supabase Auth, potencialmente causando bloqueios por rate limit.

## Estratégia de Revisão

### Fase 1: Identificação e Mapeamento
1. **Localizar todas as chamadas**:
   - `updateSession()`
   - `supabase.auth.getUser()`
   - `createClient()` em contextos que podem ser otimizados
   - Middleware e rotas de API

2. **Categorizar por tipo**:
   - ✅ **NECESSÁRIAS**: Rotas que realmente precisam verificar autenticação
   - ⚠️ **CONDICIONAIS**: Rotas que podem usar cache ou validação local
   - ❌ **DESNECESSÁRIAS**: Rotas que não precisam de verificação (APIs, assets, etc.)

### Fase 2: Critérios de Decisão

#### ✅ DEVE usar `updateSession()`:
- Rotas protegidas de páginas (não APIs)
- Rotas que precisam validar sessão antes de renderizar
- Rotas de login/logout que precisam atualizar cookies

#### ⚠️ PODE otimizar (usar cache/contexto local):
- Rotas que já validaram sessão recentemente
- Rotas que usam contexto local válido
- Rotas que podem usar sessão em cache

#### ❌ NÃO DEVE usar `updateSession()`:
- Rotas de API (`/api/*`) - fazem autenticação própria
- Assets estáticos (`/_next/static/*`, `/public/*`)
- Rotas que não precisam de autenticação
- Middleware que já validou em requisição anterior

### Fase 3: Plano de Execução por Partes

#### Parte 1: Middleware (✅ CONCLUÍDO)
- [x] Remover `updateSession()` de rotas `/api/*`
- [x] Manter apenas para rotas de páginas que precisam
- [x] Usar contexto local quando disponível

#### Parte 2: Rotas de API
- [ ] Revisar todas as rotas em `/app/api/**`
- [ ] Verificar se estão usando `createClient()` do server corretamente
- [ ] Garantir que não há chamadas duplicadas a `auth.getUser()`

#### Parte 3: Componentes e Hooks
- [ ] Revisar hooks que criam clientes Supabase
- [ ] Verificar se há criação de múltiplos clientes
- [ ] Implementar singleton ou cache de clientes quando apropriado

#### Parte 4: Páginas e Layouts
- [ ] Revisar layouts que podem estar verificando auth desnecessariamente
- [ ] Verificar páginas que fazem múltiplas verificações
- [ ] Implementar cache de sessão quando apropriado

#### Parte 5: Serviços e Utilitários
- [ ] Revisar serviços que criam clientes Supabase
- [ ] Verificar se há reutilização de clientes
- [ ] Otimizar criação de clientes em loops

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
// ❌ ANTES (no middleware)
if (pathname.startsWith('/api')) {
  await updateSession(request) // DESNECESSÁRIO
}

// ✅ DEPOIS
if (pathname.startsWith('/api')) {
  return NextResponse.next({ request }) // APIs fazem auth própria
}
```

### Padrão 2: Cache de Sessão
```typescript
// ❌ ANTES
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser() // Sempre chama API

// ✅ DEPOIS
// Usar contexto local se disponível e válido
if (hasValidLocalContext()) {
  return { user: getLocalContext().user }
}
// Só chamar API se necessário
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
```

### Padrão 3: Reutilização de Cliente
```typescript
// ❌ ANTES
function getData() {
  const supabase = createClient() // Novo cliente a cada chamada
  return supabase.from('table').select()
}

// ✅ DEPOIS
class DataService {
  private supabase = createClient() // Cliente reutilizado
  getData() {
    return this.supabase.from('table').select()
  }
}
```

### Padrão 4: Validação Condicional
```typescript
// ❌ ANTES
export async function middleware(request: NextRequest) {
  await updateSession(request) // Sempre chama
}

// ✅ DEPOIS
export async function middleware(request: NextRequest) {
  // Só atualizar se necessário
  if (needsSessionUpdate(request)) {
    await updateSession(request)
  }
}
```

## Métricas de Sucesso

### Antes da Otimização
- Requisições ao `/auth/v1/user`: ~X por minuto
- Rate limit errors: ~Y por dia
- Tempo médio de resposta: ~Z ms

### Após Otimização (Meta)
- Requisições ao `/auth/v1/user`: Redução de 70-90%
- Rate limit errors: 0
- Tempo médio de resposta: Redução de 20-30%

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

1. ✅ **Parte 1: Middleware** (CONCLUÍDO)
2. ⏭️ **Parte 2: Rotas de API** (PRÓXIMO)
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

1. Executar Parte 2: Revisar rotas de API
2. Criar lista de arquivos para revisão
3. Aplicar checklist em cada arquivo
4. Monitorar resultados
5. Iterar conforme necessário
