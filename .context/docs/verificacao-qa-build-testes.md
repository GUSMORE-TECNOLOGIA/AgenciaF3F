# Verificação QA – Build e testes (Fase 7 – opcional)

Data: 2026-02-09. Skill: F3F-qa-tester.

## Build

- **`npm run build`:** Executado e passou (tsc + vite build). Warnings: chunk >1000 kB e import dinâmico de financeiro em planos; não impedem o build.

## Testes

- **`npm run test`:** Não existe script no `package.json`. O projeto não possui suite de testes automatizados configurada.
- **Recomendação:** Adotar Vitest (unit) e/ou Playwright (E2E) conforme [F3F-qa-tester/reference.md](../../.cursor/skills/F3F-qa-tester/reference.md). Cenários prioritários quando houver testes:
  - **Login:** fluxo de autenticação, redirect quando não autenticado, alterar senha.
  - **Clientes:** listagem, criar, editar, soft delete (se aplicável), permissões por perfil.
- Edge cases de formulários (CPF, data, telefone, moeda) conforme checklist da skill QA; quando InputCpf/InputData forem adotados, cobrir validações.

## Resumo

- Build: **verde.**
- Testes: **não configurados;** planejamento acima para quando a equipe adotar.
