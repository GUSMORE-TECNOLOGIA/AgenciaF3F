import { Edit, Trash2, KeyRound, Lock, UserPlus } from 'lucide-react'
import { EquipeMembro, Perfil } from '@/types'

function PerfilCell({ membro, perfis }: { membro: EquipeMembro; perfis: Perfil[] }) {
  const perfilIdNorm = membro.perfil_id?.toString().trim()
  const foundById = perfilIdNorm
    ? perfis.find((p) => p.id && perfilIdNorm && p.id.toString().toLowerCase() === perfilIdNorm.toLowerCase())
    : null
  const foundBySlug = membro.perfil
    ? perfis.find((p) => p.slug && p.slug === membro.perfil)
    : null
  const display =
    foundById?.nome ?? foundBySlug?.nome ?? membro.perfil
  return (
    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">{display}</span>
  )
}

interface EquipeMembrosTableProps {
  membros: EquipeMembro[]
  perfis: Perfil[]
  onEdit: (membro: EquipeMembro) => void
  onDelete: (membro: EquipeMembro) => void
  onSendPasswordReset?: (membro: EquipeMembro) => void
  onEditPassword?: (membro: EquipeMembro) => void
  onCreateAccess?: (membro: EquipeMembro) => void
  deletingId?: string | null
  sendingResetEmailId?: string | null
  updatingPasswordId?: string | null
  creatingAccessId?: string | null
}

export default function EquipeMembrosTable({ membros, perfis, onEdit, onDelete, onSendPasswordReset, onEditPassword, onCreateAccess, deletingId, sendingResetEmailId, updatingPasswordId, creatingAccessId }: EquipeMembrosTableProps) {
  if (membros.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center text-gray-600">
        Nenhum membro encontrado
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Perfil</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {membros.map((membro) => (
            <tr key={membro.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{membro.nome_completo}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{membro.email || '-'}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <PerfilCell membro={membro} perfis={perfis} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    membro.status === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {membro.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                <div className="inline-flex items-center gap-3">
                  {onCreateAccess && membro.email && !membro.user_id && (
                    <button
                      onClick={() => onCreateAccess(membro)}
                      className="text-amber-600 hover:text-amber-800 disabled:opacity-50"
                      title="Criar usuário de acesso (senha padrão 123456)"
                      disabled={creatingAccessId === membro.id}
                    >
                      <UserPlus className="w-4 h-4" />
                    </button>
                  )}
                  {onEditPassword && membro.user_id && (
                    <button
                      onClick={() => onEditPassword(membro)}
                      className="text-gray-600 hover:text-primary disabled:opacity-50"
                      title="Editar senha"
                      disabled={updatingPasswordId === membro.id}
                    >
                      <Lock className="w-4 h-4" />
                    </button>
                  )}
                  {onSendPasswordReset && membro.email && (
                    <button
                      onClick={() => onSendPasswordReset(membro)}
                      className="text-gray-600 hover:text-primary disabled:opacity-50"
                      title="Enviar link para redefinir senha"
                      disabled={sendingResetEmailId === membro.id}
                    >
                      <KeyRound className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => onEdit(membro)}
                    className="text-primary hover:text-primary/80"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(membro)}
                    className="text-red-600 hover:text-red-800 disabled:opacity-50"
                    title="Excluir"
                    disabled={deletingId === membro.id}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
