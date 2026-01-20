# Guia de Integração do Supabase

## Informações Necessárias

Para integrar o Supabase ao projeto, você precisa fornecer **2 informações**:

### 1. URL do Projeto Supabase
- **Onde encontrar**: Dashboard do Supabase → Settings → API → Project URL
- **Formato**: `https://xxxxxxxxxxxxx.supabase.co`
- **Variável**: `VITE_SUPABASE_URL`

### 2. Chave Anon Key (Chave Pública)
- **Onde encontrar**: Dashboard do Supabase → Settings → API → Project API keys → `anon` `public`
- **Formato**: Uma string longa (JWT)
- **Variável**: `VITE_SUPABASE_ANON_KEY`
- **Importante**: Esta é a chave pública, segura para usar no frontend

## Passos para Integração

### 1. Criar arquivo .env

Na raiz do projeto, crie um arquivo `.env` (copie do `.env.example`):

```bash
cp .env.example .env
```

### 2. Preencher as variáveis

Edite o arquivo `.env` e preencha com suas credenciais:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-key-aqui
```

### 3. Aplicar Migrations

Execute as migrations SQL no Supabase:

1. Acesse o Dashboard do Supabase
2. Vá em **SQL Editor**
3. Execute os arquivos na ordem:
   - `supabase/migrations/20260115114000_initial_schema.sql`
   - `supabase/migrations/20260115120000_equipe_e_responsaveis.sql`

### 4. Habilitar Supabase no Código

Após configurar o `.env`, o código já está preparado. Basta descomentar as linhas em:
- `src/services/supabase.ts`
- `src/contexts/AuthContext.tsx`

## Verificação

Após configurar, teste:

1. Execute `npm run dev`
2. Tente fazer login (qualquer email/senha funcionará com o mock, mas depois precisará criar usuário no Supabase)
3. Verifique se não há erros no console

## Próximos Passos Após Integração

1. **Criar primeiro usuário**:
   - No Supabase Dashboard → Authentication → Users → Add User
   - Ou criar via código de registro

2. **Criar perfil na tabela `usuarios`**:
   - Após criar usuário no Auth, inserir registro na tabela `usuarios` com o mesmo `id`

3. **Testar RLS**:
   - Verificar se as políticas de segurança estão funcionando
   - Usuários só devem ver seus próprios clientes

## Estrutura de Tabelas Criadas

As migrations criam as seguintes tabelas:

- ✅ `usuarios` - Perfis de usuários
- ✅ `clientes` - Clientes da agência
- ✅ `servicos` - Serviços prestados
- ✅ `transacoes` - Transações financeiras
- ✅ `ocorrencia_grupos` - Grupos de ocorrências
- ✅ `ocorrencia_tipos` - Tipos de ocorrências
- ✅ `ocorrencias` - Ocorrências registradas
- ✅ `atendimentos` - Histórico de atendimentos
- ✅ `equipe_membros` - Membros da equipe
- ✅ `cliente_responsaveis` - Responsáveis de clientes

## Suporte

Se tiver problemas:
1. Verifique se as variáveis estão corretas no `.env`
2. Verifique se as migrations foram executadas
3. Verifique os logs do console do navegador
4. Verifique os logs do Supabase Dashboard → Logs
