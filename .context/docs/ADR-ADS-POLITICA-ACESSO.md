# ADR — Política de acesso do módulo Ads

## Status
Aprovado (2026-04-07)

## Contexto
As migrations do módulo Ads tiveram duas fases:

1. Seed inicial com múltiplos perfis habilitados para `ads`.
2. Restrição temporária para `admin` durante estabilização.

Além disso, o front possui bypass para `user.role === 'admin'` em `AuthContext`, enquanto demais perfis dependem de `perfil_permissoes`.

## Decisão
Definir política **definitiva** nesta fase: módulo `ads` com acesso apenas para perfil `admin`.

## Motivos
- Reduzir superfície de risco enquanto o fluxo OAuth/Meta é endurecido.
- Evitar publicação indevida por perfis operacionais sem trilha de governança concluída.
- Simplificar QA e suporte no ciclo de estabilização.

## Consequências
- Usuários não-admin são redirecionados por `ModuleGuard`.
- Migrations e documentação devem refletir explicitamente a regra para evitar regressão em seeds futuros.
- Reabertura para outros perfis exige nova ADR + migration explícita.
