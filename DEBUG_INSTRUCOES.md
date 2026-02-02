# 🔍 Instruções de Debug

## Erro "Database error querying schema" no login

Esse erro **não é de senha errada**. Aparece quando a API (PostgREST) não consegue consultar o schema ou a tabela `public.usuarios`.

**O que fazer:**
1. **Aplicar as migrations**, em especial `20260202160000_fix_api_schema_usuarios.sql` (GRANT USAGE/SELECT e NOTIFY pgrst).
2. **Schema exposto:** em Settings → API, confirme que o schema `public` está exposto.
3. **Se o erro persistir**, no SQL Editor do Dashboard (como superuser) execute:
   ```sql
   ALTER ROLE authenticator RESET pgrst.db_schemas;
   NOTIFY pgrst, 'reload schema';
   ```
4. O app **define perfil mínimo logo após o Auth** e carrega o perfil em background; se a carga falhar, você entra mesmo assim com perfil mínimo.

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
