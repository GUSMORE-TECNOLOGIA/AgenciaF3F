---
type: doc
name: data-flow
description: How data moves through the system and external integrations
category: data-flow
generated: 2026-01-20
status: filled
scaffoldVersion: "2.0.0"
---

## Listagem de Clientes e Filtros Inteligentes

### Fluxo sem Filtros Inteligentes

1. **Clientes.tsx** → `useClientes({ status, responsavel_id, search, limit })`
2. **useClientes** → `fetchClientes(ClienteFilters)`
3. **clientes.ts** → Query direta em `clientes` (status, responsavel_id, search via ilike)
4. Resultado paginado retornado ao frontend
5. Filtro client-side adicional por busca e responsável (useMemo)

### Fluxo com Filtros Inteligentes

1. **Clientes.tsx** → `useClientes({ smartConditions, status, responsavel_id, search, limit })` quando `smartConditions.length > 0`
2. **useClientes** → `fetchClientes` com `smartConditions`
3. **clientes.ts** → RPC `list_clientes_filtrados(p_conditions, p_limit, p_offset)` no Supabase
4. **RPC** aplica condições (EXISTS/NOT EXISTS para tem_contrato, tem_plano, tem_financeiro_gerado, etc.) e merge de search/status/responsavel_id
5. Resultado já filtrado retornado; sem filtro client-side adicional

### Persistência de Filtros

- **Condições ativas:** localStorage `f3f-smart-filters-clientes`
- **Filtros salvos (nome):** localStorage `f3f-smart-filters-saved-clientes`
