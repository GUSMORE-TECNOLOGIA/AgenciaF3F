# Criar Usuário Admin

## Passo a Passo

### 1. Criar Usuário no Supabase Auth

1. Acesse o Dashboard do Supabase:
   - URL: https://app.supabase.com/project/rhnkffeyspymjpellmnd/auth/users

2. Clique em **"Add User"** (botão no canto superior direito)

3. Preencha o formulário:
   - **Email**: `adm@agenciaf3f.com.br`
   - **Password**: `adm@123`
   - **Auto Confirm User**: ✅ **MARQUE ESTA OPÇÃO** (importante para não precisar confirmar email)

4. Clique em **"Create User"**

5. **Copie o User UID** que será gerado (você verá na lista de usuários)

### 2. Criar Perfil na Tabela usuarios

Após criar o usuário no Auth, execute a migration:

**Opção A: Via MCP (Recomendado)**
```bash
# A migration já está criada em:
# supabase/migrations/20260115170000_create_admin_user.sql
```

**Opção B: Via SQL Editor no Dashboard**

1. Acesse: https://app.supabase.com/project/rhnkffeyspymjpellmnd/sql/new

2. Execute o seguinte SQL:

```sql
DO $$
DECLARE
  user_id UUID;
BEGIN
  -- Buscar ID do usuário pelo email
  SELECT id INTO user_id
  FROM auth.users
  WHERE email = 'adm@agenciaf3f.com.br';
  
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado. Crie o usuário primeiro via Dashboard.';
  END IF;
  
  -- Criar perfil na tabela usuarios
  INSERT INTO public.usuarios (id, email, name, role)
  VALUES (user_id, 'adm@agenciaf3f.com.br', 'Administrador', 'admin')
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      name = EXCLUDED.name,
      role = 'admin',
      updated_at = NOW();
  
  RAISE NOTICE 'Perfil admin criado com sucesso!';
END $$;
```

### 3. Verificar Criação

Execute para verificar:

```sql
SELECT u.id, u.email, u.name, u.role, u.created_at
FROM public.usuarios u
WHERE u.email = 'adm@agenciaf3f.com.br';
```

### 4. Testar Login

1. Execute `npm run dev` no projeto
2. Acesse http://localhost:5173/login
3. Faça login com:
   - **Email**: `adm@agenciaf3f.com.br`
   - **Senha**: `adm@123`

## Credenciais

- **Email**: `adm@agenciaf3f.com.br`
- **Senha**: `adm@123`
- **Role**: `admin` (acesso completo)

## Notas Importantes

- ⚠️ O usuário deve ser criado no **Authentication** primeiro
- ⚠️ Marque **"Auto Confirm User"** ao criar para não precisar confirmar email
- ✅ O perfil na tabela `usuarios` será criado automaticamente após executar o SQL
- ✅ O usuário terá acesso completo (role: admin) a todas as funcionalidades
