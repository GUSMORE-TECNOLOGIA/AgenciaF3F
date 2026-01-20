# Aplicar Migrations no Supabase

## Passo a Passo

### 1. Acessar SQL Editor
1. Acesse: https://app.supabase.com
2. Selecione seu projeto: `rhnkffeyspymjpellmnd`
3. No menu lateral, clique em **SQL Editor**

### 2. Executar Migration Inicial
1. Abra o arquivo: `supabase/migrations/20260115114000_initial_schema.sql`
2. Copie **TODO** o conteúdo do arquivo
3. Cole no SQL Editor do Supabase
4. Clique em **Run** (ou pressione Ctrl+Enter)
5. Aguarde a confirmação de sucesso

### 3. Executar Migration de Equipe
1. Abra o arquivo: `supabase/migrations/20260115120000_equipe_e_responsaveis.sql`
2. Copie **TODO** o conteúdo do arquivo
3. Cole no SQL Editor do Supabase
4. Clique em **Run**
5. Aguarde a confirmação de sucesso

### 4. Verificar Tabelas Criadas
No SQL Editor, execute:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Você deve ver as seguintes tabelas:
- atendimentos
- cliente_responsaveis
- clientes
- equipe_membros
- ocorrencia_grupos
- ocorrencia_tipos
- ocorrencias
- servicos
- transacoes
- usuarios

### 5. Criar Primeiro Usuário

#### Opção A: Via Dashboard
1. Vá em **Authentication** → **Users**
2. Clique em **Add User**
3. Preencha email e senha
4. Copie o **User UID** gerado

#### Opção B: Via SQL (após criar no Auth)
```sql
-- Substitua 'USER_ID_DO_AUTH' pelo ID do usuário criado no Authentication
-- Substitua 'email@exemplo.com' pelo email do usuário
-- Substitua 'Nome do Usuário' pelo nome desejado

INSERT INTO usuarios (id, email, name, role)
VALUES (
  'USER_ID_DO_AUTH',
  'email@exemplo.com',
  'Nome do Usuário',
  'admin'
);
```

### 6. Testar Conexão
1. Execute `npm run dev`
2. Acesse http://localhost:5173
3. Tente fazer login com o usuário criado
4. Verifique se não há erros no console

## Troubleshooting

### Erro: "relation does not exist"
- Significa que as migrations não foram executadas
- Execute as migrations novamente

### Erro: "permission denied"
- Verifique se as políticas RLS estão corretas
- Verifique se o usuário está autenticado

### Erro: "column does not exist"
- A migration pode ter falhado parcialmente
- Verifique os logs no SQL Editor
- Execute a migration novamente
