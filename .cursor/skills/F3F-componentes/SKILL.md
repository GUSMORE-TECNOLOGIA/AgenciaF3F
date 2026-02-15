---
name: F3F-componentes
description: "Creates and standardizes reusable components and UI libraries for F3F (AgenciaF3F): fields (CPF, phone, date, currency, CEP), listas e filtros (DataTable, FiltroBuscaTexto, DateRangePicker, etc.), mensagens/toasts/ConfirmDialog. Defines which lib and component to use; progressive registry. Use when creating or changing shared components or consulting which component to use."
---

# F3F Componentes

Responsável por **componentes reutilizáveis** e **bibliotecas de UI** do F3F. Fonte única da verdade: qual componente usar para CPF, telefone, data, moeda, CEP, **listas e filtros** (DataTable, FiltroBuscaTexto, DateRangePicker quando adotados), mensagens/toasts/confirmação. O frontend (skill [F3F-frontend](.cursor/skills/F3F-frontend/SKILL.md)) **usa** o que aqui está definido. **Onde buscar:** registro no [reference.md](reference.md); código em `src/components/` ou `src/shared/ui/` (conforme o projeto).

## Implementação progressiva

- Nem todo tipo tem ainda biblioteca ou componente (ex.: calendário). Quando o projeto adotar uma lib ou criar um componente, **atualizar esta skill** e o [reference.md](reference.md) com: nome e versão da lib, caminho no repositório, props obrigatórias e uso recomendado.
- Assim todo o sistema passa a usar o mesmo padrão; nenhuma área cria "seu próprio" campo de data ou moeda sem seguir este registro.

## Quando usar esta skill

- Criar um **novo componente reutilizável** (input com máscara, date picker, CEP, etc.) que será usado em mais de uma área.
- **Listas e filtros:** definir ou alterar DataTable, FiltroBuscaTexto, DateRangePicker, BarraFiltrosPadrao, coluna-manager; registrar no reference § "Listas e filtros padronizados" quando o projeto adotar.
- **Mensagens e confirmação:** toasts, ConfirmDialog, chaves de mensagem; definir módulo e uso quando padronizar.
- Escolher ou **adotar uma biblioteca** para um tipo de campo (ex.: calendário, máscaras).
- **Padronizar** um componente já existente (unificar implementações).
- Definir ou alterar **design tokens** e **tema Tailwind** dos componentes compartilhados.
- Consultar **qual componente ou lib usar** para CPF, telefone, data, moeda, CEP, listas, filtros, mensagens.

## Regras

- **Um componente por tipo:** para cada necessidade (CPF, telefone, data, moeda), o sistema tem **um** componente ou lib aprovada documentada aqui. Evitar duplicar.
- **Documentar ao adotar:** ao escolher uma lib ou criar um componente, atualizar o [reference.md](reference.md) (biblioteca, caminho, props, exemplo de uso).
- **Localização:** componentes compartilhados em `src/components/` (ex.: layout, auth, DateRangePicker) ou `src/shared/ui/` quando existir; importação via barrel ou path direto. Ao criar componente novo, adicionar ao barrel se o projeto usar (ex.: `src/components/ui/index.ts`).
- **Acessibilidade e máscaras:** specs de máscara, formato de valor e a11y no reference; ao implementar, seguir e registrá-las.

## Regras de Implementação (shadcn/ui)

- **Base:** Usar primitivos do **shadcn/ui** (em `src/components/ui/` ou onde estiverem) como base para novos componentes padronizados.
- **Composição:** Para InputData, combinar Popover e Calendar do shadcn, encapsulando máscara e pt-BR.

## Criar novo componente padronizado

Para gerar a estrutura inicial (quando o projeto usar o script), a partir da raiz:

```bash
bash .cursor/skills/F3F-componentes/scripts/create-component.sh <Nome>
```

Ex.: `bash .cursor/skills/F3F-componentes/scripts/create-component.sh InputData` gera o arquivo com interface Props e export. Em Windows use Git Bash ou WSL. Ajustar path de saída no script se o projeto usar `src/components/ui/` em vez de `src/shared/ui/`.

## Conteúdo do reference.md

O [reference.md](reference.md) contém, por tipo de campo:

- **Especificação** (máscara, formato de exibição e envio à API, a11y).
- **Biblioteca / componente:** preenchido progressivamente – "A definir quando adotado" até que a lib ou o componente seja escolhido; depois: nome da lib, versão, caminho, props.

## Integração com outras skills

- **Frontend (F3F-frontend):** usa os componentes definidos aqui; não cria variantes próprias de CPF/telefone/data/moeda. Ao precisar de campo novo padronizado, aciona esta skill.
- **Backend (F3F-backend):** validações e formatos de API alinhados ao que os componentes enviam (ex.: CPF só números; data em ISO).

## Referência

- Especificações e registro de bibliotecas/componentes por tipo: [reference.md](reference.md) (neste diretório).
