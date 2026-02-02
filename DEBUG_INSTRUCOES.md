# 🔍 Instruções de Debug

## Erro "Database error querying schema" no login

Esse erro **não é de senha errada**. Aparece quando o Auth aceita o login mas a consulta à tabela `public.usuarios` (perfil) falha.

**O que fazer:**
1. **Aplicar as migrations** no projeto Supabase (Dashboard → SQL Editor ou `supabase db push`), para garantir que a tabela `usuarios` existe e tem RLS correto.
2. **Schema exposto:** em Settings → API, confirme que o schema `public` está exposto para a API (PostgREST).
3. Com a alteração no `AuthContext`, se a carga do perfil falhar o app passa a **deixar você entrar com um perfil mínimo** (e redirecionar para alterar senha). Assim você consegue acessar mesmo com o banco/schema com problema, e corrigir depois.

---

## Passos para identificar o problema:

1. **Abra o Console do Navegador:**
   - Pressione F12
   - Vá para a aba "Console"

2. **Acesse um cliente:**
   - Vá para `/clientes`
   - Clique em "Ver detalhes" de qualquer cliente
   - OU acesse: `/clientes/[ID_DO_CLIENTE]`

3. **Verifique os logs no console:**
   - Deve aparecer: `ClienteDetail renderizado`
   - Se clicar na aba "Identificação": `IdentificacaoTab renderizado`
   - Se clicar na aba "Links Úteis": `LinksUteisTab renderizado`

4. **Se NÃO aparecer nenhum log:**
   - O componente não está sendo carregado
   - Verifique se há erros em vermelho no console
   - Verifique a URL (deve ser `/clientes/[ID]` e não `/clientes/novo`)

5. **Se aparecer erro de importação:**
   - Verifique se os arquivos existem em:
     - `src/pages/clientes/components/tabs/IdentificacaoTab.tsx`
     - `src/pages/clientes/components/tabs/LinksUteisTab.tsx`

6. **Se aparecer erro de "Cannot read property":**
   - Pode ser que `cliente` seja `null` ou `undefined`
   - Verifique se o cliente existe no banco

## ⚠️ IMPORTANTE:
- As mudanças estão na página de **DETALHES** (`/clientes/:id`)
- **NÃO** na página de criação (`/clientes/novo`)
- Você precisa ter pelo menos 1 cliente cadastrado

## 📋 Checklist:
- [ ] Console aberto (F12)
- [ ] Acessou `/clientes/[ID]` (não `/clientes/novo`)
- [ ] Cliente existe no banco
- [ ] Viu os logs no console
- [ ] Verificou erros em vermelho
