# Lições aprendidas – AgenciaF3F

Registro de erros de codificação e decisões que o time deve evitar repetir. Consultar ao implementar features semelhantes.

---

## 1. Nunca gravar `null` em campo opcional quando o cliente não envia o valor (2026-02-10)

### O que aconteceu
Na tabela **perfis**, todos os registros ficaram com **slug = NULL**. Isso quebrou:
- a função `is_admin()` (que usa `perfis.slug = 'admin'`);
- a exibição do nome do perfil na lista de membros (fallback por slug retornava vazio → aparecia "agente").

### Causa
No service `updatePerfil` (perfis.ts), o UPDATE incluía:

```ts
slug: input.slug ?? null   // ❌ Se o form não envia slug, grava NULL e apaga o valor existente
```

O formulário de edição de perfil envia apenas `{ nome, descricao }`. Como `slug` não vinha no payload, a cada edição o banco recebia `slug = null` e apagava o slug que já existia.

### Regra de codificação
- **Ao fazer UPDATE em tabela:** não incluir no payload campos opcionais que o cliente **não enviou**. Só atualizar o campo se ele foi explicitamente enviado (ou usar PATCH sem enviar a chave).
- **Evitar:** `campo: input.campo ?? null` quando o campo é opcional e o form pode não mandá-lo — isso sobrescreve dados existentes com null.
- **Fazer:** construir o objeto de update condicionalmente, por exemplo:  
  `if (input.slug !== undefined && input.slug !== null && input.slug !== '') updates.slug = input.slug`

### Proteção adicional (banco)
Para campos críticos do sistema (ex.: slug dos perfis base), considerar trigger no banco que impeça sobrescrever valor existente com null/vazio (ex.: `protect_perfil_slug`).

### Referência
- [troubleshooting-log.md](./troubleshooting-log.md) – entrada 2026-02-10
- [analise-bug-perfil-administrador-lista.md](./analise-bug-perfil-administrador-lista.md)
