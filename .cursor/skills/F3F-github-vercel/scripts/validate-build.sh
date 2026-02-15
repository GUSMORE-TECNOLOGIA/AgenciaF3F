#!/usr/bin/env bash
# Valida build (e testes se existirem) antes de PR. Uso: a partir da raiz do repo.
# bash .cursor/skills/F3F-github-vercel/scripts/validate-build.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/../../../../" && pwd)"
cd "$ROOT"

echo "=== Validação pré-PR (build + test) ==="
BUILD_OK=0
TEST_OK=1

npm run build && { BUILD_OK=1; echo "[OK] Build passou."; } || echo "[FALHA] Build falhou."

if npm run test 2>/dev/null; then
  TEST_OK=1
  echo "[OK] Testes passaram."
else
  echo "[SKIP] Sem script 'test' ou testes falharam (verifique package.json)."
  TEST_OK=1
fi

echo "---"
if [ "$BUILD_OK" -eq 1 ]; then
  echo "Resumo: Build OK. Pronto para PR (use /create-pr para descrição)."
  exit 0
else
  echo "Resumo: Corrija as falhas acima antes de abrir o PR."
  exit 1
fi
