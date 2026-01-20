# Plano de Implementação: Módulo de Clientes

## 📋 Visão Geral

Implementar o módulo completo de gestão de clientes, adaptando padrões do Organizacao10x (módulo de alunos) para o contexto de uma agência de marketing.

## 🎯 Objetivos

1. **CRUD Completo**: Criar, ler, atualizar e deletar (soft delete) clientes
2. **Links Úteis**: Interface completa para gerenciar os 11 links úteis por cliente
3. **Integração Supabase**: Todas as operações conectadas ao banco real
4. **UX Moderna**: Interface intuitiva e responsiva
5. **Validações**: Formulários validados com Zod
6. **Filtros e Busca**: Busca avançada e filtros por status, responsável, etc.

## 📦 Estrutura de Arquivos

```
src/pages/clientes/
├── Clientes.tsx                    ✅ (já existe - melhorar)
├── ClienteDetail.tsx               ✅ (já existe - melhorar)
├── ClienteNovo.tsx                 ❌ (criar)
├── ClienteEdit.tsx                 ❌ (criar)
├── ClienteResponsaveisTab.tsx      ✅ (já existe - integrar Supabase)
├── components/
│   ├── ClienteForm.tsx             ❌ (criar - formulário reutilizável)
│   ├── LinksUteisEditor.tsx        ❌ (criar - editor de links)
│   ├── ClienteCard.tsx             ❌ (criar - card para listagem alternativa)
│   ├── ClienteFilters.tsx          ❌ (criar - filtros avançados)
│   └── ClienteActions.tsx          ❌ (criar - ações rápidas)
└── hooks/
    ├── useClientes.ts              ❌ (criar - hook para operações CRUD)
    └── useCliente.ts               ❌ (criar - hook para operações de um cliente)
```

## 🔄 Fluxo de Implementação

### FASE 1: Serviços e Hooks (Base)
**Prioridade: ALTA**

1. **Criar serviço de clientes** (`src/services/clientes.ts`)
   - Funções para CRUD completo
   - Integração com Supabase
   - Tratamento de erros
   - Cache/otimização

2. **Criar hooks customizados**
   - `useClientes`: Listagem, filtros, busca
   - `useCliente`: Operações de um cliente específico
   - `useCreateCliente`: Criação
   - `useUpdateCliente`: Atualização
   - `useDeleteCliente`: Soft delete

### FASE 2: Componentes de Formulário
**Prioridade: ALTA**

3. **ClienteForm** (componente reutilizável)
   - Campos: nome, email, telefone, status, responsável
   - Validação com Zod
   - Estados de loading/erro
   - Reutilizável para criar e editar

4. **LinksUteisEditor**
   - Interface para editar os 11 links úteis
   - Validação de URLs
   - Preview dos links
   - Salvar como JSONB

### FASE 3: Páginas CRUD
**Prioridade: ALTA**

5. **ClienteNovo** (`/clientes/novo`)
   - Usa ClienteForm
   - Integra LinksUteisEditor
   - Redireciona após criação

6. **ClienteEdit** (`/clientes/:id/editar`)
   - Usa ClienteForm (modo edição)
   - Carrega dados existentes
   - Integra LinksUteisEditor
   - Atualiza no Supabase

7. **Melhorar Clientes** (listagem)
   - Adicionar filtros avançados
   - Paginação
   - Ordenação
   - Ações rápidas (editar, inativar, etc.)

8. **Melhorar ClienteDetail**
   - Botão de editar
   - Botão de inativar/ativar
   - Melhorar visualização de links úteis
   - Adicionar seção de histórico

### FASE 4: Funcionalidades Avançadas
**Prioridade: MÉDIA**

9. **Filtros Avançados**
   - Por status (ativo, inativo, pausado)
   - Por responsável
   - Por data de criação
   - Busca por nome/email/telefone

10. **Ações em Lote**
    - Seleção múltipla
    - Inativar múltiplos
    - Exportar selecionados

11. **Histórico de Alterações**
    - Log de mudanças
    - Quem alterou e quando

### FASE 5: Integração com Responsáveis
**Prioridade: MÉDIA**

12. **Melhorar ClienteResponsaveisTab**
    - Integrar com Supabase real
    - CRUD completo de responsáveis
    - Validação de responsável principal único

