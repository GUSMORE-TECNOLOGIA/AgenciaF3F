#!/usr/bin/env node
/**
 * Gera JSON { name, query } para apply_migration do MCP.
 * Uso: node scripts/mcp-apply-args.mjs <arquivo.sql> [arquivo_saida.json]
 * Se arquivo_saida for omitido, imprime em stdout.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

const file = process.argv[2]
const outPath = process.argv[3]
if (!file) {
  console.error('Uso: node scripts/mcp-apply-args.mjs <arquivo.sql> [arquivo_saida.json]')
  process.exit(1)
}
const fp = path.isAbsolute(file) ? file : path.join(ROOT, file)
const raw = fs.readFileSync(fp, 'utf8')
const base = path.basename(fp, '.sql')
const name = base.replace(/^\d+_/, '') // e.g. 20260129130100_seed_equipe_usuarios_remaining -> seed_equipe_usuarios_remaining
const out = { name, query: raw }
const json = JSON.stringify(out)
if (outPath) {
  const outFile = path.isAbsolute(outPath) ? outPath : path.join(ROOT, outPath)
  fs.writeFileSync(outFile, json, 'utf8')
  console.log('Escrito:', outFile)
} else {
  process.stdout.write(json)
}
