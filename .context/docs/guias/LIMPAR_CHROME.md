# Limpar Dados do Chrome para Resolver Erro 431

## 🔍 Diagnóstico
- ✅ Browser do Cursor funciona (sem dados antigos)
- ❌ Chrome continua com erro 431 (tem dados/cookies antigos)

## 🛠️ Solução: Limpar Dados do Chrome

### Método 1: Limpar Dados Específicos do Site (Recomendado)

1. **Abra o Chrome**
2. **Pressione F12** (ou clique com botão direito > Inspecionar)
3. **Vá na aba "Application"** (Aplicativo)
4. **No menu lateral, expanda "Storage"**
5. **Clique em "Clear site data"** (Limpar dados do site)
6. **Ou limpe manualmente**:
   - **Local Storage** > `http://localhost:5173` > Botão direito > Clear
   - **Cookies** > `http://localhost:5173` > Botão direito > Clear
   - **Session Storage** > `http://localhost:5173` > Botão direito > Clear

### Método 2: Via Configurações do Chrome

1. **Abra o Chrome**
2. **Pressione Ctrl+Shift+Delete** (ou vá em Configurações > Privacidade)
3. **Selecione "Cookies e outros dados do site"**
4. **Período**: "Última hora" ou "Todo o período"
5. **Marque apenas**:
   - ✅ Cookies e outros dados do site
   - ✅ Dados de sites em cache
6. **Clique em "Limpar dados"**

### Método 3: Limpar Apenas localhost (Mais Preciso)

1. **Abra o Chrome**
2. **Digite na barra de endereço**: `chrome://settings/siteData`
3. **Na busca, digite**: `localhost`
4. **Selecione todos os itens de localhost:5173**
5. **Clique em "Remover"** ou "Limpar dados"

### Método 4: Via Console do Chrome (Rápido)

1. **Abra http://localhost:5173 no Chrome**
2. **Pressione F12** (DevTools)
3. **Vá na aba "Console"**
4. **Cole e execute**:

```javascript
// Limpar tudo
localStorage.clear();
sessionStorage.clear();

// Limpar cookies
document.cookie.split(";").forEach(function(c) {
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
});

console.log('✅ Storage limpo! Recarregue a página.');
```

5. **Recarregue a página** (F5)

## 🔄 Após Limpar

1. **Feche TODAS as abas do Chrome** com localhost:5173
2. **Feche o Chrome completamente** (verifique na barra de tarefas)
3. **Abra o Chrome novamente**
4. **Acesse**: http://localhost:5173
5. **Faça login**: `adm@agenciaf3f.com.br` / `adm@123`

## ✅ Verificação

Para verificar se foi limpo:

1. **Abra DevTools** (F12)
2. **Vá em Application > Storage**
3. **Verifique**:
   - Local Storage: deve estar vazio ou muito pequeno (< 5KB)
   - Cookies: deve estar vazio ou muito pequeno (< 1KB)
   - Session Storage: deve estar vazio

## 🚨 Se Ainda Não Funcionar

### Verificar Extensões do Chrome

Algumas extensões podem estar interferindo:

1. **Abra uma janela anônima** (Ctrl+Shift+N)
2. **Acesse**: http://localhost:5173
3. **Se funcionar na anônima**: O problema são extensões ou dados do perfil

### Desabilitar Extensões Temporariamente

1. **Digite na barra**: `chrome://extensions/`
2. **Desabilite extensões** relacionadas a:
   - Auth/Login
   - Cookies
   - Privacy
3. **Teste novamente**

### Usar Perfil Limpo

1. **Crie um novo perfil do Chrome**:
   - Clique no ícone de perfil (canto superior direito)
   - "Adicionar"
   - Crie um perfil de teste
2. **Acesse localhost:5173 no perfil novo**
3. **Se funcionar**: O problema são dados do perfil antigo

## 📊 Comparação

| Browser | Status | Motivo |
|---------|--------|--------|
| Cursor Browser | ✅ Funciona | Sem dados antigos |
| Chrome | ❌ Erro 431 | Cookies/dados antigos acumulados |

## 💡 Prevenção Futura

Para evitar que isso aconteça novamente:

1. **Use localStorage** (já configurado ✅)
2. **Evite cookies grandes** (já configurado ✅)
3. **Limpe periodicamente** dados de desenvolvimento
4. **Use modo anônimo** para testes

## 🔧 Script Automático

Crie um bookmark no Chrome com este código para limpar rapidamente:

**Nome**: "Limpar localhost"
**URL**: 
```javascript
javascript:(function(){localStorage.clear();sessionStorage.clear();document.cookie.split(";").forEach(function(c){document.cookie=c.replace(/^ +/,"").replace(/=.*/,"=;expires="+new Date().toUTCString()+";path=/");});alert('✅ Storage limpo! Recarregue a página.');})();
```

Para usar: Clique no bookmark quando estiver em localhost:5173
