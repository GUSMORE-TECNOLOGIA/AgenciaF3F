# Execução do teste de debug – Módulo responsáveis/perfil

Use este arquivo para rodar o teste e gerar evidência em runtime. O log é escrito em **`.cursor/debug.log`** (NDJSON).

---

## Antes do teste

1. **Limpar o log** (para não misturar com execuções antigas):
   - Apagar o arquivo `c:\Projetos\AgenciaF3F\.cursor\debug.log` se existir, ou deixar a IA fazer isso via delete_file.
2. **App rodando:** `npm run dev` (ex.: http://localhost:5173).
3. **Login:** use um usuário admin (ex.: adm@agenciaf3f.com.br).

---

## Passos do teste (reprodução)

Execute na ordem e anote o que não funcionar em cada passo.

1. **Dashboard**  
   Abra a home/dashboard. Os nomes dos responsáveis nos gráficos/cards aparecem corretamente ou vazios/errados?

2. **Criação de perfil**  
   Configurações → Equipe → aba **Perfis** → **Novo Perfil**. Preencha nome (e descrição), defina permissões e salve. Salvou sem erro?

3. **Vínculo perfil–usuário / salvamento de usuário**  
   Configurações → Equipe → aba **Membros**:
   - **Novo Membro:** preencha nome, email, perfil (ex.: Administrador ou um perfil criado) e salve. O membro aparece na tabela com o perfil certo?
   - **Editar membro:** altere o perfil de um membro e salve. O perfil persiste?

4. **Vincular responsável no cliente**  
   Clientes → abra um cliente → aba **Responsáveis**:
   - A lista de responsáveis já vinculados carrega?
   - O combo "Adicionar Responsável" tem opções? Se sim, selecione um, escolha papel(éis) e clique **Adicionar**. O responsável aparece na lista?
   - Se houver responsável vinculado, clique em **Remover**. A remoção persiste?

5. **Concluir**  
   Clique em **Proceed** na UI de debug (ou avise que terminou) para a IA ler `.cursor/debug.log` e analisar as hipóteses.

---

## Hipóteses cobertas pelos logs

| ID  | Fluxo                          |
|-----|---------------------------------|
| H6  | Criação/edição de perfil        |
| H7  | Vínculo perfil–usuário         |
| H8  | Salvamento usuário/membro       |
| H9  | Dashboard (responsáveis)        |
| H1  | Combo "Selecione responsável"   |
| H2  | Lista de responsáveis do cliente |
| H3  | Nome do responsável (get_responsavel_name) |
| H4  | Adicionar responsável (INSERT)  |
| H5  | Remover responsável (soft-delete) |

---

## Após o teste

- A IA vai ler `c:\Projetos\AgenciaF3F\.cursor\debug.log`, avaliar cada hipótese (CONFIRMED/REJECTED/INCONCLUSIVE) e propor correção com evidência.
- Não remover a instrumentação até a correção ser verificada (nova execução + confirmação do usuário).
