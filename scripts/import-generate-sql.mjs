#!/usr/bin/env node
/**
 * Gera migrations de seed (equipe → auth.users + usuarios, clientes) a partir da planilha.
 * Escreve em supabase/migrations/.
 */

import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'
import { fileURLToPath } from 'url'
import XLSX from 'xlsx'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const XLSX_PATH = path.join(ROOT, 'Estrutura', 'AgenciaF3F.xlsx')
const MAPPING_PATH = path.join(ROOT, '.context', 'import-mapping.json')
const MIGRATIONS_DIR = path.join(ROOT, 'supabase', 'migrations')

const DEFAULT_PASSWORD = 'F3f@123trocar'

function uuidFromEmail(email) {
  const h = crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`
}

function escapeSql(s) {
  if (s == null || s === '') return 'NULL'
  return "'" + String(s).replace(/'/g, "''") + "'"
}

function loadMapping() {
  return JSON.parse(fs.readFileSync(MAPPING_PATH, 'utf8'))
}

function main() {
  if (!fs.existsSync(XLSX_PATH)) {
    console.error('Arquivo não encontrado:', XLSX_PATH)
    process.exit(1)
  }

  const mapping = loadMapping()
  const wb = XLSX.readFile(XLSX_PATH, { type: 'file', cellDates: true })

  const eq = mapping.equipe
  const eqSheet = wb.Sheets[eq.sheet]
  const eqRows = XLSX.utils.sheet_to_json(eqSheet, { header: 1, defval: '' })
  const eqHeaders = (eqRows[0] || []).map((h) => (h != null ? String(h).trim() : ''))
  const eqData = []
  for (let i = 1; i < eqRows.length; i++) {
    const r = eqRows[i]
    const o = {}
    eqHeaders.forEach((h, j) => { if (h) o[h] = r[j] != null ? r[j] : '' })
    const nome = (o[eq.nome_completo] ?? '').toString().trim()
    const email = (o[eq.email] ?? '').toString().trim().toLowerCase()
    if (!nome || !email) continue
    const telefone = (o[eq.telefone] ?? '').toString().trim()
    let perfil = (o[eq.perfil] ?? '').toString().trim() || eq.defaultPerfil
    perfil = (eq.perfilMap && eq.perfilMap[perfil]) || eq.defaultPerfil
    let status = (o[eq.status] ?? '').toString().trim() || eq.defaultStatus
    status = (eq.statusMap && eq.statusMap[status]) || eq.defaultStatus
    eqData.push({ nome, email, telefone, perfil, status })
  }

  const nomeToUuid = new Map()
  const equipeIds = []
  const usersSql = []
  usersSql.push('-- Seed equipe: auth.users + public.usuarios')
  usersSql.push('-- Senha inicial: ' + DEFAULT_PASSWORD)
  usersSql.push('CREATE EXTENSION IF NOT EXISTS pgcrypto;')
  usersSql.push('')

  for (const u of eqData) {
    const id = uuidFromEmail(u.email)
    equipeIds.push(id)
    nomeToUuid.set(u.nome.toLowerCase(), id)
    nomeToUuid.set(u.nome, id)
    const meta = JSON.stringify({ provider: 'email', providers: ['email'] })
    const metaUser = JSON.stringify({})
    const ident = JSON.stringify({ sub: id, email: u.email }).replace(/'/g, "''")
    usersSql.push(`-- ${u.email} -> ${u.nome}`)
    usersSql.push(`INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)`)
    usersSql.push(`VALUES ('00000000-0000-0000-0000-000000000000', '${id}', 'authenticated', 'authenticated', ${escapeSql(u.email)}, crypt(${escapeSql(DEFAULT_PASSWORD)}, gen_salt('bf')), NOW(), '${meta}'::jsonb, '${metaUser}'::jsonb, NOW(), NOW())`)
    usersSql.push(`ON CONFLICT (id) DO NOTHING;`)
    usersSql.push(`INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)`)
    usersSql.push(`VALUES ('${id}', '${id}', '${ident}'::jsonb, 'email', '${id}', NOW(), NOW(), NOW())`)
    usersSql.push(`ON CONFLICT (provider, provider_id) DO NOTHING;`)
    usersSql.push(`INSERT INTO public.usuarios (id, email, name, role, perfil, must_reset_password)`)
    usersSql.push(`VALUES ('${id}', ${escapeSql(u.email)}, ${escapeSql(u.nome)}, 'admin', '${u.perfil}', true)`)
    usersSql.push(`ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name, role = 'admin', perfil = EXCLUDED.perfil, updated_at = NOW();`)
    usersSql.push('')
  }

  const defaultResponsavelId = equipeIds[0] || '00000000-0000-0000-0000-000000000000'

  const cl = mapping.clientes
  const clSheet = wb.Sheets[cl.sheet]
  const clRows = XLSX.utils.sheet_to_json(clSheet, { header: 1, defval: '' })
  const clHeaders = (clRows[0] || []).map((h) => (h != null ? String(h).trim() : ''))
  const clientesSql = []
  clientesSql.push('-- Seed clientes (responsavel_id = equipe seed)')
  clientesSql.push('')

  let n = 0
  for (let i = 1; i < clRows.length; i++) {
    const r = clRows[i]
    const row = {}
    clHeaders.forEach((h, j) => { if (h) row[h] = r[j] != null ? r[j] : '' })
    const nome = (row[cl.nome] ?? '').toString().trim()
    if (!nome) continue
    const email = (row[cl.email] ?? '').toString().trim()
    const telefone = (row[cl.telefone] ?? '').toString().trim()
    let status = (row[cl.status] ?? '').toString().trim() || cl.defaultStatus
    status = (cl.statusMap && cl.statusMap[status]) || cl.defaultStatus
    let resp = (row[cl.responsavel] ?? '').toString().trim()
    let rid = nomeToUuid.get(resp) || nomeToUuid.get(resp.toLowerCase()) || defaultResponsavelId
    const partial = [...nomeToUuid.entries()].find(([k]) => k.includes(resp.toLowerCase()) || resp.toLowerCase().includes(k))
    if (partial) rid = partial[1]
    const em = email ? escapeSql(email) : 'NULL'
    const tel = telefone ? escapeSql(telefone) : 'NULL'
    clientesSql.push(`INSERT INTO public.clientes (nome, email, telefone, responsavel_id, status) VALUES (${escapeSql(nome)}, ${em}, ${tel}, '${rid}', '${status}');`)
    n++
  }

  const eqPath = path.join(MIGRATIONS_DIR, '20260129130000_seed_equipe_usuarios.sql')
  const clPath = path.join(MIGRATIONS_DIR, '20260129140000_seed_clientes.sql')
  fs.writeFileSync(eqPath, usersSql.join('\n'), 'utf8')
  fs.writeFileSync(clPath, clientesSql.join('\n'), 'utf8')
  console.log('Gerado:', eqPath)
  console.log('Gerado:', clPath)
  console.log('Equipe:', eqData.length, 'usuários. Clientes:', n, 'linhas.')
}

main()
