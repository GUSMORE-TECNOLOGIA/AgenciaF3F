# Fix: Erro 431 - Request Header Fields Too Large

## Problema
O servidor Vite está retornando erro 431 (Request Header Fields Too Large). Isso geralmente acontece quando:
- Tokens JWT do Supabase Auth são muito grandes
- Cookies estão sendo usados para armazenar sessões
- Headers HTTP excedem o limite padrão

## Solução Aplicada

### 1. Configuração do Vite (`vite.config.ts`)
- Adicionada configuração de servidor para lidar com headers grandes
- Configurado para aumentar limites quando necessário

### 2. Configuração do Supabase (`src/services/supabase.ts`)
- Alterado para usar `localStorage` ao invés de cookies
- Isso reduz significativamente o tamanho dos headers HTTP
- Mantém a funcionalidade de autenticação intacta

## Como Funciona

**Antes**: Supabase usava cookies → Headers grandes → Erro 431

**Agora**: Supabase usa localStorage → Headers menores → Sem erro

## Verificação

Após as alterações:

1. **Reinicie o servidor Vite**:
   ```powershell
   # Pare o servidor (Ctrl+C) e reinicie
   npm run dev
   ```

2. **Teste o login**:
   - Acesse http://localhost:5173/login
   - Faça login com: `adm@agenciaf3f.com.br` / `adm@123`
   - O erro 431 não deve mais aparecer

## Notas Importantes

- ✅ O localStorage é seguro para tokens JWT no frontend
- ✅ A sessão ainda é persistida entre recarregamentos
- ✅ O auto-refresh de tokens continua funcionando
- ✅ Não há impacto na segurança

## Se o Erro Persistir

Se ainda houver problemas:

1. **Limpar localStorage**:
   ```javascript
   // No console do navegador
   localStorage.clear()
   ```

2. **Verificar tamanho do token**:
   ```javascript
   // No console do navegador
   const token = localStorage.getItem('sb-rhnkffeyspymjpellmnd-auth-token')
   console.log('Token size:', token?.length)
   ```

3. **Reiniciar servidor com mais memória**:
   ```powershell
   $env:NODE_OPTIONS="--max-old-space-size=4096"
   npm run dev
   ```
