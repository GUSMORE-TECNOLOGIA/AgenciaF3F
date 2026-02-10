# UX – Aba Serviços (módulo Cliente)

Especificação para a aba **Serviços** dentro do detalhe do cliente: campos **Status** e **Contrato** visíveis desde a criação e layout mais profissional.

**Estrutura da aba (ordem):** **Contratos** → **Planos Contratados** → **Serviços Avulsos**. A seção Contratos permite criar e editar contratos (entidade que agrupa planos/serviços); ao adicionar plano ou serviço, é possível vincular a um contrato (opcional).

---

## Regras de negócio

- **Status:** sempre visível (na criação e na edição). Opções: Ativo, Pausado, Cancelado, Finalizado. Valor padrão na criação: **Ativo**.
- **Contrato (campo em plano/serviço):** sempre visível (na criação e na edição). Opções: **Assinado**, **Não assinado**, **Cancelado**. Valor padrão na criação: **Não assinado**.
- **Contratos (entidade):** seção própria na aba; lista, adicionar e editar; nome opcional, status, contrato (Assinado/Não assinado/Cancelado), datas (início, fim, assinatura, cancelamento) e observações. Planos e serviços podem ser vinculados a um contrato ao serem criados. **Cascade:** ao marcar o contrato como cancelado (status ou contrato = Cancelado), todos os planos e serviços vinculados são atualizados para cancelado e recebem a data de cancelamento do dia.

---

## Mockup textual – Planos Contratados

### Bloco: cabeçalho da seção
- Título: **Planos Contratados** (ícone Package).
- Botão: **+ Adicionar Plano** (primário).

### Bloco: formulário "Adicionar Plano" (quando expandido)
Ordem dos campos (top → down):

1. **Selecionar Plano** * (dropdown; placeholder: "Selecione um plano...").
2. **Valor do Contrato (R$)** * (numérico; placeholder "0,00").
3. **Status** * (select: Ativo | Pausado | Cancelado | Finalizado; padrão Ativo).
4. **Contrato** * (select: Assinado | Não assinado; padrão Não assinado).
5. **Data de Início** * (date).
6. **Data de Fim** (opcional) (date).
7. Botões: **Adicionar** (primário), **Cancelar** (secundário).

### Bloco: lista de planos
- Cada card: nome do plano, **badge Status** (Ativo/Pausado/Cancelado/Finalizado), **badge Contrato** (Assinado / Não assinado), valor, observações (se houver), ações (Histórico, Editar, Excluir).
- Loading: "Carregando planos...".
- Empty: "Nenhum plano contratado" (ícone Package).

---

## Mockup textual – Serviços Avulsos

### Bloco: cabeçalho da seção
- Título: **Serviços Avulsos** (ícone Briefcase).
- Botão: **+ Adicionar Serviço**.

### Bloco: formulário "Adicionar Serviço"
Mesma ordem lógica que Planos:

1. Selecionar Serviço *  
2. Valor do Contrato (R$) *  
3. **Status** * (Ativo | Pausado | Cancelado | Finalizado; padrão Ativo).  
4. **Contrato** * (Assinado | Não assinado; padrão Não assinado).  
5. Data de Início *  
6. Data de Fim (opcional)  
7. Adicionar | Cancelar  

### Lista e estados
- Cards com badge Status e badge Contrato; demais iguais ao atual.
- Loading: "Carregando serviços...". Empty: "Nenhum serviço avulso contratado".

---

## Copy e mensagens

- Labels: **Status**, **Contrato** (não "Contrato assinado" no label do campo; opções do select: "Assinado" e "Não assinado").
- Erro validação: "Preencha todos os campos obrigatórios: plano, valor, status, contrato e data de início" (planos); equivalente para serviços.
- Modal edição: incluir campo **Contrato** (Assinado / Não assinado) junto com Status; manter labels iguais.

---

## Hierarquia visual

- Agrupar em card único por seção (Planos Contratados / Serviços Avulsos).
- Formulário de adicionar dentro do card, com fundo leve (ex.: `bg-gray-50`) e borda para destacar.
- Campos em grid de 2 colunas onde fizer sentido (ex.: Data de Início e Data de Fim na mesma linha); Status e Contrato podem ficar na mesma linha (2 colunas) para economia de espaço e aspecto mais profissional.
