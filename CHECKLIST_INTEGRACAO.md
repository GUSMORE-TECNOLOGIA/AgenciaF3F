# Checklist de Integração Supabase

## ✅ Informações que Preciso

Por favor, forneça:

1. **VITE_SUPABASE_URL**
   - Exemplo: `https://abcdefghijklmnop.supabase.co`
   - Onde encontrar: Supabase Dashboard → Settings → API → Project URL

2. **VITE_SUPABASE_ANON_KEY**
   - Exemplo: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (string longa)
   - Onde encontrar: Supabase Dashboard → Settings → API → Project API keys → `anon` `public`

## 📋 Passos para Integração

### Passo 1: Criar arquivo .env
```bash
# Na raiz do projeto
cp .env.example .env
```

### Passo 2: Preencher .env com suas credenciais
Edite o arquivo `.env` e adicione:
```env
VITE_SUPABASE_URL=sua-url-aqui
VITE_SUPABASE_ANON_KEY=sua-chave-aqui
```

### Passo 3: Aplicar Migrations no Supabase
1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Vá em **SQL Editor** (menu lateral)
4. Execute cada migration na ordem:
   - Abra `supabase/migrations/20260115114000_initial_schema.sql`
   - Copie todo o conteúdo
   - Cole no SQL Editor
   - Clique em **Run**
   - Repita para `supabase/migrations/20260115120000_equipe_e_responsaveis.sql`

### Passo 4: Habilitar Supabase no Código
Após você fornecer as credenciais, eu vou:
- ✅ Habilitar o cliente Supabase em `src/services/supabase.ts`
- ✅ Habilitar autenticação real em `src/contexts/AuthContext.tsx`
- ✅ Remover mocks e usar dados reais

### Passo 5: Criar Primeiro Usuário
Após as migrations:
1. No Supabase Dashboard → **Authentication** → **Users**
2. Clique em **Add User**
3. Preencha email e senha
4. Depois, no **SQL Editor**, execute:
```sql
INSERT INTO usuarios (id, email, name, role)
VALUES (
  'ID_DO_USUARIO_CRIADO_NO_AUTH',
  'email@exemplo.com',
  'Nome do Usuário',
  'admin'
);
```

## 🔍 Verificação

Após configurar tudo:
1. Execute `npm run dev`
2. Tente fazer login com o usuário criado
3. Verifique se os dados aparecem corretamente

## ⚠️ Importante

- **NUNCA** commite o arquivo `.env` no Git (já está no .gitignore)
- A **anon key** é segura para usar no frontend (é pública)
- As **migrations** devem ser executadas na ordem correta
- O **RLS** (Row Level Security) está configurado - usuários só veem seus próprios dados
