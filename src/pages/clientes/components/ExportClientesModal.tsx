import { useState } from 'react'
import { X, FileSpreadsheet, Loader2 } from 'lucide-react'
import * as XLSX from 'xlsx'
import type { Cliente } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import { fetchClienteLinks } from '@/services/clienteLinks'
import { fetchClienteResponsaveis } from '@/services/cliente-responsaveis'
import { fetchClientePlanos, fetchClienteServicos } from '@/services/planos'
import { fetchTransacoesCliente } from '@/services/financeiro'
import { fetchOcorrencias } from '@/services/ocorrencias'

export type ExportSection =
  | 'dados_pessoais'
  | 'links_uteis'
  | 'responsaveis'
  | 'servicos'
  | 'financeiro'
  | 'ocorrencias'

const SECTIONS: Array<{ id: ExportSection; label: string }> = [
  { id: 'dados_pessoais', label: 'Dados Pessoais (nome, email, telefone, status)' },
  { id: 'links_uteis', label: 'Links Úteis' },
  { id: 'responsaveis', label: 'Responsáveis' },
  { id: 'servicos', label: 'Serviços (planos e serviços avulsos)' },
  { id: 'financeiro', label: 'Financeiro (transações)' },
  { id: 'ocorrencias', label: 'Ocorrências' },
]

interface ExportClientesModalProps {
  open: boolean
  onClose: () => void
  clientes: Cliente[]
  planosAtivos: Map<string, string>
  responsavelPorClienteMap: Map<string, string>
}

