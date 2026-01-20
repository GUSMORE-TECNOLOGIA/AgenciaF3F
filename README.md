# Agência F3F - Sistema de Gestão de Clientes

Sistema web para gestão de clientes e serviços da Agência F3F.

## Tecnologias

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Supabase (Backend as a Service)
- React Router DOM

## Funcionalidades

### Módulos Principais

- **Gestão de Clientes**: Cadastro e gerenciamento de clientes com links úteis específicos
- **Serviços**: Gestão de serviços prestados
- **Financeiro**: Controle financeiro e transações
- **Ocorrências**: Sistema de ocorrências e tickets
- **Atendimento**: Gestão de atendimentos ao cliente

### Links Úteis por Cliente

Cada cliente possui um conjunto de links úteis:
- Conta de Anúncio - F3F
- Conta de Anúncio - L.T
- Instagram
- Business Suite
- Dashboard
- Planilha de Dados
- Pasta do Drive
- UTMify
- Wordpress
- Página de Vendas - L.T
- Checkout

## Instalação

1. Instale as dependências:
```bash
npm install
```

2. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais do Supabase.

3. Execute o projeto em desenvolvimento:
```bash
npm run dev
```

## Estrutura do Projeto

```
src/
├── components/     # Componentes reutilizáveis
├── contexts/       # Contextos React (Auth, etc)
├── pages/          # Páginas da aplicação
├── services/       # Serviços (Supabase, APIs)
├── types/          # Definições TypeScript
└── utils/          # Funções utilitárias
```

## Próximos Passos

- [ ] Configurar banco de dados no Supabase
- [ ] Implementar autenticação completa
- [ ] Desenvolver módulo de serviços
- [ ] Desenvolver módulo financeiro
- [ ] Implementar sistema de ocorrências
- [ ] Implementar sistema de atendimento
