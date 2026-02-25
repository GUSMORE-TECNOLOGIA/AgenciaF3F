import { useEffect, useState } from 'react'
import type { Perfil, PerfilPermissao, ModuloSistema } from '@/types'
import { MODULOS_SISTEMA } from '@/services/perfis'

export interface PerfilFormInput {
  nome: string
  descricao?: string
  permissoes: PerfilPermissao[]
}

interface PerfilPermissoesFormProps {
  initialPerfil?: Perfil | null
  initialPermissoes?: PerfilPermissao[]
  onSubmit: (data: PerfilFormInput) => Promise<void>
  onCancel?: () => void
  loading?: boolean
}

function buildPermissoesVazias(perfilId: string): PerfilPermissao[] {
  return MODULOS_SISTEMA.map((m) => ({
    perfil_id: perfilId,
    modulo: m.value,
    pode_visualizar: false,
    pode_editar: false,
    pode_excluir: false,
  }))
}

function mergePermissoes(
  modulos: { value: ModuloSistema }[],
  existing: PerfilPermissao[],
  perfilId: string
): PerfilPermissao[] {
  return modulos.map((m) => {
    const p = existing.find((x) => x.modulo === m.value)
    return p
      ? { ...p }
      : {
          perfil_id: perfilId,
          modulo: m.value,
          pode_visualizar: false,
          pode_editar: false,
          pode_excluir: false,
        }
  })
}

export default function PerfilPermissoesForm({
  initialPerfil,
  initialPermissoes = [],
  onSubmit,
  onCancel,
  loading,
}: PerfilPermissoesFormProps) {
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [permissoes, setPermissoes] = useState<PerfilPermissao[]>([])

  const perfilId = initialPerfil?.id ?? ''

  useEffect(() => {
    if (initialPerfil) {
      setNome(initialPerfil.nome)
      setDescricao(initialPerfil.descricao ?? '')
    }
    if (initialPerfil && initialPermissoes.length > 0) {
      setPermissoes(
        mergePermissoes(MODULOS_SISTEMA.map((x) => ({ value: x.value })), initialPermissoes, initialPerfil.id)
      )
    } else if (initialPerfil) {
      setPermissoes(buildPermissoesVazias(initialPerfil.id))
    } else {
      setPermissoes(
        MODULOS_SISTEMA.map((m) => ({
          perfil_id: '' as string,
          modulo: m.value,
          pode_visualizar: false,
          pode_editar: false,
          pode_excluir: false,
        }))
      )
    }
  }, [initialPerfil, initialPermissoes])

  const setPermissao = (modulo: ModuloSistema, campo: keyof Pick<PerfilPermissao, 'pode_visualizar' | 'pode_editar' | 'pode_excluir'>, value: boolean) => {
    setPermissoes((prev) =>
      prev.map((p) => (p.modulo === modulo ? { ...p, [campo]: value } : p))
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit({
      nome: nome.trim(),
      descricao: descricao.trim() || undefined,
      permissoes: permissoes.map((p) => ({
        ...p,
        perfil_id: perfilId || (p.perfil_id as string),
      })),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card rounded-lg shadow-sm border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">
          {initialPerfil ? 'Editar perfil' : 'Novo perfil'}
        </h3>
        {onCancel && (
          <button type="button" onClick={onCancel} className="text-muted-foreground hover:text-foreground">
            Cancelar
          </button>
        )}
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Nome do perfil</label>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
            placeholder="Ex: Atendimento"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Descrição (opcional)</label>
          <input
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
            placeholder="Breve descrição do perfil"
          />
        </div>
      </div>

      <div className="mb-6">
        <h4 className="text-sm font-medium text-foreground mb-2">Permissões por módulo</h4>
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted border-b border-border">
                <th className="text-left py-3 px-4 font-medium text-foreground">Módulo</th>
                <th className="text-center py-3 px-4 font-medium text-foreground">Visualizar</th>
                <th className="text-center py-3 px-4 font-medium text-foreground">Editar</th>
                <th className="text-center py-3 px-4 font-medium text-foreground">Excluir</th>
              </tr>
            </thead>
            <tbody>
              {MODULOS_SISTEMA.map((m) => {
                const p = permissoes.find((x) => x.modulo === m.value)
                return (
                  <tr key={m.value} className="border-b border-border hover:bg-muted/50">
                    <td className="py-2 px-4 text-foreground">{m.label}</td>
                    <td className="text-center py-2 px-4">
                      <input
                        type="checkbox"
                        checked={p?.pode_visualizar ?? false}
                        onChange={(e) => setPermissao(m.value, 'pode_visualizar', e.target.checked)}
                        className="rounded border-border text-primary focus:ring-primary"
                      />
                    </td>
                    <td className="text-center py-2 px-4">
                      <input
                        type="checkbox"
                        checked={p?.pode_editar ?? false}
                        onChange={(e) => setPermissao(m.value, 'pode_editar', e.target.checked)}
                        className="rounded border-border text-primary focus:ring-primary"
                      />
                    </td>
                    <td className="text-center py-2 px-4">
                      <input
                        type="checkbox"
                        checked={p?.pode_excluir ?? false}
                        onChange={(e) => setPermissao(m.value, 'pode_excluir', e.target.checked)}
                        className="rounded border-border text-primary focus:ring-primary"
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <button type="button" onClick={onCancel} className="px-4 py-2 border border-border rounded-lg text-foreground hover:bg-muted">
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? 'Salvando...' : initialPerfil ? 'Salvar' : 'Criar perfil'}
        </button>
      </div>
    </form>
  )
}
