# Protocolo: Aplicar Migration

## Objetivo

Padronizar o processo de aplicação de migrations no banco de dados usando o MCP Supabase, garantindo que todas as migrations sejam aplicadas de forma segura e consistente, evitando erros e problemas de execução.

## Quando usar

**SEMPRE** que:
- Uma nova migration SQL foi criada no diretório `supabase/migrations/`
- Uma migration precisa ser aplicada no banco de dados do Supabase
- Houver alterações no schema do banco de dados que requerem migration

## Pré-requisitos

1. ✅ Migration criada no formato correto: `YYYYMMDDHHMM_nome_da_migration.sql`
2. ✅ Migration salva em `supabase/migrations/`
3. ✅ Conexão MCP Supabase F3F configurada e funcional (`supabaseF3F`)
4. ✅ Backup do banco de dados (recomendado para produção)

## Processo Completo

### 1. Preparação da Migration

#### 1.1 Verificar Nome e Formato

```bash
# Formato esperado: YYYYMMDDHHMM_nome_descritivo.sql
# Exemplo: 20260120143000_rls_clientes_reset.sql

# Verificar se arquivo existe
ls supabase/migrations/YYYYMMDDHHMM_*.sql
```

**Regras do nome**:
- Formato: `YYYYMMDDHHMM_nome_da_migration.sql`
- Usar snake_case para o nome
- Nome deve ser descritivo do que a migration faz
- Sem espaços ou caracteres especiais

#### 1.2 Ler e Revisar a Migration

```bash
# Ler conteúdo da migration
cat supabase/migrations/YYYYMMDDHHMM_nome_da_migration.sql
```

**Checklist de revisão**:
- [ ] Migration tem comentários descritivos no início
- [ ] Todas as alterações são necessárias
- [ ] Não há comandos DROP sem IF EXISTS (quando apropriado)
- [ ] Verificações de existência de colunas/tabelas estão presentes
- [ ] Não há subqueries em CHECK constraints (PostgreSQL não permite)
- [ ] Dados existentes serão migrados corretamente (se aplicável)
- [ ] RLS policies são recriadas corretamente (se aplicável)

### 2. Aplicar Migration via MCP Supabase

#### 2.1 Ler o Arquivo da Migration

```typescript
// Ler o arquivo da migration
const migrationContent = read_file('supabase/migrations/YYYYMMDDHHMM_nome_da_migration.sql')
```

#### 2.2 Extrair Nome da Migration

O nome para o MCP deve ser em snake_case, extraído do nome do arquivo:
- Arquivo: `20260120143000_rls_clientes_reset.sql`
- Nome MCP: `rls_clientes_reset`

#### 2.3 Aplicar via MCP

```typescript
// Usar o tool mcp_supabaseF3F_apply_migration (projeto F3F)
mcp_supabaseF3F_apply_migration({
  name: "nome_da_migration_snake_case",
  query: "<conteúdo completo do arquivo SQL>"
})
```

**Nota**: O projeto AgenciaF3F usa o servidor MCP `supabaseF3F` (não `SupabaseUploaders`).

### 3. Verificar Resultado

#### 3.1 Sucesso

Se a migration for aplicada com sucesso:
- ✅ Verificar logs do MCP (se disponíveis)
- ✅ Confirmar que não houve erros
- ✅ Documentar que a migration foi aplicada

#### 3.2 Erro

Se houver erro na aplicação:

**Erros Comuns e Soluções**:

1. **Erro: "cannot use subquery in check constraint"**
   - **Causa**: PostgreSQL não permite subqueries em CHECK constraints
   - **Solução**: Remover a constraint CHECK ou substituir por trigger/validação na aplicação
   - **Exemplo de remoção**:
     ```sql
     -- ❌ ERRADO (não funciona):
     ALTER TABLE tabela
     ADD CONSTRAINT chk_constraint
     CHECK (campo_id IS NULL OR EXISTS (SELECT 1 FROM outra_tabela WHERE ...));
     
     -- ✅ CORRETO:
     -- Remover constraint e validar na aplicação ou usar trigger
     ```

2. **Erro: "constraint already exists"**
   - **Causa**: Constraint ou índice já existe no banco
   - **Solução**: Usar `CREATE ... IF NOT EXISTS` ou `DROP ... IF EXISTS` antes
   - **Exemplo**:
     ```sql
     DROP INDEX IF EXISTS idx_nome_do_indice;
     CREATE INDEX IF NOT EXISTS idx_nome_do_indice ON tabela(coluna);
     ```

