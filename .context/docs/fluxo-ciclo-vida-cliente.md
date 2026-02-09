# Fluxo e ciclo de vida do cliente (Gestão F3F)

Documento de **Verdade do Negócio** para o módulo de Gestão de Clientes. Deve ser validado com o Arthur (ou responsável de produto) antes de implementar features que dependem desses fluxos.

Referência: *Especificação Refatoração F3F (Gestão de Clientes)* — processos Seção 1 (1.1–1.5).

---

## 1.1 Atores

| Ator | Descrição | Papel no sistema |
|------|-----------|-------------------|
| **Arthur (Financeiro)** | Responsável financeiro; permissão “Super Edit” em planos (valor, datas). | Perfil/role com permissão ampla em planos e serviços. |
| **Gestor** | Gerente de conta; pode trocar status e solicitar alterações; não edita valor/datas diretamente. | Perfil com permissão limitada (troca de status, solicitações). |
| **Equipe (Agente/Suporte)** | Operação no dia a dia; visibilidade conforme RLS. | Perfis agente, suporte; acesso por cliente/responsável. |

*Validar com Arthur: outros atores (ex.: Admin geral)?*

---

## 1.2 Entrada (novo cliente)

- Cadastro inicial do cliente (dados cadastrais, responsável, plano/serviço).
- Definição de responsável principal e, se aplicável, comerciais/suporte/backup.
- Registro do primeiro plano ou serviço avulso (valor, data início, data fim).
- *Validar com Arthur: etapas obrigatórias, aprovações, integrações (ex.: contrato/assinatura).*

---

## 1.3 Cancelamento

- Cliente pode ser cancelado; plano/serviço com status “cancelado”.
- Ao registrar **Cancelamento** (tipo de ocorrência), o campo **Motivo/Causa** é obrigatório.
- *Validar com Arthur: quem pode cancelar (só Arthur? Gestor?), se há fluxo de aprovação e se há bloqueio de ações após cancelamento.*

---

## 1.4 Troca de plano

- Cliente pode ter múltiplos planos ao longo do tempo (histórico); **apenas um plano ATIVO** por cliente (regra a confirmar).
- Fluxo de troca: finalizar/encerrar o plano atual (ex.: status finalizado) e criar novo plano (ativo).
- *Validar com Arthur: quem executa a troca (Gestor solicita e Arthur aprova? Ou Gestor só troca status e Arthur edita valor/datas?).*

---

## 1.5 Erros operacionais

- Ocorrências do tipo **Erro Operacional** (e **Outros**) para registrar problemas e follow-up.
- Tipos padronizados: **Cancelamento**, **Erro Operacional**, **Outros** (conforme backlog Fase 3).
- *Validar com Arthur: se há SLA, responsável por tratamento e se há notificações.*

---

## Uso deste documento

- **Consultoria / Analista de Processos**: usar este doc na validação com o Arthur e preencher/ajustar conforme combinado.
- **Implementação**: após validação, as features da Fase 3 (ocorrências, múltiplos planos, permissões Arthur vs Gestor) devem seguir a “Verdade do Negócio” aqui registrada.
- **Índice**: este arquivo está referenciado no [README](./README.md) da documentação.
