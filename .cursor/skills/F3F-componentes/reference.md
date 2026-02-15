# Referência – Componentes e bibliotecas (F3F)

Documento **progressivo**: preencher "Biblioteca / Componente" e "Caminho" quando a lib ou o componente for adotado. Manter as especificações (máscara, formato, a11y) como contrato.

**Campos oficiais do sistema:** Telefone, CPF/Documento e Data são **campos oficiais** quando definidos aqui. Em qualquer tela que capture ou exiba esses tipos deve ser usado **somente** o componente registrado nesta referência. Nenhuma área cria variante própria. Requisitos em `.context/docs/` quando existirem.

### Bibliotecas oficiais (quando instaladas)

| Campo | Biblioteca principal | Outras |
|-------|----------------------|--------|
| **Telefone** | react-phone-number-input | — |
| **CPF / Documento** | cpf-cnpj-validator (validação) + react-imask (máscara) | Zod (esquemas) |
| **Data** | react-imask (máscara) + date-fns (manipulação) | Zod (validação); shadcn Popover + Calendar |
| **Moeda** | react-number-format (UI) + currency.js (cálculos) | Zod (validação); banco numeric(12,2) |

**Máscaras:** react-imask para CPF e Data. react-number-format para Moeda. Telefone usa a UI da react-phone-number-input.

**Outras libs (formulários, UX):** React Hook Form (formulários), Sonner (toasts), clsx + tailwind-merge + **cn()** (base shadcn). TanStack Table e Recharts: adotar quando houver listagem complexa. Ver docs do projeto em `.context/docs/` quando existirem.

### Mensagens padronizadas (toasts, confirmações)

- **Módulo:** quando adotado, ex.: `src/shared/messages/` ou `src/lib/messages/`. Documentar aqui.
- **Uso:** getMessage(key), toastSuccess(key), toastError(key); ConfirmDialog e presets (ConfirmDeleteDialog, ConfirmUnsavedDialog) quando existirem.
- **Regra:** Telas de salvar/excluir usam chaves e componentes de confirmação padronizados; evitar texto hardcoded.

### Barrel (importação única)

- **Arquivo:** `src/shared/ui/index.ts` ou `src/components/ui/index.ts` conforme o projeto.
- **Uso:** Importar campos oficiais somente do barrel quando existir.
- **Exemplo:** `import { InputCpf, InputData } from "@/shared/ui";` (ou path do projeto). Ao criar novo componente oficial, adicionar o export no index.

---

## CPF

### Especificação

- **Campo oficial:** uso obrigatório onde CPF for capturado ou exibido (cliente, usuário, etc.).
- **Máscara de exibição:** `000.000.000-00` (11 dígitos).
- **Validação:** dígitos verificadores; rejeitar sequências inválidas (ex.: 111.111.111-11).
- **Valor no estado / envio à API:** apenas números (string).
- **Acessibilidade:** input com label ou aria-label; mensagem de erro com aria-describedby e aria-invalid.

### Biblioteca / Componente

| Item | Status |
|------|--------|
| **Validação** | cpf-cnpj-validator + Zod (quando adotado). |
| **Máscara** | react-imask – máscara 000.000.000-00. |
| **Caminho do componente** | A definir (ex.: `src/components/ui/InputCpf.tsx` ou `src/shared/ui/InputCpf.tsx`). |
| **Nome do componente** | InputCpf. |
| **Props principais** | value, onChange, placeholder, disabled, id, aria-*; valor enviado: só números. |

---

## Telefone

### Especificação

- **Campo oficial:** uso obrigatório onde telefone/celular for capturado ou exibido. Suporte DDI (ex.: +55 Brasil). Máscara celular (00) 00000-0000; fixo (00) 0000-0000.
- **Valor no estado / envio à API:** E.164 (ex.: +5521979005070) ou apenas números, conforme contrato.
- **Acessibilidade:** label; aria-describedby para erro.

### Biblioteca / Componente

| Item | Status |
|------|--------|
| **Biblioteca** | react-phone-number-input (quando adotado). |
| **Caminho do componente** | A definir (ex.: InputTelefone.tsx). |
| **Nome do componente** | InputTelefone. |
| **Props principais** | value, onChange, defaultCountry ("BR"), placeholder, disabled, id, aria-*. |

