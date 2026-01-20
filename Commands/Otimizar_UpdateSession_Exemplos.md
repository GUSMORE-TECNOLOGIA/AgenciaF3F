# Exemplos: Como Aplicar Otimizacoes (AgenciaF3F)

## Exemplo 1: Evitar auth.getUser() em componentes

### ❌ ANTES
```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(url, key)
const { data: { user } } = await supabase.auth.getUser()
```

### ✅ DEPOIS (useAuth)
```typescript
import { useAuth } from '@/contexts/AuthContext'

const { user } = useAuth()
if (!user) return null
```

Observacao: este projeto nao usa rotas server-side, entao helpers `requireAuth()`/`withAuth()` nao se aplicam aqui.

## Exemplo 2: Reutilizar client do Supabase

### ❌ ANTES
```typescript
function getData() {
  const supabase = createClient(url, key)
  return supabase.from('clientes').select()
}
```

### ✅ DEPOIS (singleton do projeto)
```typescript
import { supabase } from '@/services/supabase'

export async function getData() {
  return supabase.from('clientes').select()
}
```

## Exemplo 3: Otimizar hooks

### ❌ ANTES
```typescript
export function useMentoria() {
  const fetchData = async () => {
    const supabase = createClient(url, key) // novo client a cada chamada
    const { data: { user } } = await supabase.auth.getUser()
    // ...
  }
}
```

### ✅ DEPOIS
```typescript
import { supabase } from '@/services/supabase'

export function useMentoria() {
  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    // ...
  }
}
```

## Exemplo 4: Utilitarios

### ❌ ANTES
```typescript
export async function getClienteId() {
  const supabase = createClient(url, key)
  const { data: { user } } = await supabase.auth.getUser()
  // ...
}
```

### ✅ DEPOIS
```typescript
import { supabase } from '@/services/supabase'

export async function getClienteId() {
  const { data: { user } } = await supabase.auth.getUser()
  // ...
}
```

## Checklist de aplicacao

1. [ ] Usa `auth.getUser()` diretamente em componente? -> trocar por `useAuth()`
2. [ ] Cria client Supabase localmente? -> usar `supabase` de `src/services/supabase.ts`
3. [ ] Chamadas repetidas na mesma tela? -> reutilizar dados do contexto
4. [ ] Evitar criar client em loops

## Ordem recomendada

1. Componentes/Hooks com `auth.getUser()`
2. Servicos e utilitarios com `createClient()` local
3. Revisar novas integracoes antes de publicar