## 🎨 Design e UX

### Padrões do Organizacao10x a Adaptar:

1. **Modal de Criação/Edição**
   - Modal full-screen ou drawer
   - Tabs para organizar informações
   - Validação em tempo real
   - Feedback visual de erros

2. **Listagem**
   - Tabela responsiva
   - Cards alternativos (opcional)
   - Filtros no topo
   - Ações rápidas por linha

3. **Detalhes**
   - Header com informações principais
   - Tabs para organizar conteúdo
   - Ações contextuais
   - Breadcrumbs

## 🔧 Implementação Técnica

### 1. Serviço de Clientes (`src/services/clientes.ts`)

```typescript
// Funções principais:
- fetchClientes(filters?)
- fetchClienteById(id)
- createCliente(data)
- updateCliente(id, data)
- deleteCliente(id) // soft delete
- updateLinksUteis(id, links)
- updateDriveUrl(id, url)
```

### 2. Validação com Zod

```typescript
// Schema de validação:
- ClienteSchema (criação)
- ClienteUpdateSchema (atualização)
- LinksUteisSchema
- Validação de URLs
```

### 3. Hooks Customizados

```typescript
// useClientes.ts
- useClientes() - lista com filtros
- useCreateCliente() - criação
- useUpdateCliente() - atualização
- useDeleteCliente() - soft delete
```

## 📊 Estrutura de Dados

### Cliente (já definido em types/index.ts)
- ✅ Campos básicos
- ✅ Links úteis (JSONB)
- ✅ Drive URL
- ✅ Status
- ✅ Responsável

### Links Úteis (11 campos)
1. conta_anuncio_f3f
2. conta_anuncio_lt
3. instagram
4. business_suite
5. dashboard
6. planilha_dados
7. pasta_drive
8. utmify
9. wordpress
10. pagina_vendas_lt
11. checkout

## 🚀 Ordem de Implementação

### Sprint 1: Base (Prioridade Máxima)
1. ✅ Serviço de clientes (`clientes.ts`)
2. ✅ Hook `useClientes`
3. ✅ Hook `useCliente`
4. ✅ Componente `ClienteForm`
5. ✅ Página `ClienteNovo`

### Sprint 2: Edição e Links
6. ✅ Página `ClienteEdit`
7. ✅ Componente `LinksUteisEditor`
8. ✅ Integrar editor no ClienteDetail
9. ✅ Funcionalidade de soft delete

### Sprint 3: Melhorias
10. ✅ Filtros avançados
11. ✅ Paginação
12. ✅ Melhorias na listagem
13. ✅ Ações rápidas

### Sprint 4: Polimento
14. ✅ Validações avançadas
15. ✅ Feedback visual
16. ✅ Tratamento de erros
17. ✅ Loading states

## 🎯 Critérios de Sucesso

- [ ] Criar cliente com todos os campos
- [ ] Editar cliente existente
- [ ] Inativar/ativar cliente (soft delete)
- [ ] Gerenciar links úteis (todos os 11 campos)
- [ ] Buscar e filtrar clientes
- [ ] Ver detalhes completos
- [ ] Integração 100% com Supabase
- [ ] Validações funcionando
- [ ] UX fluida e responsiva

## 📝 Notas de Implementação

### Adaptações do Organizacao10x:

1. **Students → Clientes**
   - Adaptar nomenclatura
   - Manter estrutura similar
   - Adaptar campos específicos

2. **Links Úteis**
   - Campo único no Organizacao10x
   - 11 campos específicos na F3F
   - Interface dedicada necessária

3. **Responsáveis**
   - Já implementado parcialmente
   - Integrar com Supabase real
   - Validações de regras de negócio

4. **Status**
   - ativo, inativo, pausado
   - Visual claro (badges coloridos)
   - Filtros por status

## 🔗 Dependências

- ✅ Supabase configurado
- ✅ Migrations aplicadas
- ✅ RLS configurado
- ✅ Tipos TypeScript definidos
- ✅ Autenticação funcionando

## 📚 Referências

- Organizacao10x: `web/components/students/`
- Organizacao10x: `web/app/(app)/app/students/`
- Padrões de formulário do projeto
- Componentes de modal/drawer existentes
