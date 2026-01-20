# ✅ Checklist: Atualização do Módulo de Clientes

## 📋 O que foi implementado:

### ✅ 1. Sistema de Logo
- [x] Campo `logo_url` adicionado ao tipo `Cliente`
- [x] Migration criada: `supabase/migrations/20260115180000_add_logo_url_to_clientes.sql`
- [x] Componente `ClienteLogoUpload.tsx` criado
- [x] Preview da logo no header do cliente

### ✅ 2. Estrutura de Abas
- [x] Aba "Identificação" criada (`IdentificacaoTab.tsx`)
- [x] Aba "Links Úteis" separada (`LinksUteisTab.tsx`)
- [x] Aba "Responsáveis" mantida
- [x] Header com logo implementado

### ✅ 3. Arquivos Criados/Atualizados
- [x] `src/types/index.ts` - Campo logo_url adicionado
- [x] `src/services/clientes.ts` - Suporte a logo_url
- [x] `src/lib/validators/cliente-schema.ts` - Validação de logo_url
- [x] `src/pages/clientes/components/ClienteLogoUpload.tsx` - Novo
- [x] `src/pages/clientes/components/tabs/IdentificacaoTab.tsx` - Novo
- [x] `src/pages/clientes/components/tabs/LinksUteisTab.tsx` - Novo
- [x] `src/pages/clientes/ClienteDetail.tsx` - Atualizado com novas abas

## 🔧 O que precisa ser feito:

### 1. Aplicar Migration no Supabase
Execute no Supabase SQL Editor:
```sql
ALTER TABLE clientes
ADD COLUMN IF NOT EXISTS logo_url TEXT;
```

### 2. Criar Bucket no Supabase Storage
1. Acesse Supabase Dashboard → Storage
2. Crie um novo bucket:
   - Nome: `clientes-logos`
   - Público: Sim
   - Políticas: Permitir upload/leitura para usuários autenticados

### 3. Reiniciar Servidor de Desenvolvimento
```bash
# Pare o servidor (Ctrl+C)
# Depois reinicie:
npm run dev
```

### 4. Limpar Cache do Navegador
- Pressione `Ctrl+Shift+R` (Windows/Linux) ou `Cmd+Shift+R` (Mac)
- Ou abra DevTools (F12) → Network → Marque "Disable cache"

## 🎯 Como testar:

1. **Acesse um cliente existente** (`/clientes/:id`)
2. **Verifique as abas:**
   - Deve ter "Identificação" como primeira aba
   - Deve ter "Links Úteis" como segunda aba
   - Header deve mostrar logo (ou placeholder se não houver)

3. **Teste upload de logo:**
   - Na aba "Identificação"
   - Clique em "Fazer Upload"
   - Selecione uma imagem
   - Logo deve aparecer no header

## ⚠️ Se ainda não funcionar:

1. Verifique o console do navegador (F12) para erros
2. Verifique se a migration foi aplicada:
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'clientes' AND column_name = 'logo_url';
   ```
3. Verifique se os arquivos foram salvos corretamente
4. Tente fazer hard refresh: `Ctrl+Shift+R`
