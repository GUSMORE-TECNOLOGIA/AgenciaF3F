# ⚠️ AÇÃO NECESSÁRIA: Criar Usuário Admin

A migration foi criada, mas o usuário precisa ser criado primeiro no **Authentication Dashboard**.

## Passo a Passo Rápido

### 1. Criar Usuário no Dashboard

1. **Acesse**: https://app.supabase.com/project/rhnkffeyspymjpellmnd/auth/users

2. **Clique em "Add User"** (botão no topo)

3. **Preencha**:
   - Email: `adm@agenciaf3f.com.br`
   - Password: `adm@123`
   - ✅ **Auto Confirm User** (IMPORTANTE: marque esta opção)

4. **Clique em "Create User"**

### 2. Executar Migration Novamente

Após criar o usuário, execute novamente a migration `create_admin_user` ou execute este SQL no SQL Editor:

```sql
DO $$
DECLARE
  user_id UUID;
BEGIN
  SELECT id INTO user_id
  FROM auth.users
  WHERE email = 'adm@agenciaf3f.com.br';
  
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado. Crie primeiro via Dashboard.';
  END IF;
  
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

### 3. Verificar

```sql
SELECT * FROM public.usuarios WHERE email = 'adm@agenciaf3f.com.br';
```

## Credenciais

- **Email**: `adm@agenciaf3f.com.br`
- **Senha**: `adm@123`
- **Role**: `admin`
