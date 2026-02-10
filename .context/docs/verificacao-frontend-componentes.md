# Verificação Frontend e Componentes (Fase 6 – opcional)

Data: 2026-02-09. Skills: F3F-frontend, F3F-componentes.

## Conformidade com F3F-componentes/reference.md

- **InputCpf / InputData / InputMoeda:** Ainda não adotados no projeto. A referência da skill indica "Caminho do componente | A definir". Formulários usam inputs nativos, `date-fns` e `react-day-picker` onde há data; valor/moeda em campos de texto ou número.
- **Recomendação:** Quando os componentes oficiais (InputCpf, InputData, máscara moeda) forem introduzidos, revisar: ClienteForm, formulários de serviço/plano, TransacaoNovo/TransacaoEdit, e modais de edição de contrato (EditClientePlanoModal, EditClienteServicoModal).

## Padrões loading / empty / erro

- Várias telas já tratam estados de loading, lista vazia e erro (Clientes, Equipe, Financeiro, Planos, Serviços, etc.). Não foi feita padronização de mensagens ou componentes únicos de "empty state" nesta varredura; pode ser feita em demanda dedicada.

## Resumo

- **Ajustes recomendados:** Nenhum obrigatório nesta varredura. Adoção futura de InputCpf/InputData/InputMoeda conforme [F3F-componentes/reference.md](../../.cursor/skills/F3F-componentes/reference.md); então revisar formulários listados acima.
