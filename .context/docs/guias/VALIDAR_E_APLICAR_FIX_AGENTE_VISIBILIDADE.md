# Validação e fix: agente vê 0 clientes no dashboard

Guia **único** para validar e corrigir o problema em que o **admin** vê os clientes e o **agente** vê 0.  
Sempre executar no **projeto Supabase F3F** (`rhnkffeyspymjpellmnd`). Ver [PROJECT_INTEGRATIONS.md](../PROJECT_INTEGRATIONS.md).

---

## 1. Onde executar

- **Dashboard Supabase:** https://app.supabase.com/project/rhnkffeyspymjpellmnd  
- **SQL Editor** (menu lateral) → nova query para cada bloco abaixo.

---

## 2. Validação (rodar primeiro)

Cole e execute. O resultado deve indicar se o fix já está aplicado ou não.

```sql
-- Retorna: status_visibilidade_agente = 'OK' se a função tem fallback; 'FALTA_APLICAR_FIX' se não tem.
SELECT
  CASE
    WHEN pg_get_functiondef(p.oid) LIKE '%c.responsavel_id = auth.uid()%' THEN 'OK'
    ELSE 'FALTA_APLICAR_FIX'
  END AS status_visibilidade_agente,
  (SELECT COUNT(*) FROM public.clientes WHERE deleted_at IS NULL AND responsavel_id IS NOT NULL) AS clientes_com_responsavel_id
FROM pg_proc p
WHERE p.proname = 'is_responsavel_do_cliente';
```

- Se **status_visibilidade_agente = 'OK'**: a função já considera `clientes.responsavel_id`; pule para a seção 4 (reload + teste no app).
- Se **FALTA_APLICAR_FIX**: execute o **Passo 3** abaixo.

---

## 3. Aplicar o fix (apenas se a validação indicar FALTA_APLICAR_FIX)

Cole **todo** o bloco no SQL Editor e execute (Run).

> **Por que `OR` e não `COALESCE`?**  
> `COALESCE(false, true) = false` — COALESCE retorna o **primeiro valor não-NULL**, e `is_admin()` retorna `FALSE` (não `NULL`) para agentes. Então `COALESCE(FALSE, EXISTS(...))` parava em `FALSE` sem avaliar o `EXISTS`. A solução é usar `OR`.

```sql
-- Fix definitivo: usar OR (não COALESCE) para combinar condições booleanas.
-- Idempotente: pode rodar mais de uma vez.
CREATE OR REPLACE FUNCTION public.is_responsavel_do_cliente(p_cliente_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.cliente_responsaveis cr
      WHERE cr.cliente_id = p_cliente_id
        AND cr.responsavel_id = auth.uid()
        AND cr.deleted_at IS NULL
    )
    OR COALESCE(
      (SELECT (c.responsavel_id = auth.uid())
       FROM public.clientes c
       WHERE c.id = p_cliente_id AND c.deleted_at IS NULL
       LIMIT 1),
      false
    );
$$;

COMMENT ON FUNCTION public.is_responsavel_do_cliente(uuid) IS 'True se admin OR em cliente_responsaveis OR clientes.responsavel_id = auth.uid(). Usa OR (não COALESCE) para combinar booleanos.';

NOTIFY pgrst, 'reload schema';
```

Depois rode de novo a **Validação** (seção 2); deve retornar **OK**.

---

## 4. Reload do schema e teste no app

1. Se você acabou de aplicar o fix (Passo 3), o `NOTIFY pgrst, 'reload schema'` já foi enviado.
2. Peça ao **agente** (ex.: Raphael Leça):
   - **Hard refresh** (Ctrl+F5) no dashboard, ou
   - Abrir o dashboard em **aba anônima** e fazer login de novo.
3. O dashboard deve passar a mostrar os clientes cujo `responsavel_id` = usuário do agente (ou que estejam em `cliente_responsaveis` para ele).

---

## 5. Se ainda mostrar 0 após o fix

O app exibe uma caixa de diagnóstico com **“O ID do seu login no sistema é: &lt;uuid&gt;”**.

- Se esse **uuid** for **diferente** do que está em `clientes.responsavel_id` para os clientes que o agente deveria ver, então o login dele está em **outra conta** (outro usuário no Auth). Nesse caso um **admin** deve rodar no SQL Editor (substituindo os UUIDs):

  ```sql
  -- Atribuir ao agente (auth_uid) os clientes que estão com outro responsável (uid_antigo).
  UPDATE public.clientes
  SET responsavel_id = '<auth_uid da caixa do app>'
  WHERE responsavel_id = '<uid_antigo que tem os clientes>' AND deleted_at IS NULL;
  ```

  Para achar o **uid_antigo**:  
  `SELECT DISTINCT c.responsavel_id, u.name FROM public.clientes c LEFT JOIN public.usuarios u ON u.id = c.responsavel_id WHERE c.responsavel_id IS NOT NULL AND c.deleted_at IS NULL;`

- Se o **uuid** na caixa for **o mesmo** que já tem os clientes e ainda assim 0, repita o **Passo 3** (fix) e em seguida `NOTIFY pgrst, 'reload schema';` e peça novo hard refresh (Ctrl+F5).

---

## 6. Resumo do fluxo (para o Gerente / Supabase)

| Etapa | Responsável | Ação |
|-------|-------------|------|
| Validação (seção 2) | Quem aplica | Rodar query; ver status OK ou FALTA_APLICAR_FIX |
| Aplicar fix (seção 3) | Quem aplica | Só se FALTA_APLICAR_FIX; CREATE OR REPLACE + NOTIFY |
| Reload + teste (seção 4) | Agente | Ctrl+F5 ou aba anônima |
| Ainda 0 (seção 5) | Admin | Verificar uuid no app; UPDATE clientes se for conta diferente |

Referência técnica: [analise-responsavel-por-cliente.md](../analise-responsavel-por-cliente.md).  
Histórico do bug: [troubleshooting-log.md](../troubleshooting-log.md) (entrada “Agente vê zero no dashboard”).