export default function ExportClientesModal({
  open,
  onClose,
  clientes,
  planosAtivos,
  responsavelPorClienteMap,
}: ExportClientesModalProps) {
  const { pode } = useAuth()
  const podeFinanceiro = pode('financeiro', 'visualizar')
  const [selected, setSelected] = useState<Set<ExportSection>>(new Set(['dados_pessoais']))
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sectionsToShow = podeFinanceiro ? SECTIONS : SECTIONS.filter((s) => s.id !== 'financeiro')

  function toggle(id: ExportSection) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleExport() {
    if (selected.size === 0 || clientes.length === 0) {
      setError('Selecione pelo menos uma seção e certifique-se de que há clientes para exportar.')
      return
    }
    setError(null)
    setExporting(true)
    try {
      const wb = XLSX.utils.book_new()
      const clientePorId = new Map(clientes.map((c) => [c.id, c]))

      if (selected.has('dados_pessoais')) {
        const rows = clientes.map((c) => ({
          ID: c.id,
          Nome: c.nome,
          Email: c.email ?? '',
          Telefone: c.telefone ?? '',
          Status: c.status,
          Plano_Atual: planosAtivos.get(c.id) ?? '',
          Responsavel: responsavelPorClienteMap.get(c.id) ?? '',
        }))
        const ws = XLSX.utils.json_to_sheet(rows)
        XLSX.utils.book_append_sheet(wb, ws, 'Dados Pessoais')
      }

      if (selected.has('links_uteis')) {
        const allLinks: Array<Record<string, string>> = []
        for (const c of clientes) {
          const links = await fetchClienteLinks(c.id)
          for (const l of links) {
            allLinks.push({
              Cliente_ID: c.id,
              Cliente_Nome: c.nome,
              URL: l.url,
              Tipo: l.tipo,
              Pessoa: l.pessoa ?? '',
              Status: l.status,
            })
          }
        }
        if (allLinks.length > 0) {
          const ws = XLSX.utils.json_to_sheet(allLinks)
          XLSX.utils.book_append_sheet(wb, ws, 'Links')
        }
      }

      if (selected.has('responsaveis')) {
        const allResp: Array<Record<string, string>> = []
        for (const c of clientes) {
          const resp = await fetchClienteResponsaveis(c.id)
          for (const r of resp) {
            allResp.push({
              Cliente_ID: c.id,
              Cliente_Nome: c.nome,
              Responsavel: r.responsavel?.name ?? '',
              Roles: r.roles?.join(', ') ?? '',
              Observacao: r.observacao ?? '',
            })
          }
        }
        if (allResp.length > 0) {
          const ws = XLSX.utils.json_to_sheet(allResp)
          XLSX.utils.book_append_sheet(wb, ws, 'Responsaveis')
        }
      }

      if (selected.has('servicos')) {
        const allPlanos: Array<Record<string, string | number>> = []
        const allServicos: Array<Record<string, string | number>> = []
        for (const c of clientes) {
          const planos = await fetchClientePlanos(c.id)
          for (const p of planos) {
            allPlanos.push({
              Cliente_ID: c.id,
              Cliente_Nome: c.nome,
              Plano: p.plano?.nome ?? '',
              Status: p.status,
              Valor: p.valor ?? 0,
              Data_Inicio: p.data_inicio ?? '',
              Data_Fim: p.data_fim ?? '',
            })
          }
          const servicos = await fetchClienteServicos(c.id)
          for (const s of servicos) {
            allServicos.push({
              Cliente_ID: c.id,
              Cliente_Nome: c.nome,
              Servico: s.servico?.nome ?? '',
              Status: s.status,
              Valor: s.valor ?? 0,
              Data_Inicio: s.data_inicio ?? '',
              Data_Fim: s.data_fim ?? '',
            })
          }
        }
        if (allPlanos.length > 0) {
          const ws = XLSX.utils.json_to_sheet(allPlanos)
          XLSX.utils.book_append_sheet(wb, ws, 'Planos')
        }
        if (allServicos.length > 0) {
          const ws = XLSX.utils.json_to_sheet(allServicos)
          XLSX.utils.book_append_sheet(wb, ws, 'Servicos')
        }
      }

      if (podeFinanceiro && selected.has('financeiro')) {
        const allTrans: Array<Record<string, string | number>> = []
        for (const c of clientes) {
          const trans = await fetchTransacoesCliente(c.id)
          for (const t of trans) {
            allTrans.push({
              Cliente_ID: c.id,
              Cliente_Nome: c.nome,
              Tipo: t.tipo,
              Categoria: t.categoria,
              Valor: t.valor,
              Descricao: t.descricao ?? '',
              Status: t.status,
              Data_Vencimento: t.data_vencimento ?? '',
              Data_Pagamento: t.data_pagamento ?? '',
            })
          }
        }
        if (allTrans.length > 0) {
          const ws = XLSX.utils.json_to_sheet(allTrans)
          XLSX.utils.book_append_sheet(wb, ws, 'Financeiro')
        }
      }

      if (selected.has('ocorrencias')) {
        const ocorrencias = await fetchOcorrencias()
        const ocorrenciasFiltradas = ocorrencias.filter((o) => clientePorId.has(o.cliente_id))
        if (ocorrenciasFiltradas.length > 0) {
          const rows = ocorrenciasFiltradas.map((o) => ({
            Cliente_ID: o.cliente_id,
            Cliente_Nome: clientePorId.get(o.cliente_id)?.nome ?? '',
            Ocorreu_Em: o.ocorreu_em ?? '',
            Notas: o.notas ?? '',
            Prioridade: o.prioridade ?? '',
            Status: o.status ?? '',
          }))
          const ws = XLSX.utils.json_to_sheet(rows)
          XLSX.utils.book_append_sheet(wb, ws, 'Ocorrencias')
        }
      }

      if (wb.SheetNames.length === 0) {
        setError('Nenhum dado encontrado para as seções selecionadas.')
        return
      }

      const filename = `clientes_export_${new Date().toISOString().slice(0, 10)}.xlsx`
      XLSX.writeFile(wb, filename)
      onClose()
    } catch (err) {
      console.error('Erro ao exportar:', err)
      setError(err instanceof Error ? err.message : 'Erro ao exportar. Tente novamente.')
    } finally {
      setExporting(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex-shrink-0 border-b border-border px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-green-600" />
            <h2 className="text-xl font-bold text-foreground">Exportar para Excel</h2>
          </div>
          <button
            onClick={onClose}
            disabled={exporting}
            className="p-2 hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            Exportar <strong>{clientes.length}</strong> cliente(s) filtrado(s). Selecione as informações a incluir:
          </p>

          <div className="space-y-2">
            {sectionsToShow.map((s) => (
              <label
                key={s.id}
                className="flex items-start gap-3 p-3 border border-border rounded-lg hover:bg-muted cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selected.has(s.id)}
                  onChange={() => toggle(s.id)}
                  className="mt-1 w-4 h-4 text-primary rounded border-border focus:ring-primary"
                />
                <span className="text-sm text-foreground">{s.label}</span>
              </label>
            ))}
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg">{error}</p>
          )}
        </div>

        <div className="flex-shrink-0 border-t border-border px-6 py-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={exporting}
            className="px-4 py-2 border border-border rounded-lg hover:bg-muted disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting || selected.size === 0}
            className="px-4 py-2 bg-green-600 dark:bg-green-700 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-800 disabled:opacity-50 inline-flex items-center gap-2"
          >
            {exporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-4 h-4" />
                Exportar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