---

## Data / Calendário

### Especificação

- **Campo oficial:** uso obrigatório onde data for capturada ou exibida. Exibição pt-BR dd/MM/yyyy; máscara 99/99/9999.
- **Valor no estado / API:** ISO 8601 yyyy-MM-dd ou tipo date; timezone alinhado ao backend.
- **Acessibilidade:** label; aria-invalid e aria-describedby em erro.

### Biblioteca / Componente

| Item | Status |
|------|--------|
| **Máscara** | react-imask (quando adotado). |
| **Manipulação** | date-fns. |
| **Validação** | Zod (ano 1900–2099 via `dateSchemaRefined` em `@/lib/validators/plano-schema`). |
| **Calendário** | shadcn/ui Popover + Calendar. |
| **Caminho do componente** | A definir (ex.: InputData.tsx). Projeto já tem DateRangePicker em src/components/. |
| **Nome do componente** | InputData (campo único); DateRangePicker (período). |
| **Inputs nativos type="date"** | Usar `min={DATE_MIN}` e `max={DATE_MAX}` (exportados de `@/lib/validators/plano-schema`); Data de Fim: `min={dataInicio ?? DATE_MIN}`. |

---

## Moeda

### Especificação

- **Campo oficial:** uso obrigatório onde valor monetário for capturado ou exibido. Exibição pt-BR (R$ 1.234,56). Estado interno: número puro. Envio à API/Supabase: numeric(12,2). Cálculos: currency.js.
- **Acessibilidade:** label; sufixo "reais" ou "R$" para leitor de tela quando necessário.

### Biblioteca / Componente

| Item | Status |
|------|--------|
| **Máscara / UI** | react-number-format – prefix R$, thousandSeparator ".", decimalSeparator ","; onValueChange entrega floatValue. |
| **Cálculos** | currency.js. |
| **Validação** | Zod. |
| **Banco** | Supabase: numeric(12,2) (skill F3F-supabase-data-engineer). |
| **Caminho do componente** | `src/components/ui/InputMoeda.tsx`. |

---

## Utilitário cn() (Tailwind + shadcn)

| Item | Status |
|------|--------|
| **Libs** | clsx + tailwind-merge. |
| **Caminho** | A definir (ex.: `src/lib/utils.ts` ou `src/shared/utils/cn.ts`). |
| **Uso** | Combinar classes Tailwind; base para componentes shadcn. Ex.: `cn("px-2", condition && "bg-red-500", className)`. |

---

## Listas e filtros padronizados

Quando o projeto adotar padrão único de listagem, todas as listagens usam **somente** esses componentes. Requisitos em `.context/docs/` quando existirem.

| Componente | Caminho (quando adotado) | Uso |
|------------|---------------------------|-----|
| **FiltroBuscaTexto** | A definir | Campo de busca com debounce; placeholder configurável. |
| **DateRangePicker** | `src/components/DateRangePicker.tsx` (já existe no F3F) | Período (from/to); presets pt-BR. |
| **DataTable** | A definir | Tabela única: colunas, ordenação, loading/empty/erro. |
| **BarraFiltrosPadrao** | A definir | Composição: busca + período + dropdown Colunas. |
| **useColunasPersistidas** | A definir | Hook para persistência de colunas (localStorage). |

Regra: importar de path único; usar mesmo padrão em todas as listagens.

---

## Outros componentes (registro progressivo)

Incluir abaixo novos tipos conforme forem adotados (CNPJ, CEP, select de país, etc.). Mesmo formato: especificação + tabela "Biblioteca / Componente".

---

## Convenções gerais

- **Nomenclatura:** PascalCase (ex.: InputCpf, InputTelefone). Arquivo com mesmo nome.
- **Props:** interface NomeDoComponenteProps; exportar quando reutilizado.
- **Estilos:** Tailwind; tokens de tema em tailwind.config.
- **Erro:** mensagem abaixo do input; aria-invalid e aria-describedby no input.

---

## Links

- [project-overview.md](.context/docs/project-overview.md) – stack do projeto.
- [F3F-frontend](.cursor/skills/F3F-frontend/SKILL.md) – skill que consome estes componentes.
