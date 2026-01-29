#!/usr/bin/env node
/**
 * Cria usuários Auth + usuarios para membros em equipe_membros que ainda não têm user_id.
 * Senha padrão 123456; must_reset_password = true.
 * Atualiza equipe_membros.user_id.
 *
 * Uso: node scripts/equipe-membros-to-users.mjs [--dry-run]
 * .env: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const DEFAULT_PASSWORD = '123456'

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const url = process.env.VITE_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url) {
    console.error('Defina VITE_SUPABASE_URL no .env')
    process.exit(1)
  }
  if (!serviceKey) {
    console.error('Defina SUPABASE_SERVICE_ROLE_KEY no .env')
    process.exit(1)
  }

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: membros, error: fetchErr } = await supabase
    .from('equipe_membros')
    .select('id, nome_completo, email, perfil, responsavel_id')
    .is('deleted_at', null)
    .not('email', 'is', null)
    .is('user_id', null)

  if (fetchErr) {
    console.error('Erro ao buscar equipe_membros:', fetchErr.message)
    process.exit(1)
  }

  if (!membros?.length) {
    console.log('Nenhum membro sem user_id e com email encontrado.')
    return
  }

  console.log('Membros a processar:', membros.length)
  if (dryRun) {
    console.log('--dry-run: nenhuma alteração será feita.')
    membros.forEach((m) => console.log('  ', m.email, '->', m.nome_completo))
    return
  }

  let created = 0
  let linked = 0
  const errors = []

  for (const m of membros) {
    const email = (m.email || '').trim().toLowerCase()
    const name = (m.nome_completo || '').trim() || email.split('@')[0] || 'Usuário'
    const perfil = ['admin', 'gerente', 'agente', 'suporte'].includes(m.perfil) ? m.perfil : 'agente'

    if (!email) continue

    try {
      let userId = null
      const { data: auth, error: createErr } = await supabase.auth.admin.createUser({
        email,
        password: DEFAULT_PASSWORD,
        email_confirm: true,
        user_metadata: { name },
      })

      if (createErr) {
        if (/already registered|already exists/i.test(createErr.message || '')) {
          const { data: list } = await supabase.auth.admin.listUsers({ perPage: 1000 })
          const existing = (list?.users ?? []).find((u) => (u.email || '').toLowerCase() === email)
          userId = existing?.id
        }
        if (!userId) {
          errors.push({ email, message: createErr.message })
          continue
        }
      } else {
        userId = auth?.user?.id
        if (userId) created++
      }

      if (!userId) continue

      await supabase.from('usuarios').upsert(
        {
          id: userId,
          email,
          name,
          role: 'user',
          perfil,
          must_reset_password: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )

      const { error: updateErr } = await supabase
        .from('equipe_membros')
        .update({ user_id: userId, updated_at: new Date().toISOString() })
        .eq('id', m.id)

      if (updateErr) {
        errors.push({ email, message: 'equipe_membros update: ' + updateErr.message })
        continue
      }
      linked++
      await new Promise((r) => setTimeout(r, 300))
    } catch (e) {
      errors.push({ email, message: e?.message || String(e) })
    }
  }

  console.log('\n--- Resultado ---')
  console.log('Usuários criados (Auth):', created)
  console.log('Membros vinculados (user_id):', linked)
  console.log('Erros:', errors.length)
  if (errors.length) {
    errors.slice(0, 15).forEach((e) => console.log('  ', e.email, '|', e.message))
  }
  console.log('\nSenha padrão:', DEFAULT_PASSWORD, '- alterar no primeiro login.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
