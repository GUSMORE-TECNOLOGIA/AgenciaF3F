#!/usr/bin/env node
/**
 * Fase 0: Inspeciona Estrutura/AgenciaF3F.xlsx
 * Lista abas, cabeçalhos e amostra de linhas por aba.
 * Grava resultado em .context/import-estrutura.json
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import XLSX from 'xlsx'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const XLSX_PATH = path.join(ROOT, 'Estrutura', 'AgenciaF3F.xlsx')
const OUT_PATH = path.join(ROOT, '.context', 'import-estrutura.json')
const SAMPLE_ROWS = 15

function inspect() {
  if (!fs.existsSync(XLSX_PATH)) {
    console.error('Arquivo não encontrado:', XLSX_PATH)
    process.exit(1)
  }

  const wb = XLSX.readFile(XLSX_PATH, { type: 'file', cellDates: true })
  const sheets = wb.SheetNames
  const result = { sheets, inspectedAt: new Date().toISOString(), abas: {} }

  for (const name of sheets) {
    const sh = wb.Sheets[name]
    const rows = XLSX.utils.sheet_to_json(sh, { header: 1, defval: '' })
    const headers = (rows[0] || []).map((h) => (h != null ? String(h).trim() : ''))
    const dataRows = rows.slice(1, 1 + SAMPLE_ROWS).map((r) => {
      const o = {}
      headers.forEach((h, i) => { o[h] = r[i] != null ? r[i] : '' })
      return o
    })
    result.abas[name] = { headers, sampleRows: dataRows, totalRows: Math.max(0, rows.length - 1) }
  }

  const outDir = path.dirname(OUT_PATH)
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })
  fs.writeFileSync(OUT_PATH, JSON.stringify(result, null, 2), 'utf8')
  console.log('Estrutura gravada em', OUT_PATH)
  console.log('Abas:', sheets.join(', '))
}

inspect()
