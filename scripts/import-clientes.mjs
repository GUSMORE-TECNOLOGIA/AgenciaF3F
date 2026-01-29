#!/usr/bin/env node
/**
 * Importação de clientes a partir de Estrutura/AgenciaF3F.xlsx
 * Requer: .env com VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, IMPORTER_EMAIL, IMPORTER_PASSWORD
 */

import 'dotenv/config'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import XLSX from 'xlsx'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const XLSX_PATH = path.join(ROOT, 'Estrutura', 'AgenciaF3F.xlsx')
const MAPPING_PATH = path.join(ROOT, '.context', 'import-mapping.json')

const clienteCreateSchema = z.object({
  nome: z.string().min(2).max(255),
  email: z.string().email().optional().or(z.literal('')),
  telefone: z.string().optional(),
  responsavel_id: z.string().uuid(),
  status: z.enum(['ativo', 'inativo', 'pausado']),
})

function loadMapping() {
  const raw = fs.readFileSync(MAPPING_PATH, 'utf8')
  return JSON.parse(raw)
}

function buildUserLookup(usuarios) {
  const byName = new Map()
  const byEmail = new Map()
  for (const u of usuarios) {
    const n = (u.name || '').trim().toLowerCase()
    const e = (u.email || '').trim().toLowerCase()
    if (n) byName.set(n, u)
    if (e) byEmail.set(e, u)
  }
  return { byName, byEmail, admins: usuarios.filter((u) => u.role === 'admin') }
}

function resolveResponsavel(responsavelStr, lookup, defaultId) {
  const s = (responsavelStr || '').trim()
  if (!s) return defaultId
  const n = s.toLowerCase()
  const byName = lookup.byName.get(n)
  if (byName) return byName.id
  const byEmail = lookup.byEmail.get(n)
  if (byEmail) return byEmail.id
  const partial = [...lookup.byName.keys()].find((k) => k.includes(n) || n.includes(k))
  if (partial) return lookup.byName.get(partial).id
  return defaultId
}

function mapRow(row, cfg, lookup, defaultResponsavelId) {
  const nome = (row[cfg.nome] ?? '').toString().trim()
  const email = (row[cfg.email] ?? '').toString().trim()
  const telefone = (row[cfg.telefone] ?? '').toString().trim()
  let status = (row[cfg.status] ?? '').toString().trim() || cfg.defaultStatus
  status = (cfg.statusMap && cfg.statusMap[status]) || cfg.defaultStatus || 'ativo'
  const responsavel_id = resolveResponsavel(row[cfg.responsavel], lookup, defaultResponsavelId)
  return { nome, email: email || undefined, telefone: telefone || undefined, status, responsavel_id }
}

function isEmptyRow(row, cfg) {
  const n = (row[cfg.nome] ?? '').toString().trim()
  const e = (row[cfg.email] ?? '').toString().trim()
  const t = (row[cfg.telefone] ?? '').toString().trim()
  return !n && !e && !t
}

const DRY_RUN_PLACEHOLDER_UUID = '00000000-0000-0000-0000-000000000000'

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const url = process.env.VITE_SUPABASE_URL
  const anon = process.env.VITE_SUPABASE_ANON_KEY
  const email = process.env.IMPORTER_EMAIL
  const password = process.env.IMPORTER_PASSWORD

  if (!dryRun) {
    if (!url || !anon) {
      console.error('Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env')
      process.exit(1)
    }
    if (!email || !password) {
      console.error('Defina IMPORTER_EMAIL e IMPORTER_PASSWORD no .env (usuário com permissão para criar clientes)')
      process.exit(1)
    }
  }

  if (!fs.existsSync(XLSX_PATH)) {
    console.error('Arquivo não encontrado:', XLSX_PATH)
    process.exit(1)
  }

  let supabase = null
  let lookup = { byName: new Map(), byEmail: new Map(), admins: [] }
  let defaultResponsavelId = DRY_RUN_PLACEHOLDER_UUID

  if (!dryRun) {
    supabase = createClient(url, anon)
    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({ email, password })
    if (authErr) {
      console.error('Falha ao autenticar:', authErr.message)
      process.exit(1)
    }
    const { data: usuarios, error: uErr } = await supabase.from('usuarios').select('id,email,name,role')
    if (uErr) {
      console.error('Erro ao buscar usuários:', uErr.message)
      process.exit(1)
    }
    lookup = buildUserLookup(usuarios || [])
    defaultResponsavelId = lookup.admins[0]?.id || authData.user?.id
    if (!defaultResponsavelId) {
      console.error('Nenhum admin encontrado em usuarios e nenhum user id da sessão.')
      process.exit(1)
    }
  }

  const mapping = loadMapping()
  const cfg = mapping.clientes
  const wb = XLSX.readFile(XLSX_PATH, { type: 'file', cellDates: true })
  const sh = wb.Sheets[cfg.sheet]
  if (!sh) {
    console.error('Aba não encontrada:', cfg.sheet)
    process.exit(1)
  }
  const rows = XLSX.utils.sheet_to_json(sh, { header: 1, defval: '' })
  const headers = (rows[0] || []).map((h) => (h != null ? String(h).trim() : ''))
  const rawRows = rows.slice(1)

  if (dryRun) console.log('Modo --dry-run: nenhum insert será feito.\n')

  const report = { total: 0, created: 0, skippedEmpty: 0, validationErrors: [], apiErrors: [] }

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
  const BATCH = 50

  for (let i = 0; i < rawRows.length; i++) {
    const r = rawRows[i]
    const row = {}
    headers.forEach((h, j) => { if (h) row[h] = r[j] != null ? r[j] : '' })
    report.total++

    if (isEmptyRow(row, cfg)) {
      report.skippedEmpty++
      continue
    }

    const mapped = mapRow(row, cfg, lookup, defaultResponsavelId)
    const parsed = clienteCreateSchema.safeParse(mapped)
    if (!parsed.success) {
      report.validationErrors.push({
        row: i + 2,
        nome: mapped.nome,
        errors: parsed.error.flatten().fieldErrors,
      })
      continue
    }

    const payload = {
      nome: parsed.data.nome,
      email: parsed.data.email || null,
      telefone: parsed.data.telefone || null,
      responsavel_id: parsed.data.responsavel_id,
      status: parsed.data.status,
    }

    if (dryRun) {
      report.created++
      continue
    }
    const { error } = await supabase.from('clientes').insert(payload).select('id').single()
    if (error) {
      report.apiErrors.push({ row: i + 2, nome: mapped.nome, message: error.message })
      continue
    }
    report.created++
    if (report.created % BATCH === 0) {
      process.stdout.write('.')
      await sleep(200)
    }
  }

  console.log('\n--- Relatório ---')
  console.log('Total linhas (excl. cabeçalho):', report.total)
  console.log('Ignoradas (vazias):', report.skippedEmpty)
  console.log('Criadas:', report.created)
  console.log('Erros de validação:', report.validationErrors.length)
  console.log('Erros de API:', report.apiErrors.length)
  if (report.validationErrors.length) {
    console.log('\nPrimeiros erros de validação:')
    report.validationErrors.slice(0, 10).forEach((e) => console.log('  Linha', e.row, e.nome, JSON.stringify(e.errors)))
  }
  if (report.apiErrors.length) {
    console.log('\nPrimeiros erros de API:')
    report.apiErrors.slice(0, 10).forEach((e) => console.log('  Linha', e.row, e.nome, e.message))
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