3. **Erro: "column already exists"**
   - **Causa**: Coluna já foi adicionada anteriormente
   - **Solução**: Verificar existência antes de adicionar
   - **Exemplo**:
     ```sql
     DO $$
     BEGIN
       IF NOT EXISTS (
         SELECT 1 FROM information_schema.columns 
         WHERE table_name = 'tabela' AND column_name = 'coluna'
       ) THEN
         ALTER TABLE tabela ADD COLUMN coluna TEXT;
       END IF;
     END $$;
     ```

4. **Erro: "cannot drop column because other objects depend on it"**
   - **Causa**: Existem constraints, índices ou políticas RLS que dependem da coluna
   - **Solução**: Remover dependências antes de remover a coluna
   - **Ordem correta**:
     1. Remover políticas RLS que usam a coluna
     2. Remover índices que usam a coluna
     3. Remover constraints que usam a coluna
     4. Remover a coluna

5. **Erro: "relation does not exist"**
   - **Causa**: Tabela ou objeto não existe
   - **Solução**: Verificar se objeto existe antes de usar
   - **Exemplo**:
     ```sql
     DO $$
     BEGIN
       IF EXISTS (
         SELECT 1 FROM information_schema.tables 
         WHERE table_name = 'tabela'
       ) THEN
         -- fazer alteração
       END IF;
     END $$;
     ```

#### 3.3 Corrigir e Reaplicar

Após identificar e corrigir o erro:

1. **Atualizar o arquivo da migration** com a correção
2. **Ler o arquivo atualizado**
3. **Reaplicar via MCP** com o mesmo nome (o MCP criará uma nova versão)
4. **Verificar resultado novamente**

### 4. Validação Pós-Migration

#### 4.1 Verificar Estrutura do Banco

Usar MCP para verificar se as alterações foram aplicadas:

```typescript
// Listar tabelas
mcp_supabaseF3F_list_tables({ schemas: ['public'] })

// Verificar estrutura específica (se necessário)
mcp_supabaseF3F_execute_sql({
  query: "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'nome_tabela'"
})
```

#### 4.2 Verificar Migrations Aplicadas

```typescript
// Listar migrations aplicadas
mcp_supabaseF3F_list_migrations()
```

#### 4.3 Testar Funcionalidade (se aplicável)

- [ ] Testar criação/edição de registros afetados
- [ ] Verificar que validações estão funcionando
- [ ] Confirmar que RLS policies estão ativas
- [ ] Testar queries que dependem das alterações

### 5. Documentação

#### 5.1 Atualizar Status da Migration

Se a migration foi aplicada com sucesso:
- ✅ Marcar como aplicada (se houver checklist)
- ✅ Documentar data e hora de aplicação
- ✅ Notar qualquer observação importante

#### 5.2 Registrar Problemas

Se houve problemas:
- 📝 Documentar erro encontrado
- 📝 Documentar solução aplicada
- 📝 Atualizar migration com correções (se necessário)

## Fluxo Visual

```
┌─────────────────────────────────────────────────────────────┐
│ 1. PREPARAÇÃO                                               │
│  - Verificar nome e formato da migration                   │
│  - Ler e revisar conteúdo                                  │
│  - Verificar checklist de qualidade                        │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. APLICAR VIA MCP                                          │
│  - Ler arquivo da migration                                │
│  - Extrair nome snake_case                                 │
│  - Chamar mcp_supabaseF3F_apply_migration                  │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. VERIFICAR RESULTADO                                      │
│  ├─ Sucesso? → Ir para passo 4                            │
│  └─ Erro? → Corrigir e voltar ao passo 2                  │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. VALIDAÇÃO                                                │
│  - Verificar estrutura do banco                            │
│  - Listar migrations aplicadas                             │
│  - Testar funcionalidade (se aplicável)                    │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. DOCUMENTAÇÃO                                             │
│  - Atualizar status                                        │
│  - Registrar problemas (se houver)                         │
└─────────────────────────────────────────────────────────────┘
```

## Boas Práticas

### 1. Migration Idempotente

Sempre que possível, faça migrations idempotentes (podem ser executadas múltiplas vezes sem erro):

```sql
-- ✅ BOM: Verifica existência antes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tabela' AND column_name = 'coluna'
  ) THEN
    ALTER TABLE tabela ADD COLUMN coluna TEXT;
  END IF;
END $$;

-- ❌ EVITAR: Pode falhar se executado novamente
ALTER TABLE tabela ADD COLUMN coluna TEXT;
```

### 2. Usar IF EXISTS / IF NOT EXISTS

```sql
-- ✅ BOM
CREATE INDEX IF NOT EXISTS idx_nome ON tabela(coluna);
DROP INDEX IF EXISTS idx_nome_antigo;

-- ❌ EVITAR (quando apropriado)
CREATE INDEX idx_nome ON tabela(coluna);  -- Falha se já existe
```

### 3. Migração de Dados Gradual

Para migrations que alteram dados existentes:

