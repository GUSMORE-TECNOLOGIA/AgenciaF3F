# F3F-relatorio — reference

## Checklist de entradas (evidências)

- [ ] Resumo do módulo (5–10 linhas)
- [ ] `git diff --name-only main..HEAD` (ou base)
- [ ] Logs build/test/lint (se existirem)
- [ ] Trechos migrations/RLS (se existirem)
- [ ] Trecho `.context/docs/PLAN-*.md` (se existir; senão lacuna)

## Formato de saída (copiar estrutura)

### 1) Visão executiva

Parágrafo(s) curto(s): escopo, stack confirmada por evidência, fluxos principais, integrações.

### 2) Nota global (0–10) + justificativa

Uma nota e 3–6 frases explicando trade-offs (segurança, testes, duplicação, doc).

### 3) Parecer por skill

Para cada skill aplicável:

- **Skill:** nome F3F
- **Nota:** 0–10 ou N/A
- **Justificativa:** baseada em evidência do diff/docs/execução
- **Recomendações:** máximo 3, acionáveis

Ordem sugerida de skills no texto (ajustar ao escopo): Entidades centrais → Supabase → Backend → Integrações → Frontend → Componentes → Auth/Rotas → Security & Performance → QA → Documentação → Novo módulo (se aplicável).

Se o briefing citar **Next.js App Router** e o repo for Vite: uma linha **N/A — lacuna de stack** ou correção explícita.

### 4) Síntese: Top 5 recomendações priorizadas

Tabela ou lista numerada:

| # | Recomendação | Skill dona |
|---|----------------|------------|
| 1 | … | … |
| … | … | … |

### 5) Ordem sugerida de execução por skill

Lista ordenada: **Dados → Backend → Frontend → Auth/Rotas → QA → Docs** (refinar com nomes F3F concretos).

### 6) Lacunas / assunções

Bullet list: o que não foi possível verificar; assunções feitas; risco de decisões sem evidência.

## Regras de segurança no texto

- RLS/policies: preferir política mais restritiva; apontar gaps (ex.: INSERT sem UPDATE).
- Edge Functions: citar `verify_jwt`, secrets no Supabase, nunca expor `META_APP_SECRET` / service_role no client.
- Não reproduzir segredos ou chaves de exemplos do repositório no relatório.

## Integrações externas

Se a feature usar Supabase Edge, Vercel, Meta, etc., cruzar com [.context/docs/PROJECT_INTEGRATIONS.md](../../../.context/docs/PROJECT_INTEGRATIONS.md) quando existir.
