# 🎯 Plano de Implementação: Módulo de Clientes

## 📊 Situação Atual

### ✅ O que já temos:
- Estrutura básica de listagem (`Clientes.tsx`)
- Página de detalhes com tabs (`ClienteDetail.tsx`)
- Aba de responsáveis (`ClienteResponsaveisTab.tsx`)
- Integração com Supabase configurada
- Tipos TypeScript definidos
- Migrations aplicadas no banco

### ❌ O que falta:
- **CRUD Completo**: Criar, editar, deletar (soft delete)
- **Editor de Links Úteis**: Interface para gerenciar os 11 links
- **Validações**: Formulários com Zod
- **Filtros Avançados**: Busca, status, responsável
- **Integração Real**: Substituir mocks por Supabase
- **UX Melhorada**: Modais, feedback, loading states

## 🏗️ Arquitetura Proposta

### Baseado no Organizacao10x, adaptado para Agência:

```
📁 src/
├── 📁 services/
│   └── clientes.ts              ← Serviço com todas as operações Supabase
│
├── 📁 hooks/
│   ├── useClientes.ts           ← Hook para listagem (com React Query)
│   └── useCliente.ts            ← Hook para operações de um cliente
│
├── 📁 pages/clientes/
│   ├── Clientes.tsx             ✅ Melhorar (adicionar filtros, paginação)
│   ├── ClienteDetail.tsx        ✅ Melhorar (botões de ação, edição inline)
│   ├── ClienteNovo.tsx          ❌ Criar (página de criação)
│   ├── ClienteEdit.tsx          ❌ Criar (página de edição)
│   │
│   └── 📁 components/
│       ├── ClienteForm.tsx      ❌ Formulário reutilizável (criar/editar)
│       ├── LinksUteisEditor.tsx ❌ Editor dos 11 links úteis
│       ├── ClienteFilters.tsx   ❌ Filtros avançados
│       ├── ClienteCard.tsx      ❌ Card para visualização alternativa
│       └── ClienteActions.tsx   ❌ Menu de ações rápidas
│
└── 📁 lib/
    └── validators/
        └── cliente-schema.ts    ❌ Schemas Zod para validação
```

## 🎯 Funcionalidades por Prioridade

### 🔴 PRIORIDADE ALTA (Sprint 1)

#### 1. Serviço de Clientes (`src/services/clientes.ts`)
```typescript
// Operações CRUD completas
- fetchClientes(filters?)      // Listar com filtros
- fetchClienteById(id)         // Buscar um cliente
- createCliente(data)          // Criar novo
- updateCliente(id, data)      // Atualizar
- deleteCliente(id)            // Soft delete
- updateLinksUteis(id, links)  // Atualizar apenas links
- updateStatus(id, status)     // Mudar status
```

#### 2. Hooks Customizados
```typescript
// useClientes.ts - Listagem
- useClientes(filters)         // Lista com React Query
- useCreateCliente()           // Mutação de criação
- useUpdateCliente()           // Mutação de atualização
- useDeleteCliente()           // Mutação de soft delete

// useCliente.ts - Operações individuais
- useCliente(id)               // Buscar um cliente
- useUpdateLinksUteis(id)      // Atualizar links
```

#### 3. Componente ClienteForm
- Formulário reutilizável
- Validação com Zod
- Estados de loading/erro
- Campos: nome, email, telefone, status, responsável
- Modo criação e edição

#### 4. Página ClienteNovo
- Rota: `/clientes/novo`
- Usa ClienteForm
- Redireciona após criação
- Feedback de sucesso/erro

### 🟡 PRIORIDADE MÉDIA (Sprint 2)

#### 5. Componente LinksUteisEditor
- Interface para os 11 links úteis
- Validação de URLs
- Preview dos links
- Salvar como JSONB no Supabase
- Integrar no ClienteDetail e ClienteEdit

#### 6. Página ClienteEdit
- Rota: `/clientes/:id/editar`
- Carrega dados existentes
- Usa ClienteForm (modo edição)
- Integra LinksUteisEditor
- Atualiza no Supabase

#### 7. Melhorias na Listagem
- Filtros: status, responsável, busca
- Paginação
- Ordenação
- Ações rápidas (editar, inativar)

#### 8. Melhorias no ClienteDetail
- Botão "Editar" que leva para ClienteEdit
- Botão "Inativar/Ativar"
- Editor de Links Úteis inline
- Melhor visualização

### 🟢 PRIORIDADE BAIXA (Sprint 3)

#### 9. Filtros Avançados
- Drawer de filtros
- Múltiplos filtros simultâneos
- Salvar filtros favoritos

#### 10. Funcionalidades Extras
- Exportar clientes
- Ações em lote
- Histórico de alterações
- Visualização em cards (alternativa à tabela)

## 🔄 Fluxo de Dados

```
┌─────────────────┐
│   Clientes.tsx  │ (Listagem)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  useClientes()  │ (Hook)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ clientes.ts     │ (Serviço)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Supabase      │
└─────────────────┘
```

## 📝 Estrutura de Implementação

### FASE 1: Base (Serviços e Hooks)

**1.1. Criar `src/services/clientes.ts`**
- Funções para todas as operações CRUD
- Integração direta com Supabase
- Tratamento de erros
- Tipos TypeScript

**1.2. Criar `src/hooks/useClientes.ts`**
- Hook principal para listagem
- Usa React Query (se disponível) ou useState
- Filtros e busca
- Cache e refetch

