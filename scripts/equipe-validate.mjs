#!/usr/bin/env node
/**
 * Valida estado equipe ↔ usuários: equipe_membros, usuarios, auth.
 * Só leitura. .env: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

async function main() {
  const url = process.env.VITE_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    console.error('Defina VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env')
    process.exit(1)
  }

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  console.log('--- Validação Equipe ↔ Usuários ---\n')

  const { data: membros, error: eM } = await supabase
    .from('equipe_membros')
    .select('id, nome_completo, email, user_id')
    .is('deleted_at', null)

  if (eM) {
    console.error('Erro equipe_membros:', eM.message)
    process.exit(1)
  }

  const comEmail = (membros || []).filter((m) => (m.email || '').trim())
  const comUserId = (membros || []).filter((m) => m.user_id)
  const semUserId = comEmail.filter((m) => !m.user_id)

  console.log('Equipe (equipe_membros, não excluídos):')
  console.log('  Total:', (membros || []).length)
  console.log('  Com email:', comEmail.length)
  console.log('  Com user_id (vinculados):', comUserId.length)
  console.log('  Com email e sem user_id:', semUserId.length)
  if (semUserId.length) {
    console.log('  Exemplos sem user_id:', semUserId.slice(0, 5).map((m) => m.email).join(', '))
  }

  const { data: usuarios, error: eU } = await supabase
    .from('usuarios')
    .select('id, email, name, must_reset_password')
  if (eU) {
    console.error('Erro usuarios:', eU.message)
  } else {
    console.log('\nUsuários (public.usuarios):')
    console.log('  Total:', (usuarios || []).length)
    const comReset = (usuarios || []).filter((u) => u.must_reset_password)
    console.log('  Com must_reset_password:', comReset.length)
  }

  const { data: auth } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  const authUsers = auth?.users ?? []
  console.log('\nAuth (auth.users):')
  console.log('  Total:', authUsers.length)

  const idsMembros = new Set((membros || []).map((m) => m.user_id).filter(Boolean))
  const idsUsuarios = new Set((usuarios || []).map((u) => u.id))
  const idsAuth = new Set(authUsers.map((u) => u.id))
  const vinculadosOk = [...idsMembros].every((id) => idsUsuarios.has(id) && idsAuth.has(id))
  console.log('\nConsistência:')
  console.log('  user_ids de equipe existem em usuarios e auth?', vinculadosOk ? 'Sim' : 'Não')

  if (semUserId.length === 0 && comEmail.length > 0) {
    console.log('\nResultado: Todos os membros com email estão vinculados a usuários.')
  } else if (semUserId.length > 0) {
    console.log('\nResultado: Ainda há membros com email sem user_id. Rode: npm run equipe:link-users')
  } else {
    console.log('\nResultado: Nenhum membro com email para vincular.')
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
