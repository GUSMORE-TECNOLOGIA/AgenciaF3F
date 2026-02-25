# Aplicar correção: agente vê zero clientes no dashboard

**Guia canônico (validação + fix em um só lugar):**  
**[VALIDAR_E_APLICAR_FIX_AGENTE_VISIBILIDADE.md](./VALIDAR_E_APLICAR_FIX_AGENTE_VISIBILIDADE.md)**

Use o guia acima para:
1. **Validar** se a função `is_responsavel_do_cliente` já tem o fallback (`clientes.responsavel_id = auth.uid()`).
2. **Aplicar o fix** (só se a validação indicar FALTA_APLICAR_FIX) com um único bloco SQL.
3. **Reload** e teste no app (agente dá F5 / Ctrl+F5).
4. Se ainda 0: conferir **uuid no diagnóstico** do app e eventual **UPDATE clientes** (ver seção 5 do guia).

---

## Projeto correto (obrigatório)

| Campo | Valor |
|-------|--------|
| **Projeto** | F3F (Agência F3F) |
| **Project ID** | `rhnkffeyspymjpellmnd` |
| **Dashboard** | https://app.supabase.com/project/rhnkffeyspymjpellmnd |

Não aplicar em outro projeto. Ver [PROJECT_INTEGRATIONS.md](../PROJECT_INTEGRATIONS.md).

---

## Migrations no repositório (referência)

- **20260224190000** – fix original (função + backfill em `cliente_responsaveis`).
- **20260224210000** – força a mesma função (idempotente); use se o fix não tiver sido aplicado ou para garantir após deploy.
- **20260224200000** – RPC de diagnóstico `get_debug_visibilidade_clientes` (opcional; o app já mostra o diagnóstico quando total = 0).

---

## Referência

- [troubleshooting-log.md](../troubleshooting-log.md) – entrada “Agente vê zero no dashboard”
- [analise-responsavel-por-cliente.md](../analise-responsavel-por-cliente.md)
