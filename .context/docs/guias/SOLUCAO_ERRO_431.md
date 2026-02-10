# Solução Completa: Erro 431 - Request Header Fields Too Large

> **Template:** Em uso para outro projeto, substitua refs em [.context/docs/PROJECT_INTEGRATIONS.md](.context/docs/PROJECT_INTEGRATIONS.md) e `.env` pelos do novo projeto.

## 🔴 Problema
O servidor Vite retorna erro 431 quando os headers HTTP excedem o tamanho máximo permitido. Isso geralmente acontece quando:
- Tokens JWT do Supabase são muito grandes
- Cookies antigos estão acumulados no navegador
- Headers HTTP excedem ~8KB (limite padrão)

## ✅ Soluções Aplicadas

### 1. Supabase configurado para usar localStorage
✅ **Já aplicado** em `src/services/supabase.ts`
- Usa `localStorage` ao invés de cookies
- Reduz drasticamente o tamanho dos headers

### 2. Configuração do Vite atualizada
✅ **Já aplicado** em `vite.config.ts`
- Configurações otimizadas para desenvolvimento

## 🛠️ Passos para Resolver

### Passo 1: Limpar Storage do Navegador

**Opção A: Usar a página de limpeza**
1. Acesse: http://localhost:5173/clear-storage.html
2. Clique em "Limpar Tudo"
3. Feche todas as abas do localhost:5173

**Opção B: Limpar manualmente**
1. Abra o DevTools (F12)
2. Vá em "Application" > "Storage"
3. Clique em "Clear site data"
4. Ou execute no Console:
   ```javascript
   localStorage.clear();
   document.cookie.split(";").forEach(c => {
     document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
   });
   ```

### Passo 2: Reiniciar o Servidor

1. **Pare o servidor** (Ctrl+C no terminal)
2. **Limpe o cache do Vite** (opcional):
   ```powershell
   Remove-Item -Recurse -Force node_modules\.vite -ErrorAction SilentlyContinue
   ```
3. **Reinicie o servidor**:
   ```powershell
   npm run dev
   ```

### Passo 3: Testar

1. Abra uma **nova aba** (não use uma aba antiga)
2. Acesse: http://localhost:5173
3. Faça login: `adm@agenciaf3f.com.br` / `adm@123`
4. O erro 431 não deve mais aparecer

## 🔍 Verificação

Para verificar se o problema foi resolvido:

1. **Abra o DevTools** (F12)
2. **Vá em Network**
3. **Recarregue a página** (F5)
4. **Verifique os headers** das requisições
5. **Não deve haver erro 431**

## 📊 Tamanhos Esperados

Após a limpeza:
- **localStorage**: < 5KB (tokens JWT)
- **Cookies**: < 1KB (ou nenhum)
- **Headers HTTP**: < 2KB

## 🚨 Se o Erro Persistir

### Solução Alternativa 1: Usar Modo Incógnito
1. Abra uma janela anônima/incógnito
2. Acesse http://localhost:5173
3. Se funcionar, o problema são dados antigos no navegador

### Solução Alternativa 2: Limpar Tudo do Navegador
1. Chrome: Configurações > Privacidade > Limpar dados de navegação
2. Selecione "Cookies e outros dados do site"
3. Limpe dados do localhost:5173

### Solução Alternativa 3: Verificar Variáveis de Ambiente
Certifique-se de que o `.env` está correto:
```env
VITE_SUPABASE_URL=https://rhnkffeyspymjpellmnd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 📝 Notas Técnicas

- O erro 431 é um limite de segurança do HTTP
- Headers HTTP têm limite de ~8-16KB dependendo do servidor
- Tokens JWT podem ser grandes (até 8KB)
- localStorage é mais eficiente que cookies para tokens
- O Supabase agora usa localStorage por padrão

## ✅ Checklist

- [ ] Limpei localStorage e cookies
- [ ] Fechei todas as abas do localhost:5173
- [ ] Reiniciei o servidor Vite
- [ ] Abri uma nova aba
- [ ] Testei o login
- [ ] Não há mais erro 431
