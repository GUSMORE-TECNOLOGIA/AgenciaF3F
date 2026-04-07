---
name: f3f-relatorio
description: Produces a governance-focused post-feature audit report for AgenciaF3F (F3F) with executive summary, 0–10 scores per relevant F3F skill, prioritized recommendations, and ordered next steps (data → backend → frontend → auth → QA → docs). Use when the user asks for F3F-relatorio, auditoria por skills, relatório de feature, release review, or governance/RLS/security assessment of a merged branch or PR.
---

# F3F-relatorio — Auditoria e relatório por skills

## Quando usar

- Fechamento de feature/módulo, antes ou depois de merge.
- Pedido explícito: `/F3F-relatorio`, “auditoria por skills”, “relatório da feature”.
- Revisão de governança: RLS, permissões, integrações, qualidade.

## Stack do F3F (evidência primeiro)

O repositório padrão é **Vite + React + React Router + Supabase** (ver `vite.config.ts`, `App.tsx`). **Não assumir Next.js App Router**; se o briefing mencionar Next, **marcar como lacuna** ou “N/A — stack F3F é Vite” com base em arquivos.

**Multi-tenant `org_id`:** só avaliar se houver evidência no código/schema/docs. Se não houver, declarar **lacuna** ou “fora de escopo do modelo atual” (ver [.context/docs/skills-map.md](../../../.context/docs/skills-map.md) e Auth skill).

## Entradas obrigatórias (pedir ou obter via ferramentas)

Solicitar **nesta ordem**; se faltar algo, seguir com **lacuna** explícita.

1. **Resumo do módulo** (5–10 linhas): o que faz, fluxos, rotas/telas.
2. **Arquivos alterados:** saída de `git diff --name-only main..HEAD` (ou base acordada).
3. **Evidências opcionais:** trechos de build/test/lint; SQL de migrations/RLS relevantes.
4. **Plano:** trecho de `.context/docs/PLAN-*.md` ou equivalente; se não existir → **lacuna**.

## Regras de redação

- **Não inventar** schema, endpoints ou decisões: sem evidência → **lacuna**.
- **Segurança:** “mais restritivo vence” (RLS, policies, ModuleGuard, Edge `verify_jwt`).
- Sempre **riscos + impacto** (produto / engenharia).
- **Próximos passos** finais na ordem fixa: **Dados (Supabase) → Backend → Frontend → Auth/Rotas → QA → Documentação**.

## Skills relevantes (mapa para o parecer)

Usar o mapa em [.context/docs/skills-map.md](../../../.context/docs/skills-map.md). Para cada feature, selecionar o subconjunto aplicável (ex.: módulo novo → Novo módulo, Supabase, Backend, Frontend, Auth, Integrações, Componentes, QA, Security, Documentação). **F3F-gerente** não recebe nota de implementação; pode mencionar orquestração se couber.

Incluir **F3F-security-performance** quando houver RLS, Edge Functions, segredos ou dados sensíveis.

## Rubrica global (0–10)

| Faixa | Significado |
|-------|-------------|
| 10 | Escalável, testado, documentado, seguro, sem duplicação injustificada |
| 8–9 | Sólido; melhorias pequenas |
| 6–7 | Funcional; riscos claros (teste, UX, security, duplicação) |
| 4–5 | Instável ou incompleto |
| 0–3 | Bloqueado, invariantes violadas, build quebrado |

## Formato de saída (obrigatório)

Emitir exatamente as seções abaixo (títulos podem ser em pt-BR como no template). Detalhes e exemplo de tabela Top 5: ver [reference.md](reference.md).

1. **Visão executiva**
2. **Nota global (0–10) + justificativa**
3. **Parecer por skill** (cada uma): Nota (0–10 ou N/A) · Justificativa · até **3** recomendações objetivas
4. **Síntese: Top 5 recomendações priorizadas** (com skill dona)
5. **Ordem sugerida de execução por skill** (próximos passos)
6. **Lacunas / assunções**

## Execução prática

1. Rodar `git diff --name-only main..HEAD` (ou base informada).
2. Ler migrations/RLS em `supabase/migrations/` tocadas pelo diff.
3. Conferir `PROJECT_INTEGRATIONS.md`, ADRs e troubleshooting se a feature integrar sistemas externos.
4. Se possível, citar resultado de `npm run build` / `npm run lint` / testes (sem inventar log).

## Referência

- Template completo do relatório e checklist: [reference.md](reference.md)
- Mapa de skills: [.context/docs/skills-map.md](../../../.context/docs/skills-map.md)
