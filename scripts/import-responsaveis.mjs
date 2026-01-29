#!/usr/bin/env node
/**
 * Vincula o responsável de cada cliente conforme a coluna "Responsável" da planilha.
 * Clientes e equipe/usuários já devem existir. Matching: cliente por Nome, responsável por nome (usuarios.name).
 * Atualiza clientes.responsavel_id.
 *
 * Requer .env: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 * Uso: node scripts/import-responsaveis.mjs [--dry-run]
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

function norm(s) {
  return (typeof s === 'string' ? s : '').trim().toLowerCase()
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const url = process.env.VITE_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    console.error('Defina VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env')
    process.exit(1)
  }

  if (!fs.existsSync(XLSX_PATH)) {
    console.error('Arquivo não encontrado:', XLSX_PATH)
    process.exit(1)
  }

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

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
  console.log('Clientes carregados:', (clientes || []).length)

  const { data: usuarios, error: uErr } = await supabase
    .from('usuarios')
    .select('id, name')
  if (uErr) {
    console.error('Erro ao buscar usuários:', uErr.message)
    process.exit(1)
  }
  const mapping = loadMapping()
  const responsavelMapping = mapping.clientes?.responsavelMapping || {}
  const userByResponsavel = new Map()
  for (const u of usuarios || []) {
    const name = (u.name || '').trim()
    if (!name) continue
    const n = norm(name)
    userByResponsavel.set(n, u)
    userByResponsavel.set(name, u)
    const alias = responsavelMapping[name] || responsavelMapping[n]
    if (alias) {
      userByResponsavel.set(norm(alias), u)
      userByResponsavel.set(String(alias).trim(), u)
    }
  }
  for (const [k, v] of Object.entries(responsavelMapping)) {
    const u = [...userByResponsavel.values()].find((x) => norm(x.name) === norm(v))
    if (u) {
      userByResponsavel.set(norm(k), u)
      userByResponsavel.set(String(k).trim(), u)
    }
  }
  console.log('Usuários (responsáveis) carregados:', (usuarios || []).length)

  const cfg = mapping.clientes
  const responsavelCol = cfg.responsavel || 'Responsável'
  const wb = XLSX.readFile(XLSX_PATH, { type: 'file', cellDates: true })
  const sh = wb.Sheets[cfg.sheet]
  if (!sh) {
    console.error('Aba não encontrada:', cfg.sheet)
    process.exit(1)
  }

  const rows = XLSX.utils.sheet_to_json(sh, { header: 1, defval: '' })
  const headers = (rows[0] || []).map((h) => (h != null ? String(h).trim() : ''))
  const idxNome = headers.findIndex((h) => h === cfg.nome || norm(h) === 'nome')
  const idxResp = headers.findIndex((h) => h === responsavelCol || /respons[aá]vel/i.test(h))
  if (idxNome < 0) {
    console.error('Coluna Nome não encontrada.')
    process.exit(1)
  }
  if (idxResp < 0) {
    console.error('Coluna Responsável não encontrada. Headers:', headers.filter(Boolean))
    process.exit(1)
  }

  const report = { rows: 0, updated: 0, skippedNoCliente: 0, skippedNoResponsavel: 0, errors: [] }
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i]
    const nome = (r[idxNome] ?? '').toString().trim()
    const responsavelRaw = (r[idxResp] ?? '').toString().trim()
    if (!nome) continue
    report.rows++

    const cliente = clientesByName.get(nome) || clientesByName.get(nome.toLowerCase())
    if (!cliente) {
      report.skippedNoCliente++
      continue
    }
    if (!responsavelRaw) {
      report.skippedNoResponsavel++
      continue
    }

    const user = userByResponsavel.get(responsavelRaw) ||
      userByResponsavel.get(norm(responsavelRaw)) ||
      [...userByResponsavel.entries()].find(([k]) => norm(k) === norm(responsavelRaw))?.[1]
    if (!user) {
      report.errors.push({ linha: i + 2, nome, responsavel: responsavelRaw, message: 'Responsável não encontrado em usuarios' })
      continue
    }

    if (dryRun) {
      report.updated++
      continue
    }

    const { error } = await supabase
      .from('clientes')
      .update({ responsavel_id: user.id, updated_at: new Date().toISOString() })
      .eq('id', cliente.id)
      .is('deleted_at', null)

    if (error) {
      report.errors.push({ linha: i + 2, nome, responsavel: responsavelRaw, message: error.message })
      continue
    }
    report.updated++
    await sleep(50)
  }

  console.log('\n--- Vinculação Responsáveis ---')
  console.log('Linhas processadas:', report.rows)
  console.log('Clientes atualizados (responsavel_id):', report.updated)
  console.log('Sem cliente (nome):', report.skippedNoCliente)
  console.log('Sem responsável na planilha:', report.skippedNoResponsavel)
  console.log('Erros:', report.errors.length)
  if (report.errors.length) {
    report.errors.slice(0, 20).forEach((e) =>
      console.log('  Linha', e.linha, e.nome, '|', e.responsavel, '|', e.message)
    )
  }
  if (dryRun) {
    console.log('\n[--dry-run] Nenhuma alteração feita. Rode sem --dry-run para aplicar.')
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
