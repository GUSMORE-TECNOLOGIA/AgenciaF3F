#!/usr/bin/env bash
# Scaffold completo de um novo módulo F3F: pastas em src/modules/<modulo> + página em src/pages/<modulo>.tsx.
# Uso (a partir da raiz do repo): bash .cursor/skills/F3F-novo-modulo/scripts/create-module-full.sh <modulo>
# Ex.: bash .cursor/skills/F3F-novo-modulo/scripts/create-module-full.sh clientes

set -e
MODULE="$1"
if [ -z "$MODULE" ]; then
  echo "Uso: $0 <modulo>"
  echo "Ex.: $0 clientes"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/../../../../../" && pwd)"
MOD_BASE="$ROOT/src/modules/$MODULE"
PAGES_DIR="$ROOT/src/pages"
PAGE_FILE="$PAGES_DIR/${MODULE}.tsx"

if [ -d "$MOD_BASE" ]; then
  echo "Módulo já existe: $MOD_BASE"
  exit 1
fi

mkdir -p "$MOD_BASE/services" "$MOD_BASE/repositories" "$MOD_BASE/entities" "$MOD_BASE/components" "$MOD_BASE/dtos"
mkdir -p "$PAGES_DIR"

# Título: id com hífens trocados por espaço (ex.: guia-do-aluno -> guia do aluno)
NOME_TITULO=$(echo "$MODULE" | sed 's/-/ /g')

# Página inicial do módulo (Vite + React; React Router)
cat > "$PAGE_FILE" << 'PAGEEOF'
// src/pages/MODULE_PLACEHOLDER.tsx
// Página de entrada do módulo MODULE_PLACEHOLDER. Ajustar layout e conteúdo conforme o módulo.

import { Link } from "react-router-dom";

export default function ModulePage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              ← Início
            </Link>
            <h1 className="text-xl font-bold text-gray-900">TITLE_PLACEHOLDER</h1>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <p className="text-gray-600">Conteúdo do módulo em desenvolvimento.</p>
      </div>
    </main>
  );
}
PAGEEOF

# Substitui placeholders (# como delimitador para permitir espaços no título)
sed "s#MODULE_PLACEHOLDER#$MODULE#g" "$PAGE_FILE" | sed "s#TITLE_PLACEHOLDER#$NOME_TITULO#g" > "${PAGE_FILE}.tmp" && mv "${PAGE_FILE}.tmp" "$PAGE_FILE"

echo "Scaffold criado:"
echo "  - $MOD_BASE/{services,repositories,entities,components,dtos}"
echo "  - $PAGE_FILE"
echo ""
echo "Próximos passos:"
echo "  1. Adicionar rota em App.tsx (React Router) para /$MODULE apontando para esta página."
echo "  2. Adicionar card no dashboard: modulos-por-role (ou equivalente) e componente de card se ícone novo."
echo "  3. Se existir submodulos-por-modulo: adicionar entrada do módulo com sub-itens (ex.: Início)."
echo "  4. Atualizar a tabela 'Módulos criados' no reference.md desta skill."
echo "  5. Seguir o checklist no reference (Supabase, Auth, Documentação, etc.)."
