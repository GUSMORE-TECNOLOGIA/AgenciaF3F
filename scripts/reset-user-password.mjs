#!/usr/bin/env node
/**
 * Altera a senha de um usuário no Supabase Auth (uso pontual, admin).
 * Requer .env: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 * Uso: RESET_PASSWORD_EMAIL=email@exemplo.com RESET_PASSWORD_NEW=NovaSenha123 node scripts/reset-user-password.mjs
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

async function main() {
  const url = process.env.VITE_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const email = process.env.RESET_PASSWORD_EMAIL
  const newPassword = process.env.RESET_PASSWORD_NEW

  if (!url || !serviceKey) {
    console.error('Defina VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env')
    process.exit(1)
  }
  if (!email || !newPassword) {
    console.error('Defina RESET_PASSWORD_EMAIL e RESET_PASSWORD_NEW (ex.: no .env ou na linha de comando)')
    process.exit(1)
  }

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: list, error: listErr } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  if (listErr) {
    console.error('Erro ao listar usuários:', listErr.message)
    process.exit(1)
  }

  const user = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
  if (!user) {
    console.error('Usuário não encontrado com email:', email)
    process.exit(1)
  }

  const { data: updated, error: updateErr } = await supabase.auth.admin.updateUserById(user.id, {
    password: newPassword,
  })
  if (updateErr) {
    console.error('Erro ao atualizar senha:', updateErr.message)
    process.exit(1)
  }

  console.log('Senha alterada com sucesso para:', email)
}

main()
