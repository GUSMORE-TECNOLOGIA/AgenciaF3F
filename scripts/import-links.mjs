#!/usr/bin/env node
/**
 * Importa links dos clientes via rotina: usa createClienteLink (API) para cada URL da planilha.
 * Requer .env: VITE_SUPABASE_*, IMPORTER_EMAIL, IMPORTER_PASSWORD (admin).
 * Clientes já devem existir; matching por nome.
 *
 * Uso: node scripts/import-links.mjs [--dry-run]
 */

import 'dotenv/config'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import XLSX from 'xlsx'
import { createClient } from '@supabase/supabase-js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const XLSX_PATH = path.join(ROOT, 'Estrutura', 'AgenciaF3F.xlsx')
const MAPPING_PATH = path.join(ROOT, '.context', 'import-mapping.json')

function loadMapping() {
  return JSON.parse(fs.readFileSync(MAPPING_PATH, 'utf8'))
}

function isUrl(s) {
  if (typeof s !== 'string') return false
  const t = s.trim()
  return t.length > 0 && (t.startsWith('http://') || t.startsWith('https://'))
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const url = process.env.VITE_SUPABASE_URL
  const anon = process.env.VITE_SUPABASE_ANON_KEY
  const email = process.env.IMPORTER_EMAIL
  const password = process.env.IMPORTER_PASSWORD

  if (!url || !anon || !email || !password) {
    console.error('Defina VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, IMPORTER_EMAIL e IMPORTER_PASSWORD no .env')
    process.exit(1)
  }

  if (!fs.existsSync(XLSX_PATH)) {
    console.error('Arquivo não encontrado:', XLSX_PATH)
    process.exit(1)
  }

  const supabase = createClient(url, anon)
  const { error: authErr } = await supabase.auth.signInWithPassword({ email, password })
  if (authErr) {
    console.error('Falha ao autenticar:', authErr.message)
    process.exit(1)
  }
  const { data: clientes, error: cErr } = await supabase
    .from('clientes')
    .select('id, nome')
    .is('deleted_at', null)
  if (cErr) {
    console.error('Erro ao buscar clientes:', cErr.message)
    process.exit(1)
  }
  const clientesByName = new Map()
  for (const c of clientes || []) {
    const n = (c.nome || '').trim()
    if (!n) continue
    clientesByName.set(n, c)
    clientesByName.set(n.toLowerCase(), c)
  }
  console.log('Clientes carregados:', clientesByName.size)

  const mapping = loadMapping()
  const cfg = mapping.clientes
  const linkColumns = cfg.linkColumns || []
  if (!linkColumns.length) {
    console.error('Nenhuma coluna de link em import-mapping (clientes.linkColumns).')
    process.exit(1)
  }

  const wb = XLSX.readFile(XLSX_PATH, { type: 'file', cellDates: true })
  const sh = wb.Sheets[cfg.sheet]
  if (!sh) {
    console.error('Aba não encontrada:', cfg.sheet)
    process.exit(1)
  }

  const rows = XLSX.utils.sheet_to_json(sh, { header: 1, defval: '' })
  const headers = (rows[0] || []).map((h) => (h != null ? String(h).trim() : ''))
  const report = { rows: 0, linksCreated: 0, skippedNoCliente: 0, errors: [] }
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i]
    const row = {}
    headers.forEach((h, j) => { if (h) row[h] = r[j] != null ? r[j] : '' })
    const nome = (row[cfg.nome] ?? '').toString().trim()
    if (!nome) continue
    report.rows++

    const cliente = clientesByName.get(nome) || clientesByName.get(nome.toLowerCase())
    if (!cliente) {
      report.skippedNoCliente++
      continue
    }

    for (const col of linkColumns) {
      const raw = row[col]
      if (!isUrl(raw)) continue
      const urlTrim = String(raw).trim()

      if (dryRun) {
        report.linksCreated++
        continue
      }
      const { error } = await supabase.from('cliente_links').insert({
        cliente_id: cliente.id,
        url: urlTrim,
        tipo: col,
        status: 'ativo',
      })

      if (error) {
        report.errors.push({ linha: i + 2, nome, tipo: col, message: error.message })
        continue
      }
      report.linksCreated++
      await sleep(80)
    }
  }

  console.log('\n--- Importação de links (rotina) ---')
  console.log('Linhas processadas:', report.rows)
  console.log('Links criados:', report.linksCreated)
  console.log('Linhas sem cliente (nome):', report.skippedNoCliente)
  console.log('Erros:', report.errors.length)
  if (report.errors.length) {
    report.errors.slice(0, 15).forEach((e) => console.log('  Linha', e.linha, e.nome, e.tipo, '|', e.message))
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
