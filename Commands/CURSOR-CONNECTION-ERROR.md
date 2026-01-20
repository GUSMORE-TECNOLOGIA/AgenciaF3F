# Solução para Erro de Conexão no Cursor IDE

## Problema
Erro "Connection failed" ao tentar usar o chat do Cursor IDE. Request IDs: `d435d4ca-6b2f-4ef5-8a24-4c563dc6c0cd`, `d048ba9d-fb73-4490-b86f-201b8ae7b7c2`

## Causa Raiz
Falha na conexão entre o Cursor IDE e os servidores da API do Cursor. Pode ser causado por:
1. Problemas de rede/firewall bloqueando conexões
2. VPN ou proxy interferindo na conexão
3. Problemas temporários nos servidores do Cursor
4. Configurações de proxy incorretas no Cursor
5. Cache corrompido do Cursor

## Soluções (em ordem de prioridade)

### 1. Verificar Conexão de Internet
```powershell
# Testar conectividade básica
Test-NetConnection -ComputerName api.cursor.sh -Port 443
Test-NetConnection -ComputerName cursor.sh -Port 443
```

### 2. Verificar/Desabilitar VPN
- Se estiver usando VPN, tente desabilitá-la temporariamente
- Algumas VPNs bloqueiam conexões para serviços de IA
- Teste com VPN desabilitada

### 3. Verificar Configurações de Proxy no Cursor
1. Abra as configurações do Cursor (Ctrl+,)
2. Procure por "proxy" nas configurações
3. Se houver configurações de proxy, verifique se estão corretas
4. Tente desabilitar proxy temporariamente para testar

### 4. Limpar Cache do Cursor
```powershell
# Fechar o Cursor completamente primeiro
# Depois executar:

# Windows - Limpar cache do Cursor
Remove-Item -Path "$env:APPDATA\Cursor\Cache\*" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$env:APPDATA\Cursor\Code Cache\*" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$env:APPDATA\Cursor\GPUCache\*" -Recurse -Force -ErrorAction SilentlyContinue
```

### 5. Verificar Firewall/Antivírus
- Verifique se o firewall do Windows está bloqueando o Cursor
- Adicione exceção para o Cursor no firewall
- Verifique se o antivírus não está bloqueando conexões

### 6. Reiniciar o Cursor
1. Feche completamente o Cursor (verifique no Gerenciador de Tarefas)
2. Aguarde 10 segundos
3. Reabra o Cursor

### 7. Verificar Status dos Servidores do Cursor
- Acesse: https://status.cursor.sh (se existir)
- Ou verifique o Twitter/X oficial do Cursor para avisos

### 8. Atualizar o Cursor
1. Vá em Help > Check for Updates
2. Instale atualizações se disponíveis
3. Reinicie o Cursor

### 9. Verificar Configurações de Rede do Sistema
```powershell
# Verificar configurações de DNS
Get-DnsClientServerAddress

# Flush DNS cache
ipconfig /flushdns

# Verificar rota para servidores do Cursor
nslookup api.cursor.sh
```

### 10. Reinstalar o Cursor (último recurso)
1. Desinstale o Cursor completamente
2. Delete as pastas de configuração:
   - `%APPDATA%\Cursor`
   - `%LOCALAPPDATA%\Cursor`
3. Reinstale a versão mais recente do Cursor
4. Faça login novamente

## Validação

Após aplicar as soluções, teste:
1. Abra o Cursor IDE
2. Tente iniciar uma conversa no chat
3. Verifique se o erro "Connection failed" não aparece mais
4. Teste com uma pergunta simples como "Olá"

## Observabilidade

Para diagnosticar melhor o problema:
1. Abra o DevTools do Cursor (Help > Toggle Developer Tools)
2. Vá na aba "Network"
3. Tente usar o chat novamente
4. Procure por requisições falhadas (status 4xx ou 5xx)
5. Verifique os detalhes do erro na aba "Console"

## Logs Úteis

Se o problema persistir, colete:
- Mensagens de erro completas do console do Cursor
- Request IDs dos erros
- Timestamp dos erros
- Configurações de rede (VPN, proxy, firewall)

## Contato com Suporte

Se nenhuma solução funcionar:
1. Acesse: https://cursor.sh/support
2. Forneça:
   - Request IDs dos erros
   - Versão do Cursor (Help > About)
   - Sistema operacional
   - Descrição detalhada do problema
   - Logs do console (se disponíveis)

## Checklist Rápido

- [ ] Internet funcionando normalmente
- [ ] VPN desabilitada (se aplicável)
- [ ] Firewall não bloqueando Cursor
- [ ] Cache do Cursor limpo
- [ ] Cursor atualizado para última versão
- [ ] Cursor reiniciado completamente
- [ ] DNS funcionando corretamente
- [ ] Sem proxy configurado (ou proxy correto)

