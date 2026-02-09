# Troubleshooting Log – AgenciaF3F

Registro de erros analisados, causa raiz e solução. Consultar antes de RCA em erros parecidos.

---

## Formato das entradas

| Campo | Descrição |
|-------|-----------|
| **Data** | Quando foi identificado/corrigido |
| **Descrição do erro** | Mensagem ou sintoma |
| **Arquivo(s)/módulo** | Onde ocorreu |
| **Causa raiz** | Por que aconteceu |
| **Solução aplicada** | O que foi feito |
| **Lição aprendida** | Evitar repetição |

---

## 2026-02-09 – Coluna `cargo` não existe em `equipe_membros` (schema cache)

| Campo | Conteúdo |
|-------|----------|
| **Data** | 2026-02-09 |
| **Descrição do erro** | "Could not find the 'cargo' column of 'equipe_membros' in the schema cache". Ao salvar edição de membro na tela Equipe (Configurações), o modal exibia esse erro. |
| **Arquivo(s)/módulo** | `src/services/equipe.ts` (insert, update, mapEquipeMembro). Módulo Configurações > Equipe. |
| **Causa raiz** | A migration `20260120112018_perfil_e_reset_senha.sql` renomeou a coluna `cargo` para `perfil` na tabela `equipe_membros`. O service continuava enviando e lendo a coluna `cargo`, que não existe mais no schema. |
| **Solução aplicada** | Em `equipe.ts`: (1) no INSERT e no UPDATE, trocar `cargo: input.perfil` por `perfil: input.perfil`; (2) no `mapEquipeMembro`, trocar `data.cargo ?? data.perfil` por `data.perfil ?? 'agente'`. |
| **Lição aprendida** | Após renomear coluna via migration, buscar todas as referências ao nome antigo no código (services, hooks, tipos) e atualizar. Verificar `select('*')` e payloads de insert/update. |

---

## Dashboard – nome do responsável errado

| Campo | Conteúdo |
|-------|----------|
| **Data** | 2026-02-09 |
| **Descrição do erro** | No dashboard, os nomes exibidos por responsável (clientes por responsável, atrasados por responsável, etc.) não batem com o nome completo da equipe. |
| **Arquivo(s)/módulo** | Dashboard usa `fetchResponsaveisParaDashboard()` → RPC `get_responsaveis_para_dashboard`. |
| **Causa raiz** | A RPC pode estar na versão antiga (retornando só `usuarios.name`) se a migration que passa a usar `equipe_membros.nome_completo` não tiver sido aplicada no projeto Supabase em uso (ex.: produção). |
| **Solução aplicada** | Garantir que a migration `20260209120100_rpc_get_responsaveis_dashboard_nome_equipe.sql` está aplicada no Supabase do ambiente (produção/preview). Essa RPC retorna `COALESCE(equipe_membros.nome_completo, usuarios.name)`. Sem essa migration, a RPC antiga continua retornando apenas `usuarios.name`. |
| **Lição aprendida** | Conferir no Supabase (Dashboard > SQL ou migrations aplicadas) se as migrations de RPC/nome completo foram executadas no projeto correto. Deploy do frontend não aplica migrations automaticamente. |
