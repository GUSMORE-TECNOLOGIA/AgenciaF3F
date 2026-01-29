#!/usr/bin/env node
/**
 * Importa equipe via rotina: Auth Admin API (createUser) + upsert em public.usuarios.
 * Usa SUPABASE_SERVICE_ROLE_KEY. Nunca exponha essa chave no front-end.
 *
 * Uso: node scripts/import-equipe-via-admin.mjs [--dry-run]
 * .env: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
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
const DEFAULT_PASSWORD = 'F3f@123trocar'

function loadMapping() {
  return JSON.parse(fs.readFileSync(MAPPING_PATH, 'utf8'))
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const url = process.env.VITE_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url) {
    console.error('Defina VITE_SUPABASE_URL no .env')
    process.exit(1)
  }
  if (!dryRun && !serviceKey) {
    console.error('Defina SUPABASE_SERVICE_ROLE_KEY no .env (Dashboard → Settings → API → service_role)')
    process.exit(1)
  }

  if (!fs.existsSync(XLSX_PATH)) {
    console.error('Arquivo não encontrado:', XLSX_PATH)
    process.exit(1)
  }

  const supabase = dryRun ? null : createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const mapping = loadMapping()
  const eq = mapping.equipe
  const wb = XLSX.readFile(XLSX_PATH, { type: 'file', cellDates: true })
  const sh = wb.Sheets[eq.sheet]
  if (!sh) {
    console.error('Aba não encontrada:', eq.sheet)
    process.exit(1)
  }

  const rows = XLSX.utils.sheet_to_json(sh, { header: 1, defval: '' })
  const headers = (rows[0] || []).map((h) => (h != null ? String(h).trim() : ''))
  const eqData = []
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i]
    const o = {}
    headers.forEach((h, j) => { if (h) o[h] = r[j] != null ? r[j] : '' })
    const nome = (o[eq.nome_completo] ?? '').toString().trim()
    const email = (o[eq.email] ?? '').toString().trim().toLowerCase()
    if (!nome || !email) continue
    let perfil = (o[eq.perfil] ?? '').toString().trim() || eq.defaultPerfil
    perfil = (eq.perfilMap && eq.perfilMap[perfil]) || eq.defaultPerfil
    eqData.push({ nome, email, perfil })
  }

  let emailsSet = new Set()
  let byEmail = new Map()
  if (!dryRun) {
    const { data: existing } = await supabase.from('usuarios').select('id, email')
    emailsSet = new Set((existing || []).map((u) => (u.email || '').toLowerCase()))
    byEmail = new Map((existing || []).map((u) => [(u.email || '').toLowerCase(), u]))
  }

  if (dryRun) {
    console.log('--dry-run: nenhuma alteração será feita.\n')
    console.log('Equipe a processar:', eqData.length)
    eqData.forEach((u) => console.log('  ', u.email, '->', u.nome, u.perfil))
    return
  }

  let created = 0
  let updated = 0
  const errors = []

  for (const u of eqData) {
    try {
      let userId = byEmail.get(u.email)?.id

      if (!userId) {
        const { data: auth, error: authErr } = await supabase.auth.admin.createUser({
          email: u.email,
          password: DEFAULT_PASSWORD,
          email_confirm: true,
          user_metadata: { name: u.nome },
        })
        if (authErr) {
          if (authErr.message && /already registered|already exists/i.test(authErr.message)) {
            const { data: list } = await supabase.auth.admin.listUsers({ perPage: 1000 })
            const found = (list?.users || []).find((x) => (x.email || '').toLowerCase() === u.email)
            userId = found?.id
          }
          if (!userId) {
            errors.push({ email: u.email, message: authErr.message })
            continue
          }
        } else {
          userId = auth?.user?.id
          created++
        }
        await new Promise((r) => setTimeout(r, 300))
      }

      const { error: upsertErr } = await supabase
        .from('usuarios')
        .upsert(
          {
            id: userId,
            email: u.email,
            name: u.nome,
            role: 'admin',
            perfil: u.perfil,
            must_reset_password: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        )

      if (upsertErr) {
        errors.push({ email: u.email, message: upsertErr.message })
        continue
      }
      if (emailsSet.has(u.email.toLowerCase())) updated++
    } catch (e) {
      errors.push({ email: u.email, message: e.message })
    }
  }

  console.log('Equipe importada via rotina (Admin API + usuarios)')
  console.log('Criados (auth):', created, '| Perfis upsert:', eqData.length)
  console.log('Senha inicial:', DEFAULT_PASSWORD)
  if (errors.length) {
    console.log('\nErros:', errors.length)
    errors.slice(0, 10).forEach((e) => console.log('  ', e.email, e.message))
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