**1.3. Criar `src/hooks/useCliente.ts`**
- Hook para operações de um cliente
- Mutations para criar/atualizar/deletar
- Estados de loading/erro

### FASE 2: Componentes de Formulário

**2.1. Criar `src/lib/validators/cliente-schema.ts`**
- Schema Zod para criação
- Schema Zod para atualização
- Schema para Links Úteis
- Validação de URLs

**2.2. Criar `src/pages/clientes/components/ClienteForm.tsx`**
- Componente reutilizável
- Campos: nome, email, telefone, status, responsável
- Validação em tempo real
- Estados de loading/erro/sucesso
- Props: `mode` ('create' | 'edit'), `initialData?`, `onSubmit`

**2.3. Criar `src/pages/clientes/components/LinksUteisEditor.tsx`**
- Interface para os 11 links
- Inputs com validação de URL
- Preview/validação
- Salvar como JSONB
- Props: `links`, `onChange`, `onSave`

### FASE 3: Páginas CRUD

**3.1. Criar `src/pages/clientes/ClienteNovo.tsx`**
- Rota: `/clientes/novo`
- Usa ClienteForm (mode: 'create')
- Integra LinksUteisEditor
- Redireciona após sucesso
- Feedback visual

**3.2. Criar `src/pages/clientes/ClienteEdit.tsx`**
- Rota: `/clientes/:id/editar`
- Carrega dados do cliente
- Usa ClienteForm (mode: 'edit')
- Integra LinksUteisEditor
- Atualiza no Supabase
- Feedback visual

**3.3. Melhorar `src/pages/clientes/Clientes.tsx`**
- Adicionar filtros
- Adicionar paginação
- Adicionar ações rápidas
- Melhorar busca
- Integrar com hooks

**3.4. Melhorar `src/pages/clientes/ClienteDetail.tsx`**
- Botão "Editar"
- Botão "Inativar/Ativar"
- Editor de Links Úteis na aba Informações
- Melhorar visualização

### FASE 4: Funcionalidades Avançadas

**4.1. Criar `src/pages/clientes/components/ClienteFilters.tsx`**
- Filtros: status, responsável, data
- Busca avançada
- Drawer ou dropdown

**4.2. Melhorar ClienteResponsaveisTab**
- Integrar com Supabase real
- CRUD completo
- Validações

## 🎨 Padrões de Design (Baseado no Organizacao10x)

### Modal de Criação/Edição
- Modal full-screen ou drawer lateral
- Tabs para organizar (se necessário)
- Validação em tempo real
- Feedback visual de erros
- Botões de ação no footer

### Listagem
- Tabela responsiva
- Filtros no topo
- Busca com debounce
- Paginação
- Ações rápidas por linha

### Detalhes
- Header com informações principais
- Tabs para organizar conteúdo
- Ações contextuais (editar, inativar)
- Breadcrumbs

## 🔧 Detalhes Técnicos

### Validação com Zod

```typescript
// cliente-schema.ts
export const clienteCreateSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefone: z.string().optional(),
  responsavel_id: z.string().uuid('Responsável inválido'),
  status: z.enum(['ativo', 'inativo', 'pausado']),
  links_uteis: linksUteisSchema.optional(),
  drive_url: z.string().url('URL inválida').optional().or(z.literal('')),
})

export const linksUteisSchema = z.object({
  conta_anuncio_f3f: z.string().url().optional().or(z.literal('')),
  conta_anuncio_lt: z.string().url().optional().or(z.literal('')),
  instagram: z.string().url().optional().or(z.literal('')),
  // ... todos os 11 campos
})
```

### Serviço de Clientes

```typescript
// clientes.ts
export async function fetchClientes(filters?: ClienteFilters) {
  let query = supabase
    .from('clientes')
    .select('*, responsavel:usuarios!clientes_responsavel_id_fkey(id, name, email)')
    .is('deleted_at', null)
  
  // Aplicar filtros
  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.responsavel_id) query = query.eq('responsavel_id', filters.responsavel_id)
  if (filters?.search) {
    query = query.or(`nome.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
  }
  
  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) throw error
  return data
}
```

## 📋 Checklist de Implementação

### Sprint 1: Base
- [ ] Criar `src/services/clientes.ts`
- [ ] Criar `src/hooks/useClientes.ts`
- [ ] Criar `src/hooks/useCliente.ts`
- [ ] Criar `src/lib/validators/cliente-schema.ts`
- [ ] Testar integração com Supabase

### Sprint 2: Formulários
- [ ] Criar `ClienteForm.tsx`
- [ ] Criar `LinksUteisEditor.tsx`
- [ ] Testar validações
- [ ] Testar salvamento

### Sprint 3: Páginas CRUD
- [ ] Criar `ClienteNovo.tsx`
- [ ] Criar `ClienteEdit.tsx`
- [ ] Melhorar `Clientes.tsx` (filtros, paginação)
- [ ] Melhorar `ClienteDetail.tsx` (ações, editor)

### Sprint 4: Polimento
- [ ] Adicionar filtros avançados
- [ ] Melhorar feedback visual
- [ ] Tratamento de erros
- [ ] Loading states
- [ ] Testes de integração

## 🚀 Começando a Implementação

Vou começar pela **FASE 1** (Base), criando:
1. Serviço de clientes
2. Hooks customizados
3. Schemas de validação

Depois seguimos para os componentes e páginas.

**Pronto para começar?** 🚀
