# Referência – F3F Frontend (estrutura e tema)

**Campos padronizados (CPF, telefone, data, moeda):** definição e registro ficam na skill [F3F-componentes](.cursor/skills/F3F-componentes/SKILL.md) e no [reference da skill Componentes](.cursor/skills/F3F-componentes/reference.md). Use sempre o componente registrado lá; não crie variantes nas telas.

**Listagens:** Quando o projeto tiver DataTable, BarraFiltrosPadrao e useColunasPersistidas, usar **somente** esses componentes (import de `@/shared/ui` e hooks correspondentes). Não montar `<table>` próprio. Requisitos em `.context/docs/` quando existirem.

---

## Convenções de componentes (telas e uso)

- **Nomenclatura:** PascalCase para componentes (ex.: `ClienteForm`, `Header`). Nome do arquivo igual ao componente (ex.: `ClienteForm.tsx`).
- **Props:** interface `NomeDoComponenteProps` no mesmo arquivo ou em `types` do módulo; exportar quando reutilizado.
- **Estilos:** Tailwind nas classes do componente; variáveis de tema (cores, espaçamento) em `tailwind.config.js` para reuso.
- **Estado de erro:** campos de formulário devem exibir mensagem de erro abaixo do input; usar `aria-invalid`/`aria-describedby` para acessibilidade.

---

## Tema Tailwind (sugestão)

- **Cores primárias/secundárias:** definir em `theme.extend.colors` no `tailwind.config` (ex.: primary, secondary, danger, success).
- **Tipografia:** fontFamily e fontSize únicos; usar em todos os módulos.
- **Espaçamento:** preferir escala padrão do Tailwind (p-4, gap-4); evitar valores arbitrários repetidos.
- **Breakpoints:** sm, md, lg, xl; mobile-first.

---

## Links

- [F3F-componentes](.cursor/skills/F3F-componentes/SKILL.md) – componentes e campos padronizados.
- [project-overview.md](.context/docs/project-overview.md) – stack e paradigma.
- [architecture.md](.context/docs/architecture.md) – visão da aplicação.
