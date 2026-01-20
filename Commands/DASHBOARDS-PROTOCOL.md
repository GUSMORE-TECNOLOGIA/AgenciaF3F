# Protocolo de Criação de Dashboards

**Data de Criação**: 07/01/2026  
**Versão**: 1.0

Este documento descreve o protocolo completo para criar novos dashboards customizados no sistema.

## Visão Geral

O sistema de dashboards usa **Programação Orientada a Objetos (POO)** para garantir organização, reutilização e manutenibilidade. Cada dashboard é uma classe que estende `DashboardBase` e implementa métodos específicos.

## Estrutura de Arquivos

Quando criar um novo dashboard, siga esta estrutura:

```
web/
├── lib/
│   └── dashboards/
│       ├── base/                    # Classes base (NÃO MODIFICAR)
│       │   ├── DashboardBase.ts
│       │   ├── DashboardPanel.ts
│       │   ├── DashboardLayout.ts
│       │   └── DashboardData.ts
│       ├── [seu-tipo]/              # Pasta do seu dashboard
│       │   ├── [SeuTipo]Dashboard.ts
│       │   └── [SeuTipo]DataService.ts
│       └── DashboardRegistry.ts     # Registrar aqui
│
└── components/
    └── dashboards/
        ├── base/                    # Componentes base (reutilizar)
        │   ├── DashboardContainer.tsx
        │   └── DashboardGrid.tsx
        └── [seu-tipo]/              # Componentes específicos
            └── panels/
                ├── Painel1Card.tsx
                ├── Painel2Card.tsx
                └── index.ts
```

## Passo a Passo

### 1. Adicionar Tipo ao Enum

**Arquivo**: `web/types/mentoria.ts`

```typescript
export enum DashboardType {
  DEFAULT = 'default',
  UPLOADER = 'uploader',
  SEU_TIPO = 'seu-tipo'  // ← Adicionar aqui
}
```

### 2. Criar Classe do Dashboard

**Arquivo**: `web/lib/dashboards/[seu-tipo]/[SeuTipo]Dashboard.ts`

```typescript
import { DashboardBase } from '../base/DashboardBase'
import type { DashboardPanel, DashboardLayout, DashboardData, DashboardConfig } from '../base'
import { Painel1Card } from '@/components/dashboards/[seu-tipo]/panels/Painel1Card'
import { Painel2Card } from '@/components/dashboards/[seu-tipo]/panels/Painel2Card'

export class SeuTipoDashboard extends DashboardBase {
  constructor(config: DashboardConfig) {
    super('seu-tipo', config)
  }
  
  getPanels(): DashboardPanel[] {
    return [
      {
        id: 'painel1',
        name: 'Nome do Painel 1',
        component: Painel1Card,
        position: { row: 1, col: 1 },
        size: { width: 1, height: 1 },
        required: true
      },
      {
        id: 'painel2',
        name: 'Nome do Painel 2',
        component: Painel2Card,
        position: { row: 1, col: 2 },
        size: { width: 1, height: 1 },
        required: false
      }
    ]
  }
  
  getLayout(): DashboardLayout {
    return {
      gridColumns: 2,
      gridRows: 3,
      gap: 16,
      padding: 24
    }
  }
  
  async getRequiredData(): Promise<DashboardData> {
    // Buscar dados específicos do seu dashboard
    const service = new SeuTipoDataService()
    return {
      specific: await service.getData()
    }
  }
}
```

### 3. Criar Serviço de Dados (Opcional)

**Arquivo**: `web/lib/dashboards/[seu-tipo]/[SeuTipo]DataService.ts`

```typescript
import { createClient } from '@/lib/supabase/client'

export class SeuTipoDataService {
  private supabase = createClient()
  
  async getData() {
    // Buscar dados do banco
    // Retornar dados formatados
  }
}
```

### 4. Criar Componentes dos Painéis

**Arquivo**: `web/components/dashboards/[seu-tipo]/panels/Painel1Card.tsx`

```typescript
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Painel1CardProps {
  data?: any  // Tipar conforme necessário
}

export function Painel1Card({ data }: Painel1CardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Nome do Painel</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Conteúdo do painel */}
      </CardContent>
    </Card>
  )
}
```

