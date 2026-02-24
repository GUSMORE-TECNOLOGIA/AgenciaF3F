# Project Rules and Guidelines

## Repository & deployment (mandato)

- **Um projeto por repositório:** Operações Git (commit, push, PR, merge), Vercel (deploy) e Supabase (migrations, MCP) devem ser executadas **somente** no repositório onde você está trabalhando — este é o **AgenciaF3F**. Não executar em workspace de outro projeto (Organizacao10x, PortalUploaders). Ver [.context/docs/PROJECT_INTEGRATIONS.md](.context/docs/PROJECT_INTEGRATIONS.md).
- **Antes de usar MCP Supabase ou alterar banco/deploy:** confira o projeto em [.context/docs/PROJECT_INTEGRATIONS.md](.context/docs/PROJECT_INTEGRATIONS.md) (e `.env`). Use apenas o projeto Supabase/GitHub/Vercel definido para este repositório.
- **Uso como template:** Se este repositório for usado para **outro** projeto ou cliente, substitua em [.context/docs/PROJECT_INTEGRATIONS.md](.context/docs/PROJECT_INTEGRATIONS.md) e em `.env` todos os refs (Supabase, GitHub, Vercel, domínio e chaves) pelos do novo projeto; caso contrário ferramentas e MCP podem apontar para o projeto errado.

## Documentação (índice único)

**Onde buscar:** índice completo dos guias, Core Guides e Document Map em **[.context/docs/README.md](.context/docs/README.md)**. Não duplicar este índice em AGENTS.md ou CONVENTIONS.md.

