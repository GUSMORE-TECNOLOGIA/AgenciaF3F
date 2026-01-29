// Edge Function: cria usuário Auth + usuarios. Senha padrão 123456. Apenas admins.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const DEFAULT_PASSWORD = '123456'

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
      return json({ error: 'Apenas administradores podem criar usuários' }, 403, cors())
    }

    const body = await req.json().catch(() => ({})) as { email?: string; name?: string; perfil?: string }
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const name = typeof body.name === 'string' ? body.name.trim() : email.split('@')[0] || 'Usuário'
    const perfil = ['admin', 'gerente', 'agente', 'suporte'].includes(body.perfil) ? body.perfil : 'agente'

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ error: 'Email inválido' }, 400, cors())
    }

    const { data: authUser, error: createErr } = await admin.auth.admin.createUser({
      email,
      password: DEFAULT_PASSWORD,
      email_confirm: true,
      user_metadata: { name },
    })

    if (createErr) {
      const msg = createErr.message || ''
      if (/already registered|already exists/i.test(msg)) {
        const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 })
        const existing = (list?.users ?? []).find((u) => (u.email ?? '').toLowerCase() === email)
        if (existing) {
          const { error: upsertErr } = await admin.from('usuarios').upsert(
            {
              id: existing.id,
              email: existing.email,
              name,
              role: 'user',
              perfil,
              must_reset_password: true,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
          )
          if (upsertErr) return json({ error: upsertErr.message }, 500, cors())
          return json({ id: existing.id, created: false }, 200, cors())
        }
      }
      return json({ error: createErr.message }, 400, cors())
    }

    const userId = authUser?.user?.id
    if (!userId) return json({ error: 'Falha ao obter id do usuário' }, 500, cors())

    const { error: insertErr } = await admin.from('usuarios').insert({
      id: userId,
      email: authUser.user.email,
      name,
      role: 'user',
      perfil,
      must_reset_password: true,
    })

    if (insertErr) {
      return json({ error: insertErr.message }, 500, cors())
    }

    return json({ id: userId, created: true }, 200, cors())
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