**Arquivo**: `web/components/dashboards/[seu-tipo]/panels/index.ts`

```typescript
export { Painel1Card } from './Painel1Card'
export { Painel2Card } from './Painel2Card'
```

### 5. Registrar no DashboardRegistry

**Arquivo**: `web/lib/dashboards/DashboardRegistry.ts`

```typescript
import { SeuTipoDashboard } from './[seu-tipo]/[SeuTipo]Dashboard'

export class DashboardRegistry {
  private static dashboards: Map<string, new (config: DashboardConfig) => DashboardBase> = new Map()
  
  static {
    this.register('uploader', UploaderDashboard)
    this.register('seu-tipo', SeuTipoDashboard)  // ← Adicionar aqui
  }
  
  // ... resto do código
}
```

### 6. Atualizar Migration (Constraint)

**Arquivo**: `web/migrations/[timestamp]_add_dashboard_fields_to_mentoria.sql`

```sql
-- Adicionar novo tipo na constraint
ALTER TABLE mentoria
DROP CONSTRAINT IF EXISTS check_dashboard_type;

ALTER TABLE mentoria
ADD CONSTRAINT check_dashboard_type 
CHECK (dashboard_type IS NULL OR dashboard_type IN ('uploader', 'seu-tipo'));
```

### 7. Criar Hooks (Se Necessário)

**Arquivo**: `web/lib/hooks/use-aluno-[seu-tipo]-data.ts`

```typescript
import { useQuery } from '@tanstack/react-query'

export function useAlunoSeuTipoData() {
  return useQuery({
    queryKey: ['aluno', 'seu-tipo-data'],
    queryFn: async () => {
      const response = await fetch('/api/aluno/seu-tipo-data')
      return response.json()
    }
  })
}
```

### 8. Criar API (Se Necessário)

**Arquivo**: `web/app/api/aluno/[seu-tipo]-data/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  // Implementar busca de dados específicos
  return NextResponse.json({ data: [] })
}
```

## Documentação de Painéis

Para cada painel criado, documente:

1. **Arquivo**: Caminho completo do arquivo
2. **Dados**: O que o painel exibe
3. **Fonte**: De onde vêm os dados (tabela, API, etc.)
4. **Hook**: Hook usado para buscar dados
5. **Dependências**: Outros painéis ou dados necessários

Exemplo:

```markdown
### Painel X
- **Arquivo**: `web/components/dashboards/[tipo]/panels/PainelXCard.tsx`
- **Dados**: Descrição do que exibe
- **Fonte**: `tabela.coluna` ou API
- **Hook**: `use-aluno-dados-x.ts`
- **Dependências**: Nenhuma ou lista de IDs
```

## Checklist de Implementação

- [ ] Tipo adicionado ao enum `DashboardType`
- [ ] Classe criada estendendo `DashboardBase`
- [ ] Métodos `getPanels()`, `getLayout()`, `getRequiredData()` implementados
- [ ] Componentes dos painéis criados
- [ ] Serviço de dados criado (se necessário)
- [ ] Registrado no `DashboardRegistry`
- [ ] Constraint atualizada na migration
- [ ] Hooks criados (se necessário)
- [ ] APIs criadas (se necessário)
- [ ] Documentação dos painéis atualizada
- [ ] Testado no admin (deve aparecer no select)
- [ ] Testado no aluno (deve carregar corretamente)

## Boas Práticas

1. **Reutilização**: Use componentes base quando possível
2. **Type Safety**: Sempre tipar props e dados
3. **Performance**: Use React Query para cache de dados
4. **Responsividade**: Testar em mobile, tablet e desktop
5. **Acessibilidade**: Usar labels e ARIA quando necessário
6. **Documentação**: Documentar cada painel criado

## Exemplo Completo: Dashboard Uploader

Referência para entender a estrutura completa:

- **Classe**: `web/lib/dashboards/uploader/UploaderDashboard.ts`
- **Painéis**: `web/components/dashboards/uploader/panels/`
- **Registro**: Ver `DashboardRegistry.ts` linha com `uploader`

## Suporte

Em caso de dúvidas, consulte:
- Este protocolo
- Código do `UploaderDashboard` como referência
- Classes base em `web/lib/dashboards/base/`