1. Adicionar nova coluna (nullable)
2. Migrar dados
3. Validar migração
4. Tornar coluna NOT NULL (se necessário)
5. Remover coluna antiga (se necessário)

### 4. Ordem de Operações para DROP

Ao remover colunas, seguir esta ordem:

1. Remover políticas RLS que usam a coluna
2. Remover índices que usam a coluna
3. Remover constraints que usam a coluna
4. Tornar coluna nullable (se NOT NULL)
5. Remover a coluna

### 5. RLS Policies

Ao atualizar RLS policies:

1. DROP das políticas antigas primeiro
2. Recriar políticas novas
3. Testar permissões após aplicação

### 6. Constraints Complexas

- **NUNCA** use subqueries em CHECK constraints
- Use triggers ou validação na aplicação para lógica complexa
- Para validações simples, use CHECK com operadores básicos

## Exemplo Completo

### Cenário: Recriar RLS policies de clientes para soft delete

**1. Migration criada**: `20260120143000_rls_clientes_reset.sql`

**2. Conteúdo da migration**:
```sql
-- Recriar policies de clientes para garantir soft delete

DROP POLICY IF EXISTS "clientes_select_responsavel" ON public.clientes;
DROP POLICY IF EXISTS "clientes_insert_responsavel" ON public.clientes;
DROP POLICY IF EXISTS "clientes_update_responsavel" ON public.clientes;

CREATE POLICY "clientes_select_responsavel" ON public.clientes
  FOR SELECT USING (
    (responsavel_id = auth.uid() OR EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.role = 'admin'))
    AND deleted_at IS NULL
  );

CREATE POLICY "clientes_insert_responsavel" ON public.clientes
  FOR INSERT WITH CHECK (
    responsavel_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

CREATE POLICY "clientes_update_responsavel" ON public.clientes
  FOR UPDATE
  USING (
    (responsavel_id = auth.uid() OR EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.role = 'admin'))
    AND deleted_at IS NULL
  )
  WITH CHECK (
    responsavel_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

NOTIFY pgrst, 'reload schema';
```

**3. Aplicar via MCP**:
```typescript
// Ler arquivo
const content = read_file('supabase/migrations/20260120143000_rls_clientes_reset.sql')

// Aplicar
mcp_supabaseF3F_apply_migration({
  name: "rls_clientes_reset",
  query: content
})
```

**4. Verificar resultado**:
- ✅ Sucesso: Migration aplicada
- ✅ Verificar policies: `SELECT * FROM pg_policies WHERE tablename = 'clientes'`
- ✅ Testar: Tentar soft delete de um cliente

## Troubleshooting

### "Migration aplicada mas mudanças não aparecem"

**Causa**: Cache do Supabase ou schema não atualizado.

**Solução**:
```typescript
// Regenerar tipos TypeScript (se aplicável)
mcp_supabaseF3F_generate_typescript_types()

// Verificar logs
mcp_supabaseF3F_get_logs({ service: "postgres" })
```

### "Erro ao aplicar: permission denied"

**Causa**: Usuário do MCP não tem permissões necessárias.

**Solução**: Verificar configuração do MCP Supabase e permissões do usuário.

### "Migration parcialmente aplicada"

**Causa**: Migration falhou no meio da execução.

**Solução**:
1. Verificar estado atual do banco
2. Identificar o que foi aplicado
3. Criar migration corretiva ou manual
4. Documentar estado atual

## Checklist de Aplicação

### Antes de Aplicar
- [ ] Migration tem formato correto (YYYYMMDDHHMM_nome.sql)
- [ ] Conteúdo revisado e validado
- [ ] Verificações de existência presentes
- [ ] Sem subqueries em CHECK constraints
- [ ] Ordem de operações correta (DROP antes de CREATE quando necessário)

### Ao Aplicar
- [ ] Nome MCP extraído corretamente (snake_case)
- [ ] Conteúdo completo do arquivo incluído
- [ ] Resultado verificado (sucesso ou erro)

### Após Aplicar
- [ ] Estrutura do banco verificada
- [ ] Funcionalidade testada (se aplicável)
- [ ] Documentação atualizada
- [ ] Problemas registrados (se houver)

## Referências

- **MCP Supabase**: Documentação oficial do MCP
- **PostgreSQL Constraints**: Limitações e boas práticas
- **Supabase Migrations**: Como migrations funcionam no Supabase

## Regras de Ouro

1. **SEMPRE** verifique a migration antes de aplicar
2. **SEMPRE** use verificações de existência (IF EXISTS / IF NOT EXISTS)
3. **NUNCA** use subqueries em CHECK constraints
4. **SEMPRE** remova dependências antes de DROP
5. **SEMPRE** valide o resultado após aplicação
6. **SEMPRE** documente problemas e soluções
