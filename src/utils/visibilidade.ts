import type { EscopoVisibilidade, User } from '@/types'

export function getEscopoVisibilidade(user: Pick<User, 'role' | 'escopo_visibilidade'> | null | undefined): EscopoVisibilidade {
  if (user?.role === 'admin') return 'todos'
  return user?.escopo_visibilidade ?? 'todos'
}

export function isEscopoResponsavel(user: Pick<User, 'role' | 'escopo_visibilidade'> | null | undefined): boolean {
  return getEscopoVisibilidade(user) === 'responsavel'
}

export function isEscopoNenhum(user: Pick<User, 'role' | 'escopo_visibilidade'> | null | undefined): boolean {
  return getEscopoVisibilidade(user) === 'nenhum'
}
