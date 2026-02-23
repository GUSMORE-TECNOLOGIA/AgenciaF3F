# Criar usuário de acesso (Equipe)

Como o sistema cria um novo usuário que pode fazer login (membro da equipe) e o que pode dar errado.

---

## O que está acontecendo (em uma frase)

O app **não pode** criar usuários no Supabase Auth direto do navegador (isso exige a chave de serviço, que é secreta). Por isso existe uma **Edge Function** `create-team-user` que: recebe seu token de admin, confirma que você é admin, e no servidor chama a API de criação de usuário e grava na tabela `usuarios`. Qualquer falha nesse caminho (função não implantada, token rejeitado, e-mail inválido, etc.) vira erro na tela.

---

## O que já foi corrigido (resumo)

| Problema | Causa | Correção |
|----------|--------|----------|
| "Failed to send a request to the Edge Function" | Função não implantada no projeto Supabase | Função implantada com `supabase functions deploy create-team-user` |
| Requisição bloqueada (CORS) | Headers CORS incompletos | Headers ajustados (authorization, apikey, content-type, x-client-info) |
| 401 Unauthorized | Token não enviado ou rejeitado | Frontend envia `Authorization: Bearer <session.access_token>`; mensagem "Sessão expirada" só para 401 |
| Botão "Sair" não funcionava | Logout API retornava 403 / sessão ausente | Logout sempre limpa estado local e redireciona para login |
| 400 mostrado como "Sessão expirada" | Qualquer non-2xx era tratado como sessão | 400/403/500 mostram a mensagem retornada pela função (ex.: "Email inválido") |

---

## Como criar um usuário agora (passo a passo)

1. **Fazer login como administrador**  
   Só quem tem `role = admin` na tabela `usuarios` pode criar outros usuários. Use o usuário admin do projeto (ex.: adm@agenciaf3f.com.br).

2. **Ir em Configurações (ou Equipe)**  
   Onde está o formulário de “Novo usuário” / “Criar usuário de acesso”.

3. **Preencher**
   - **E-mail:** válido e no formato `nome@dominio.com` (obrigatório).
   - **Nome:** qualquer nome (pode ser só o do e-mail).
   - **Perfil:** admin, gerente, agente, suporte ou financeiro (opcional; padrão: agente).

4. **Clicar em criar**  
   A Edge Function vai:
   - Validar seu token (admin).
   - Criar o usuário no Auth com senha padrão **123456** e `email_confirm: true`.
   - Inserir uma linha na tabela `usuarios` com esse id, e-mail, nome, perfil e `must_reset_password: true`.

5. **Se der certo**  
   O novo usuário já pode entrar com esse e-mail e a senha **123456** (e deve trocar a senha na primeira entrada, se o fluxo de “alterar senha” estiver ativo).

---

## O que cada erro significa

- **"Sessão expirada ou inválida. Faça login novamente..."**  
  Resposta **401**: token ausente, inválido ou expirado. Faça logout, entre de novo como admin e tente outra vez.

- **"Apenas administradores podem criar usuários"**  
  Resposta **403**: o usuário logado não é admin. Use uma conta admin.

- **"Email inválido"**  
  Resposta **400**: o e-mail está vazio ou não está no formato correto (ex.: `algo@dominio.com`).

- **Outra mensagem em inglês (ex.: "User already registered")**  
  Resposta **400** da API do Supabase Auth. A função repassa a mensagem; em geral significa que o e-mail já existe no Auth. Nesse caso a função tenta atualizar o registro em `usuarios`; se isso falhar, você verá a mensagem de erro do banco.

- **"Erro ao criar usuário. Verifique o e-mail e tente novamente."**  
  Resposta de erro (400/500) sem mensagem detalhada no body. Verifique o e-mail e, se puder, a aba Network (F12) na requisição `create-team-user` para ver o body da resposta.

- **"Não foi possível conectar à função..."**  
  Falha de rede ou função não implantada. Confirme no Supabase Dashboard (Edge Functions) que `create-team-user` está implantada no projeto correto.

---

## Conferências rápidas

- **Edge Function implantada:** Supabase Dashboard → Edge Functions → deve existir `create-team-user`.
- **Variáveis de ambiente (Vercel/produção):** `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` apontando para o **mesmo** projeto onde a função está (ex.: `rhnkffeyspymjpellmnd`).
- **Quem pode criar usuário:** apenas um usuário com `usuarios.role = 'admin'`.

---

## Resumo

Sim, **é possível incluir um usuário (membro da equipe) com o processo atual**: login como admin → Configurações/Equipe → preencher e-mail (válido) e nome → criar. A senha inicial é **123456**. Os erros que apareciam (função não implantada, CORS, 401 tratado errado, logout quebrando, 400 mostrado como “sessão”) foram tratados; se algo ainda falhar, a mensagem na tela ou no Network deve indicar o motivo (sessão, permissão, e-mail ou banco).
