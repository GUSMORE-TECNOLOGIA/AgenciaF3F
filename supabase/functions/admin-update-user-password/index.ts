// Edge Function: admin altera senha de qualquer usuário (Auth). Apenas admins.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors() })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'Token ausente' }, 401, cors())
    }
    const token = authHeader.replace('Bearer ', '')

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnon = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseService = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    if (!supabaseUrl || !supabaseAnon || !supabaseService) {
      return json({ error: 'Configuração Supabase incompleta' }, 500, cors())
    }

    const anon = createClient(supabaseUrl, supabaseAnon)
    const { data: { user: caller }, error: userErr } = await anon.auth.getUser(token)
    if (userErr || !caller) {
      return json({ error: 'Token inválido ou expirado' }, 401, cors())
    }

    const admin = createClient(supabaseUrl, supabaseService, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const { data: profile } = await admin.from('usuarios').select('id, role').eq('id', caller.id).single()
    if (!profile || profile.role !== 'admin') {
      return json({ error: 'Apenas administradores podem alterar senha de usuários' }, 403, cors())
    }

    const body = await req.json().catch(() => ({})) as { userId?: string; newPassword?: string }
    const userId = typeof body.userId === 'string' ? body.userId.trim() : ''
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword : ''

    if (!userId || !/^[0-9a-f-]{36}$/i.test(userId)) {
      return json({ error: 'userId inválido' }, 400, cors())
    }
    if (!newPassword || newPassword.length < 8) {
      return json({ error: 'A nova senha deve ter pelo menos 8 caracteres' }, 400, cors())
    }

    const { error: updateErr } = await admin.auth.admin.updateUserById(userId, {
      password: newPassword,
    })

    if (updateErr) {
      return json({ error: updateErr.message }, 400, cors())
    }

    return json({ ok: true }, 200, cors())
  } catch (e) {
    console.error(e)
    return json({ error: (e instanceof Error ? e.message : 'Erro interno') }, 500, cors())
  }
})

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  }
}

function json(obj: object, status: number, h: Record<string, string>) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...h },
  })
}
