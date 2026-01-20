# Exemplos: Como Aplicar Otimizações

## Exemplo 1: Substituir Código Duplicado por Helper

### ❌ ANTES (Código Duplicado)
```typescript
// web/app/api/pessoas/[id]/route.ts
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Lógica da rota...
}
```

### ✅ DEPOIS (Usando Helper)
```typescript
// web/app/api/pessoas/[id]/route.ts
import { requireAuth } from '@/lib/auth/require-auth'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { user, supabase } = await requireAuth()
    
    // Lógica da rota...
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
```

### ✅ DEPOIS (Usando withAuth - Mais Limpo)
```typescript
// web/app/api/pessoas/[id]/route.ts
import { withAuth } from '@/lib/auth/require-auth'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  return withAuth(async ({ user, supabase }) => {
    // Lógica da rota...
    return NextResponse.json({ data: '...' })
  })
}
```

## Exemplo 2: Otimizar Rotas com Múltiplas Chamadas

### ❌ ANTES (Múltiplas Chamadas)
```typescript
// web/app/api/pessoas/[id]/route.ts
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  // ... lógica ...
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  // ... lógica ...
}
```

### ✅ DEPOIS (Helper Reutilizado)
```typescript
// web/app/api/pessoas/[id]/route.ts
import { requireAuth } from '@/lib/auth/require-auth'

async function handleRequest(
  handler: (auth: { user: any; supabase: any }, params: { id: string }) => Promise<NextResponse>
) {
  try {
    const auth = await requireAuth()
    // Extrair params uma vez
    const params = { id: '...' } // Extrair do request
    return await handler(auth, params)
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  return handleRequest(async ({ user, supabase }) => {
    // Lógica GET...
  })
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  return handleRequest(async ({ user, supabase }) => {
    // Lógica PUT...
  })
}
```

## Exemplo 3: Otimizar Hooks

### ❌ ANTES (Criando Cliente a Cada Chamada)
```typescript
// web/lib/hooks/use-mentoria.ts
export function useMentoria() {
  const fetchData = async () => {
    const supabase = createClient() // Novo cliente a cada chamada
    const { data: { user } } = await supabase.auth.getUser()
    // ...
  }
}
```

### ✅ DEPOIS (Reutilizar Cliente)
```typescript
// web/lib/hooks/use-mentoria.ts
import { useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useMentoria() {
  // Criar cliente uma vez
  const supabase = useMemo(() => createClient(), [])
  
  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    // ...
  }
}
```

## Exemplo 4: Otimizar Utilitários

### ❌ ANTES (Criando Cliente Internamente)
```typescript
// web/lib/utils/get-aluno-pessoa-id.ts
export async function getAlunoPessoaId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  // ...
}
```

### ✅ DEPOIS (Receber Cliente como Parâmetro)
```typescript
// web/lib/utils/get-aluno-pessoa-id.ts
export async function getAlunoPessoaId(supabase: SupabaseClient<Database>, userId?: string) {
  // Se userId não fornecido, buscar do cliente
  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser()
    userId = user?.id
  }
  // ...
}
```

## Checklist de Aplicação

Para cada arquivo a ser otimizado:

1. [ ] **Identificar padrão atual**
   - [ ] Usa `auth.getUser()` diretamente?
   - ] Tem múltiplas chamadas na mesma rota?
   - ] Cria cliente Supabase repetidamente?

2. [ ] **Escolher estratégia**
   - [ ] Substituir por `requireAuth()`?
   - ] Usar `withAuth()` wrapper?
   - ] Cachear resultado?
   - ] Reutilizar cliente?

3. [ ] **Aplicar mudança**
   - [ ] Importar helper
   - ] Substituir código
   - ] Manter funcionalidade

4. [ ] **Testar**
   - [ ] Testar autenticação
   - ] Testar funcionalidade
   - ] Verificar logs

5. [ ] **Validar**
   - [ ] Código mais limpo?
   - ] Menos chamadas ao Auth?
   - ] Funcionalidade preservada?

## Ordem de Aplicação Recomendada

### Prioridade 1: Rotas com Múltiplas Chamadas
1. `web/app/api/pessoas/[id]/route.ts` (3 chamadas)
2. `web/app/api/pessoas/[id]/educacional/route.ts` (3 chamadas)
3. `web/app/api/pessoas/[id]/financeiro/route.ts` (3 chamadas)

### Prioridade 2: Rotas Mais Usadas
1. Rotas de WhatsApp groups
2. Rotas de dashboard
3. Rotas de tarefas

### Prioridade 3: Hooks e Utilitários
1. `web/lib/hooks/use-mentoria.ts`
2. `web/lib/utils/get-aluno-pessoa-id.ts`
3. `web/lib/utils/storage.ts`

### Prioridade 4: Demais Rotas
1. Aplicar helper em todas as rotas restantes
2. Validar funcionamento
3. Monitorar logs
