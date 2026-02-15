# Referência – F3F UX / Designer

Estrutura de mockup textual, checklist de copy e estados (loading, empty). **Registro progressivo:** padrões de copy e fluxos adotados podem ser documentados aqui para consistência.

---

## Mockup textual (estrutura)

Descrever a tela em texto/markdown para o Frontend implementar. Incluir:

- **Título da tela** (h1 ou equivalente).
- **Blocos em ordem:** cabeçalho, filtros, tabela/lista, formulário, ações (botões), rodapé.
- **Por bloco:** o que aparece (ex.: "Tabela com colunas: Nome, Email, Ações") e copy exato de labels e botões.
- **Elementos interativos:** "Botão [Salvar]" ao lado do formulário; "Link [Voltar]" no topo.
- **Responsividade (se relevante):** ex.: "Em mobile, filtros colapsam em drawer."

Exemplo mínimo:

```markdown
## Tela: Lista de clientes

- Cabeçalho: título "Clientes", botão "Novo cliente".
- Filtro: campo busca (placeholder "Buscar por nome ou email"), botão "Filtrar".
- Tabela: colunas Nome, Email, Status, Ações (ícone editar, ícone excluir).
- Empty state: "Nenhum cliente encontrado." + botão "Cadastrar primeiro cliente".
- Loading: texto "Carregando clientes..."
```

---

## Checklist: copy (botões, erros, labels)

- **Botões primários:** verbo no imperativo (ex.: "Salvar", "Cadastrar", "Enviar"). Evitar "Ok" genérico quando houver ação clara.
- **Botões secundários / cancelar:** "Cancelar", "Voltar"; consistente em todo o sistema.
- **Labels de campo:** nome do campo, claro (ex.: "CPF", "Data de nascimento"); obrigatório indicado com * ou "(obrigatório)" conforme padrão do projeto.
- **Placeholders:** texto de exemplo que não substitui o label (ex.: "000.000.000-00" para CPF).
- **Mensagens de erro:** específicas e acionáveis (ex.: "CPF inválido." ou "Preencha o CPF."); evitar só "Erro" ou "Campo inválido" sem contexto.
- **Empty state:** frase curta + ação sugerida (ex.: "Nenhum resultado encontrado." + "Limpar filtros" ou "Cadastrar primeiro item").
- **Loading:** "Carregando..." ou "Carregando [recurso]..." (ex.: "Carregando clientes...").
- **Idioma:** pt-BR em toda a interface (AGENTS.md).

---

## Estados: loading e empty

Para cada tela ou lista que depende de dados:

| Estado   | O que definir |
|----------|----------------|
| **Loading** | Texto exibido (ex.: "Carregando..."); se usar skeleton/spinner, indicar. |
| **Empty**   | Texto (ex.: "Nenhum registro encontrado."); botão ou link de ação (ex.: "Cadastrar primeiro cliente"). |
| **Erro**    | Mensagem (ex.: "Não foi possível carregar. Tente novamente."); ação (ex.: botão "Tentar novamente"). |

Registrar no mockup ou em tabela por tela quando o projeto padronizar.

---

## Hierarquia visual

- **Título da página:** um h1 por tela; nome claro do contexto (ex.: "Clientes", "Atendimentos", "Configurações").
- **Subtítulos e seções:** h2/h3 para agrupar (ex.: "Dados pessoais", "Contato"); ordem lógica (dados principais antes de secundários).
- **Ênfase:** ações principais (ex.: "Salvar") em destaque; secundárias (ex.: "Cancelar") em estilo menos enfático; seguir padrão shadcn/ui (variant default vs outline vs ghost).
- **Agrupamento:** campos relacionados no mesmo Card ou fieldset; não misturar muitas ações no mesmo bloco sem separação visual.

---

## Fluxo do usuário

Ao definir fluxo (ex.: cadastro em etapas, lista → detalhe → edição):

- **Passos em ordem:** 1) Lista; 2) Clicar em item → Detalhe; 3) Botão Editar → Formulário; 4) Salvar → volta ao Detalhe ou Lista.
- **Navegação:** breadcrumb ou "Voltar" quando fizer sentido; evitar dead-end (tela sem saída clara).
- **Ações por passo:** o que o usuário pode fazer em cada tela (ex.: na lista: filtrar, criar, abrir; no detalhe: editar, excluir, voltar).

Documentar em lista ou diagrama de texto (ex.: fluxo em markdown com setas).

---

## shadcn/ui e Tailwind

- O projeto usa **shadcn/ui** (componentes coláveis com Tailwind) e **Tailwind** para estilos ([project-overview](.context/docs/project-overview.md)).
- Ao sugerir estrutura, preferir componentes que existem no shadcn (Button, Card, Input, Table, Dialog, etc.); o Frontend e a skill Componentes podem já ter esses blocos.
- Não definir nomes de classe Tailwind arbitrários no mockup; descrever a **intenção** (ex.: "botão primário", "card com padding") para o Frontend mapear para o design system.

---

## Registro progressivo

Padrões de copy e fluxos adotados pelo projeto podem ser listados aqui para reuso.

| Item | Texto / Padrão |
|------|----------------|
| **Empty state genérico** | "Nenhum registro encontrado." |
| **Loading genérico** | "Carregando..." |
| **Botão salvar** | "Salvar" |
| **Botão cancelar** | "Cancelar" |
| *(outros)* | Preencher quando padronizar. |

---

## Links

- [project-overview.md](.context/docs/project-overview.md) – stack (shadcn/ui, Tailwind).
- [F3F-frontend](.cursor/skills/F3F-frontend/SKILL.md) – quem implementa as telas.
- [F3F-componentes](.cursor/skills/F3F-componentes/SKILL.md) – componentes e campos padronizados.
