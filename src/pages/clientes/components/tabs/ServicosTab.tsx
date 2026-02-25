import { useState, useEffect, useRef } from 'react'
import { Cliente } from '@/types'
import {
  useClienteContratos,
  useClientePlanos,
  useClienteServicos,
  useCreateClienteContrato,
  useCreateClientePlano,
  useCreateClienteServico,
  useDeleteClienteContrato,
  useDeleteClientePlano,
  useDeleteClienteServico,
  usePlanos,
  useServicos,
} from '@/hooks/usePlanos'
import { Plus, Package, Briefcase, Loader2, Edit, CheckCircle2, XCircle, Pause, Clock, Trash2, FileText, ChevronDown, Ban } from 'lucide-react'
import { ClientePlano, ClienteServico, ClienteContrato } from '@/types'
import EditClienteContratoModal from './modals/EditClienteContratoModal'
import EditClientePlanoModal from './modals/EditClientePlanoModal'
import EditClienteServicoModal from './modals/EditClienteServicoModal'
import HistoricoStatusModal from './HistoricoStatusModal'
import { gerarTransacoesContratoPlano, gerarTransacoesContratoServico, countTransacoesAbertoByContrato } from '@/services/financeiro'
import { updateClienteContrato } from '@/services/planos'
import { useModal } from '@/contexts/ModalContext'
import { DATE_MIN, DATE_MAX } from '@/lib/validators/plano-schema'
import InputMoeda from '@/components/ui/InputMoeda'
import { getTodayISO, addMonthsToDate } from '@/lib/dateUtils'

interface ServicosTabProps {
  cliente: Cliente
  onSave?: () => void
}

export default function ServicosTab({ cliente, onSave }: ServicosTabProps) {
  const { clienteContratos, loading: loadingContratos, refetch: refetchContratos } = useClienteContratos(cliente.id)
  const { clientePlanos, loading: loadingPlanos, refetch: refetchPlanos } = useClientePlanos(cliente.id)
  const { clienteServicos, loading: loadingServicos, refetch: refetchServicos } = useClienteServicos(cliente.id)
  const { planos } = usePlanos(true) // Apenas planos ativos
  const { servicos } = useServicos(true) // Apenas serviços ativos
  const { create: createClienteContrato, loading: creatingContrato } = useCreateClienteContrato()
  const { create: createClientePlano, loading: creatingPlano } = useCreateClientePlano()
  const { create: createClienteServico, loading: creatingServico } = useCreateClienteServico()
  const { remove: deleteClienteContrato, loading: deletingContrato } = useDeleteClienteContrato()
  const { remove: deleteClientePlano, loading: deletingPlano } = useDeleteClientePlano()
  const { remove: deleteClienteServico, loading: deletingServico } = useDeleteClienteServico()
  const { confirm, alert } = useModal()

  const [showAddPlano, setShowAddPlano] = useState(false)
  const [showAddServico, setShowAddServico] = useState(false)
  const [selectedPlanoId, setSelectedPlanoId] = useState<string>('')
  const [selectedServicoId, setSelectedServicoId] = useState<string>('')
  const [valorPlano, setValorPlano] = useState<number | ''>('')
  const [valorServico, setValorServico] = useState<number | ''>('')
  const [statusPlano, setStatusPlano] = useState<'ativo' | 'pausado' | 'cancelado' | 'finalizado'>('ativo')
  const [statusServico, setStatusServico] = useState<'ativo' | 'pausado' | 'cancelado' | 'finalizado'>('ativo')
  const [dataInicioPlano, setDataInicioPlano] = useState<string>('')
  const [dataFimPlano, setDataFimPlano] = useState<string>('')
  const [dataInicioServico, setDataInicioServico] = useState<string>('')
  const [dataFimServico, setDataFimServico] = useState<string>('')
  const [editingPlano, setEditingPlano] = useState<ClientePlano | null>(null)
  const [editingServico, setEditingServico] = useState<ClienteServico | null>(null)
  const [historicoPlano, setHistoricoPlano] = useState<ClientePlano | null>(null)
  const [historicoServico, setHistoricoServico] = useState<ClienteServico | null>(null)
  const [showAddContrato, setShowAddContrato] = useState(false)
  const [editingContrato, setEditingContrato] = useState<ClienteContrato | null>(null)
  const [nomeContrato, setNomeContrato] = useState('')
  const [statusContrato, setStatusContrato] = useState<'ativo' | 'pausado' | 'cancelado' | 'finalizado'>('ativo')
  const [contratoAssinadoContrato, setContratoAssinadoContrato] = useState<'assinado' | 'nao_assinado' | 'cancelado'>('nao_assinado')
  const [dataInicioContrato, setDataInicioContrato] = useState('')
  const [dataFimContrato, setDataFimContrato] = useState('')
  const [dataAssinaturaContrato, setDataAssinaturaContrato] = useState('')
  const [dataCancelamentoContrato, setDataCancelamentoContrato] = useState('')
  const [observacoesContrato, setObservacoesContrato] = useState('')
  const [contratoIdPlano, setContratoIdPlano] = useState('')
  const [contratoIdServico, setContratoIdServico] = useState('')
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [cancellingContrato, setCancellingContrato] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close dropdown menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null)
      }
    }
    if (openMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [openMenu])

  // Auto-fill plan dates when both plan and contract are selected
  useEffect(() => {
    if (selectedPlanoId && contratoIdPlano) {
      const contrato = clienteContratos.find((c) => c.id === contratoIdPlano)
      const plano = planos.find((p) => p.id === selectedPlanoId)
      if (contrato && plano) {
        const inicio = contrato.data_inicio || getTodayISO()
        setDataInicioPlano(inicio)
        if (plano.recorrencia_meses) {
          setDataFimPlano(addMonthsToDate(inicio, plano.recorrencia_meses))
        }
      }
    }
  }, [selectedPlanoId, contratoIdPlano, clienteContratos, planos])

  const handleCancelContrato = async (c: ClienteContrato) => {
    const planosVinculados = clientePlanos.filter((p) => p.contrato_id === c.id)
    const servicosVinculados = clienteServicos.filter((s) => s.contrato_id === c.id)
    let totalLancamentos = 0
    for (const p of planosVinculados) {
      totalLancamentos += await countTransacoesAbertoByContrato(p.id, 'plano')
    }
    for (const s of servicosVinculados) {
      totalLancamentos += await countTransacoesAbertoByContrato(s.id, 'servico')
    }
    const temVinculados = planosVinculados.length > 0 || servicosVinculados.length > 0
    let cascata = false
    if (temVinculados) {
      const partes: string[] = []
      if (planosVinculados.length > 0) partes.push(`${planosVinculados.length} plano(s)`)
      if (servicosVinculados.length > 0) partes.push(`${servicosVinculados.length} serviço(s)`)
      if (totalLancamentos > 0) partes.push(`${totalLancamentos} lançamento(s) em aberto`)
      cascata = await confirm({
        title: 'Cancelar contrato',
        message: `O contrato "${c.nome || 'Sem nome'}" possui: ${partes.join(', ')}.\n\nDeseja cancelar também os planos, serviços e lançamentos em cascata?`,
        confirmLabel: 'Sim, cancelar tudo em cascata',
        cancelLabel: 'Não, apenas o contrato',
        variant: 'danger',
      })
    } else {
      const ok = await confirm({
        title: 'Cancelar contrato',
        message: `Deseja cancelar o contrato "${c.nome || 'Sem nome'}"?\n\nA data de cancelamento será preenchida com a data de hoje.`,
        confirmLabel: 'Cancelar contrato',
        variant: 'danger',
      })
      if (!ok) return
    }
    try {
      setCancellingContrato(true)
      await updateClienteContrato(c.id, {
        contrato_assinado: 'cancelado',
        data_cancelamento: getTodayISO(),
      })
      if (cascata) {
        for (const p of planosVinculados) {
          await deleteClientePlano(p.id, true)
        }
        for (const s of servicosVinculados) {
          await deleteClienteServico(s.id, true)
        }
        await refetchPlanos()
        await refetchServicos()
      }
      await refetchContratos()
      if (onSave) onSave()
    } catch (error) {
      console.error('Erro ao cancelar contrato:', error)
      await alert({
        title: 'Erro',
        message: 'Erro ao cancelar contrato. Tente novamente.',
        variant: 'danger',
      })
    } finally {
      setCancellingContrato(false)
    }
  }

  const handleAddPlano = async () => {
    if (!selectedPlanoId || (valorPlano !== 0 && !valorPlano) || !dataInicioPlano) {
      await alert({
        title: 'Campos obrigatórios',
        message: 'Preencha todos os campos obrigatórios: plano, valor, status, contrato e data de início.',
        variant: 'warning',
      })
      return
    }

    const planoSelecionado = planos.find((p) => p.id === selectedPlanoId)
    if (!planoSelecionado) return

    try {
      // Check if we need to update the contract's data_fim
      let shouldUpdateContractDataFim = false
      if (contratoIdPlano && dataFimPlano) {
        const contratoVinculado = clienteContratos.find((c) => c.id === contratoIdPlano)
        if (contratoVinculado) {
          if (contratoVinculado.data_fim) {
            // Contract already has data_fim - ask user
            shouldUpdateContractDataFim = await confirm({
              title: 'Atualizar data do contrato',
              message: `O contrato "${contratoVinculado.nome || 'Sem nome'}" já possui data de fim (${contratoVinculado.data_fim}).\n\nDeseja atualizar a data de fim do contrato para ${dataFimPlano}?`,
              confirmLabel: 'Atualizar',
            })
          } else {
            // Contract doesn't have data_fim - auto-update
            shouldUpdateContractDataFim = true
          }
        }
      }

      const contrato = await createClientePlano({
        cliente_id: cliente.id,
        plano_id: selectedPlanoId,
        contrato_id: contratoIdPlano || undefined,
        valor: Number(valorPlano) || 0,
        moeda: 'BRL',
        status: statusPlano,
        contrato_assinado: 'nao_assinado',
        data_inicio: dataInicioPlano,
        data_fim: dataFimPlano || undefined,
      })

      // Update contract data_fim if needed
      if (shouldUpdateContractDataFim && contratoIdPlano && dataFimPlano) {
        try {
          await updateClienteContrato(contratoIdPlano, { data_fim: dataFimPlano })
        } catch (err) {
          console.error('Erro ao atualizar data fim do contrato:', err)
        }
      }

      // Gerar parcelas automaticamente baseado nas datas
      try {
        await gerarTransacoesContratoPlano({
          ...contrato,
          plano: planoSelecionado,
        })
      } catch (transacaoError) {
        console.error('Erro ao gerar parcelas:', transacaoError)
        await alert({
          title: 'Atenção',
          message: 'Contrato criado, mas houve erro ao gerar parcelas. Verifique o console.',
          variant: 'warning',
        })
      }

      await refetchPlanos()
      await refetchContratos()
      if (onSave) onSave()
      setShowAddPlano(false)
      setSelectedPlanoId('')
      setValorPlano('')
      setStatusPlano('ativo')
      setContratoIdPlano('')
      setDataInicioPlano('')
      setDataFimPlano('')
    } catch (error) {
      console.error('Erro ao adicionar plano:', error)
      await alert({
        title: 'Erro',
        message: 'Erro ao adicionar plano. Tente novamente.',
        variant: 'danger',
      })
    }
  }

  const handleAddServico = async () => {
    if (!selectedServicoId || (valorServico !== 0 && !valorServico) || !dataInicioServico) {
      await alert({
        title: 'Campos obrigatórios',
        message: 'Preencha todos os campos obrigatórios: serviço, valor, status, contrato e data de início.',
        variant: 'warning',
      })
      return
    }

    const servicoSelecionado = servicos.find((s) => s.id === selectedServicoId)
    if (!servicoSelecionado) return

    try {
      const contrato = await       createClienteServico({
        cliente_id: cliente.id,
        servico_id: selectedServicoId,
        contrato_id: contratoIdServico || undefined,
        valor: Number(valorServico) || 0,
        moeda: 'BRL',
        status: statusServico,
        contrato_assinado: 'nao_assinado',
        data_inicio: dataInicioServico,
        data_fim: dataFimServico || undefined,
      })

      // Gerar parcelas automaticamente baseado nas datas
      try {
        await gerarTransacoesContratoServico({
          ...contrato,
          servico: servicoSelecionado,
        })
      } catch (transacaoError) {
        console.error('Erro ao gerar parcelas:', transacaoError)
        await alert({
          title: 'Atenção',
          message: 'Contrato criado, mas houve erro ao gerar parcelas. Verifique o console.',
          variant: 'warning',
        })
      }

      await refetchServicos()
      if (onSave) onSave()
      setShowAddServico(false)
      setSelectedServicoId('')
      setValorServico('')
      setStatusServico('ativo')
      setContratoIdServico('')
      setDataInicioServico('')
      setDataFimServico('')
    } catch (error) {
      console.error('Erro ao adicionar serviço:', error)
      await alert({
        title: 'Erro',
        message: 'Erro ao adicionar serviço. Tente novamente.',
        variant: 'danger',
      })
    }
  }

  const handleDeletePlanoContrato = async (contrato: ClientePlano) => {
    const qtdLancamentos = await countTransacoesAbertoByContrato(contrato.id, 'plano')
    const nomePlano = contrato.plano?.nome || 'Plano'

    if (qtdLancamentos > 0) {
      const okCancelar = await confirm({
        title: 'Excluir plano',
        message: `O plano "${nomePlano}" possui ${qtdLancamentos} lançamento(s) financeiro(s) em aberto.\n\nDeseja excluir o plano e cancelar esses lançamentos?`,
        confirmLabel: 'Sim, excluir e cancelar lançamentos',
        cancelLabel: 'Não',
        variant: 'danger',
      })
      if (okCancelar) {
        try {
          await deleteClientePlano(contrato.id, true)
          await refetchPlanos()
          if (onSave) onSave()
        } catch (error) {
          console.error('Erro ao excluir contrato de plano:', error)
          await alert({ title: 'Erro', message: 'Erro ao excluir contrato de plano. Tente novamente.', variant: 'danger' })
        }
        return
      }
      const okApenas = await confirm({
        title: 'Excluir apenas o plano',
        message: `Excluir apenas o plano "${nomePlano}"?\n\nOs ${qtdLancamentos} lançamento(s) em aberto permanecerão no financeiro (você pode cancelá-los depois).`,
        confirmLabel: 'Excluir apenas o plano',
        variant: 'danger',
      })
      if (!okApenas) return
      try {
        await deleteClientePlano(contrato.id, false)
        await refetchPlanos()
        if (onSave) onSave()
      } catch (error) {
        console.error('Erro ao excluir contrato de plano:', error)
        await alert({ title: 'Erro', message: 'Erro ao excluir contrato de plano. Tente novamente.', variant: 'danger' })
      }
      return
    }

    const ok = await confirm({
      title: 'Excluir contrato',
      message: `Deseja realmente excluir este plano contratado?\n\n${nomePlano}\n\nEsta ação é irreversível.`,
      confirmLabel: 'Excluir',
      variant: 'danger',
    })
    if (!ok) return
    try {
      await deleteClientePlano(contrato.id, true)
      await refetchPlanos()
      if (onSave) onSave()
    } catch (error) {
      console.error('Erro ao excluir contrato de plano:', error)
      await alert({
        title: 'Erro',
        message: 'Erro ao excluir contrato de plano. Tente novamente.',
        variant: 'danger',
      })
    }
  }

  const handleDeleteServicoContrato = async (contrato: ClienteServico) => {
    const qtdLancamentos = await countTransacoesAbertoByContrato(contrato.id, 'servico')
    const nomeServico = contrato.servico?.nome || 'Serviço'

    if (qtdLancamentos > 0) {
      const okCancelar = await confirm({
        title: 'Excluir serviço',
        message: `O serviço "${nomeServico}" possui ${qtdLancamentos} lançamento(s) financeiro(s) em aberto.\n\nDeseja excluir o serviço e cancelar esses lançamentos?`,
        confirmLabel: 'Sim, excluir e cancelar lançamentos',
        cancelLabel: 'Não',
        variant: 'danger',
      })
      if (okCancelar) {
        try {
          await deleteClienteServico(contrato.id, true)
          await refetchServicos()
          if (onSave) onSave()
        } catch (error) {
          console.error('Erro ao excluir contrato de serviço:', error)
          await alert({ title: 'Erro', message: 'Erro ao excluir contrato de serviço. Tente novamente.', variant: 'danger' })
        }
        return
      }
      const okApenas = await confirm({
        title: 'Excluir apenas o serviço',
        message: `Excluir apenas o serviço "${nomeServico}"?\n\nOs ${qtdLancamentos} lançamento(s) em aberto permanecerão no financeiro (você pode cancelá-los depois).`,
        confirmLabel: 'Excluir apenas o serviço',
        variant: 'danger',
      })
      if (!okApenas) return
      try {
        await deleteClienteServico(contrato.id, false)
        await refetchServicos()
        if (onSave) onSave()
      } catch (error) {
        console.error('Erro ao excluir contrato de serviço:', error)
        await alert({ title: 'Erro', message: 'Erro ao excluir contrato de serviço. Tente novamente.', variant: 'danger' })
      }
      return
    }

    const ok = await confirm({
      title: 'Excluir contrato',
      message: `Deseja realmente excluir este serviço contratado?\n\n${nomeServico}\n\nEsta ação é irreversível.`,
      confirmLabel: 'Excluir',
      variant: 'danger',
    })
    if (!ok) return
    try {
      await deleteClienteServico(contrato.id, true)
      await refetchServicos()
      if (onSave) onSave()
    } catch (error) {
      console.error('Erro ao excluir contrato de serviço:', error)
      await alert({
        title: 'Erro',
        message: 'Erro ao excluir contrato de serviço. Tente novamente.',
        variant: 'danger',
      })
    }
  }

  const handleAddContrato = async () => {
    try {
      await createClienteContrato({
        cliente_id: cliente.id,
        nome: nomeContrato || undefined,
        status: statusContrato,
        contrato_assinado: contratoAssinadoContrato,
        data_inicio: dataInicioContrato || undefined,
        data_fim: dataFimContrato || undefined,
        data_assinatura: dataAssinaturaContrato || undefined,
        data_cancelamento: dataCancelamentoContrato || undefined,
        observacoes: observacoesContrato || undefined,
      })
      await refetchContratos()
      if (onSave) onSave()
      setShowAddContrato(false)
      setNomeContrato('')
      setStatusContrato('ativo')
      setContratoAssinadoContrato('nao_assinado')
      setDataInicioContrato('')
      setDataFimContrato('')
      setDataAssinaturaContrato('')
      setDataCancelamentoContrato('')
      setObservacoesContrato('')
    } catch (error) {
      console.error('Erro ao adicionar contrato:', error)
      await alert({
        title: 'Erro',
        message: 'Erro ao adicionar contrato. Tente novamente.',
        variant: 'danger',
      })
    }
  }

  const handleDeleteContrato = async (c: ClienteContrato) => {
    const planosVinculados = clientePlanos.filter((p) => p.contrato_id === c.id)
    const servicosVinculados = clienteServicos.filter((s) => s.contrato_id === c.id)
    const numPlanos = planosVinculados.length
    const numServicos = servicosVinculados.length
    let totalLancamentos = 0
    for (const p of planosVinculados) {
      totalLancamentos += await countTransacoesAbertoByContrato(p.id, 'plano')
    }
    for (const s of servicosVinculados) {
      totalLancamentos += await countTransacoesAbertoByContrato(s.id, 'servico')
    }

    const temVinculados = numPlanos > 0 || numServicos > 0
    if (temVinculados) {
      const partes: string[] = []
      if (numPlanos > 0) partes.push(`${numPlanos} plano(s)`)
      if (numServicos > 0) partes.push(`${numServicos} serviço(s)`)
      if (totalLancamentos > 0) partes.push(`${totalLancamentos} lançamento(s) em aberto`)
      const okCascata = await confirm({
        title: 'Excluir contrato',
        message: `O contrato "${c.nome || 'Sem nome'}" possui: ${partes.join(', ')}.\n\nDeseja excluir em cascata (excluir planos, serviços e cancelar lançamentos)?`,
        confirmLabel: 'Sim, excluir tudo em cascata',
        cancelLabel: 'Não',
        variant: 'danger',
      })
      if (okCascata) {
        try {
          await deleteClienteContrato(c.id, true)
          await refetchContratos()
          await refetchPlanos()
          await refetchServicos()
          if (onSave) onSave()
        } catch (error) {
          console.error('Erro ao excluir contrato:', error)
          await alert({ title: 'Erro', message: 'Erro ao excluir contrato. Tente novamente.', variant: 'danger' })
        }
        return
      }
      const okApenas = await confirm({
        title: 'Excluir apenas o contrato',
        message: `Excluir apenas o contrato "${c.nome || 'Sem nome'}"?\n\nOs ${numPlanos} plano(s) e ${numServicos} serviço(s) vinculados ficarão sem contrato.`,
        confirmLabel: 'Excluir apenas o contrato',
        variant: 'danger',
      })
      if (!okApenas) return
    } else {
      const ok = await confirm({
        title: 'Excluir contrato',
        message: `Deseja realmente excluir o contrato "${c.nome || 'Sem nome'}"?`,
        confirmLabel: 'Excluir',
        variant: 'danger',
      })
      if (!ok) return
    }
    try {
      await deleteClienteContrato(c.id, false)
      await refetchContratos()
      if (onSave) onSave()
    } catch (error) {
      console.error('Erro ao excluir contrato:', error)
      await alert({
        title: 'Erro',
        message: 'Erro ao excluir contrato. Tente novamente.',
        variant: 'danger',
      })
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ativo: { bg: 'bg-green-100 dark:bg-green-900/40', text: 'text-green-800 dark:text-green-300', icon: CheckCircle2 },
      pausado: { bg: 'bg-yellow-100 dark:bg-yellow-900/40', text: 'text-yellow-800 dark:text-yellow-300', icon: Pause },
      cancelado: { bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-800 dark:text-red-300', icon: XCircle },
      finalizado: { bg: 'bg-muted', text: 'text-foreground', icon: CheckCircle2 },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.ativo
    const Icon = config.icon

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon className="w-3 h-3" />
        {status}
      </span>
    )
  }

  const getContratoBadge = (contrato: 'assinado' | 'nao_assinado' | 'cancelado') => {
    const configs = {
      assinado: { label: 'Assinado', className: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300' },
      nao_assinado: { label: 'Não assinado', className: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300' },
      cancelado: { label: 'Cancelado', className: 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300' },
    }
    const c = configs[contrato] ?? configs.nao_assinado
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${c.className}`}>
        {c.label}
      </span>
    )
  }

  const loading = loadingPlanos || loadingServicos || loadingContratos

  return (
    <div className="space-y-6">
      {/* Contratos */}
      <div className="bg-card rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow">
        <div className="border-b border-border px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Contratos
          </h2>
          <div className="relative" ref={openMenu === 'contratos' ? menuRef : undefined}>
            <button
              onClick={() => setOpenMenu(openMenu === 'contratos' ? null : 'contratos')}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Processos
              <ChevronDown className="w-4 h-4" />
            </button>
            {openMenu === 'contratos' && (
              <div className="absolute right-0 top-full mt-1 w-52 bg-card border border-border rounded-lg shadow-lg z-20 py-1">
                <button
                  onClick={() => {
                    setShowAddContrato(true)
                    setDataInicioContrato(getTodayISO())
                    setOpenMenu(null)
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Contrato
                </button>
                <button
                  disabled
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground cursor-not-allowed"
                  title="Utilize o botão no card do contrato"
                >
                  <Ban className="w-4 h-4" />
                  Cancelar Contrato
                </button>
                <button
                  disabled
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground cursor-not-allowed"
                  title="Utilize o botão no card do contrato"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir Contrato
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="p-6">
          {showAddContrato && (
            <div className="mb-6 p-4 bg-muted rounded-lg border border-border">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Nome / Identificador (opcional)</label>
                  <input
                    type="text"
                    value={nomeContrato}
                    onChange={(e) => setNomeContrato(e.target.value)}
                    className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    placeholder="Ex.: Contrato 2025-01"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Status</label>
                    <select
                      value={statusContrato}
                      onChange={(e) => setStatusContrato(e.target.value as 'ativo' | 'pausado' | 'cancelado' | 'finalizado')}
                      className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    >
                      <option value="ativo">Ativo</option>
                      <option value="pausado">Pausado</option>
                      <option value="cancelado">Cancelado</option>
                      <option value="finalizado">Finalizado</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Contrato</label>
                    <select
                      value={contratoAssinadoContrato}
                      onChange={(e) => {
                        const val = e.target.value as 'assinado' | 'nao_assinado' | 'cancelado'
                        setContratoAssinadoContrato(val)
                        if (val === 'assinado') {
                          setDataAssinaturaContrato(getTodayISO())
                        }
                      }}
                      className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    >
                      <option value="nao_assinado">Não assinado</option>
                      <option value="assinado">Assinado</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Data de Início (opcional)</label>
                    <input
                      type="date"
                      value={dataInicioContrato}
                      onChange={(e) => setDataInicioContrato(e.target.value)}
                      min={DATE_MIN}
                      max={DATE_MAX}
                      className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Data de Fim (opcional)</label>
                    <input
                      type="date"
                      value={dataFimContrato}
                      onChange={(e) => setDataFimContrato(e.target.value)}
                      min={dataInicioContrato || DATE_MIN}
                      max={DATE_MAX}
                      className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Data de Assinatura (opcional)</label>
                    <input
                      type="date"
                      value={dataAssinaturaContrato}
                      onChange={(e) => setDataAssinaturaContrato(e.target.value)}
                      min={DATE_MIN}
                      max={DATE_MAX}
                      className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Data de Cancelamento (opcional)</label>
                    <input
                      type="date"
                      value={dataCancelamentoContrato}
                      onChange={(e) => setDataCancelamentoContrato(e.target.value)}
                      min={DATE_MIN}
                      max={DATE_MAX}
                      className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleAddContrato}
                    disabled={creatingContrato}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {creatingContrato && <Loader2 className="w-4 h-4 animate-spin" />}
                    Adicionar
                  </button>
                  <button
                    onClick={() => {
                      setShowAddContrato(false)
                      setNomeContrato('')
                      setStatusContrato('ativo')
                      setContratoAssinadoContrato('nao_assinado')
                      setDataInicioContrato('')
                      setDataFimContrato('')
                      setDataAssinaturaContrato('')
                      setDataCancelamentoContrato('')
                      setObservacoesContrato('')
                    }}
                    className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}
          {loadingContratos ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : clienteContratos.length === 0 ? (
            <p className="text-muted-foreground text-center py-6">Nenhum contrato cadastrado. Adicione um contrato para agrupar planos e serviços.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {clienteContratos.map((c) => (
                <div
                  key={c.id}
                  className="p-4 rounded-lg border border-border bg-muted/50 hover:bg-muted transition-colors flex flex-col"
                >
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <div className="font-medium text-foreground">{c.nome || 'Contrato (sem nome)'}</div>
                    {getStatusBadge(c.status)}
                    {getContratoBadge(c.contrato_assinado)}
                  </div>
                  {(c.data_inicio || c.data_fim || c.data_assinatura || c.data_cancelamento) && (
                    <div className="text-sm text-muted-foreground mb-2 space-y-0.5">
                      {c.data_inicio && <div>Início: {c.data_inicio}</div>}
                      {c.data_fim && <div>Fim: {c.data_fim}</div>}
                      {c.data_assinatura && <div>Assinatura: {c.data_assinatura}</div>}
                      {c.data_cancelamento && <div>Cancelamento: {c.data_cancelamento}</div>}
                    </div>
                  )}
                  <div className="mt-auto flex items-center gap-2 pt-2 flex-wrap">
                    <button
                      onClick={() => setEditingContrato(c)}
                      className="flex items-center gap-1 px-2 py-1 text-sm text-primary hover:bg-primary/10 rounded transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      Editar
                    </button>
                    {c.contrato_assinado !== 'cancelado' && (
                      <button
                        onClick={() => handleCancelContrato(c)}
                        disabled={cancellingContrato}
                        className="flex items-center gap-1 px-2 py-1 text-sm text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/30 rounded transition-colors disabled:opacity-50"
                      >
                        <Ban className="w-4 h-4" />
                        Cancelar
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteContrato(c)}
                      disabled={deletingContrato}
                      className="flex items-center gap-1 px-2 py-1 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Planos Contratados */}
      <div className="bg-card rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow">
        <div className="border-b border-border px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Planos Contratados
          </h2>
          <div className="relative" ref={openMenu === 'planos' ? menuRef : undefined}>
            <button
              onClick={() => setOpenMenu(openMenu === 'planos' ? null : 'planos')}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Processos
              <ChevronDown className="w-4 h-4" />
            </button>
            {openMenu === 'planos' && (
              <div className="absolute right-0 top-full mt-1 w-52 bg-card border border-border rounded-lg shadow-lg z-20 py-1">
                <button
                  onClick={() => {
                    setShowAddPlano(true)
                    setOpenMenu(null)
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Plano
                </button>
                <button
                  disabled
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground cursor-not-allowed"
                  title="Em breve"
                >
                  <Package className="w-4 h-4" />
                  Transferir Plano
                </button>
                <button
                  disabled
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground cursor-not-allowed"
                  title="Em breve"
                >
                  <Ban className="w-4 h-4" />
                  Cancelar Plano
                </button>
                <button
                  disabled
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground cursor-not-allowed"
                  title="Utilize o botão no card do plano"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir Plano
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="p-6">
          {/* Formulário de Adicionar Plano */}
          {showAddPlano && (
            <div className="mb-6 p-4 bg-muted rounded-lg border border-border">
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Selecionar Plano
                    </label>
                    <select
                      value={selectedPlanoId}
                      onChange={(e) => {
                        setSelectedPlanoId(e.target.value)
                        const plano = planos.find((p) => p.id === e.target.value)
                        if (plano) {
                          setValorPlano(plano.valor)
                        }
                      }}
                      className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    >
                      <option value="">Selecione um plano...</option>
                      {planos.map((plano) => (
                        <option key={plano.id} value={plano.id}>
                          {plano.nome} - {formatCurrency(plano.valor)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Vincular ao contrato (opcional)</label>
                    <select
                      value={contratoIdPlano}
                      onChange={(e) => setContratoIdPlano(e.target.value)}
                      className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    >
                      <option value="">Nenhum</option>
                      {clienteContratos.map((c) => (
                        <option key={c.id} value={c.id}>{c.nome || 'Contrato (sem nome)'}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Valor do Contrato (R$) *
                    </label>
                    <InputMoeda
                      value={valorPlano}
                      onValueChange={(v) => setValorPlano(v ?? '')}
                      className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                      placeholder="0,00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Status *
                    </label>
                    <select
                      value={statusPlano}
                      onChange={(e) => setStatusPlano(e.target.value as 'ativo' | 'pausado' | 'cancelado' | 'finalizado')}
                      className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    >
                      <option value="ativo">Ativo</option>
                      <option value="pausado">Pausado</option>
                      <option value="cancelado">Cancelado</option>
                      <option value="finalizado">Finalizado</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Data de Início *
                    </label>
                    <input
                      type="date"
                      value={dataInicioPlano}
                      onChange={(e) => setDataInicioPlano(e.target.value)}
                      min={DATE_MIN}
                      max={DATE_MAX}
                      className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Data de Fim (opcional)
                    </label>
                    <input
                      type="date"
                      value={dataFimPlano}
                      onChange={(e) => setDataFimPlano(e.target.value)}
                      min={dataInicioPlano || DATE_MIN}
                      max={DATE_MAX}
                      className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddPlano}
                    disabled={!selectedPlanoId || (valorPlano !== 0 && !valorPlano) || !dataInicioPlano || creatingPlano}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creatingPlano && <Loader2 className="w-4 h-4 animate-spin" />}
                    <Plus className="w-4 h-4" />
                    Adicionar
                  </button>
                  <button
                    onClick={() => {
                      setShowAddPlano(false)
                      setSelectedPlanoId('')
                      setValorPlano('')
                      setStatusPlano('ativo')
                      setContratoIdPlano('')
                      setDataInicioPlano('')
                      setDataFimPlano('')
                    }}
                    className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Lista de Planos */}
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Carregando planos...</p>
            </div>
          ) : clientePlanos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p>Nenhum plano contratado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {clientePlanos.map((contrato) => (
                <div
                  key={contrato.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <div className="font-medium text-foreground">
                        {contrato.plano?.nome || 'Plano não encontrado'}
                      </div>
                      {getStatusBadge(contrato.status)}
                      {getContratoBadge((contrato.contrato_assinado ?? 'nao_assinado') as 'assinado' | 'nao_assinado' | 'cancelado')}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Valor: {formatCurrency(contrato.valor)}
                      {contrato.plano && contrato.valor !== contrato.plano.valor && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          (Plano: {formatCurrency(contrato.plano.valor)})
                        </span>
                      )}
                    </div>
                    {contrato.observacoes && (
                      <div className="text-sm text-muted-foreground mt-1">{contrato.observacoes}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setHistoricoPlano(contrato)}
                      className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                      title="Ver histórico"
                    >
                      <Clock className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingPlano(contrato)}
                      className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePlanoContrato(contrato)}
                      disabled={deletingPlano}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Excluir contrato"
                    >
                      {deletingPlano ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Serviços Avulsos Contratados */}
      <div className="bg-card rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow">
        <div className="border-b border-border px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-primary" />
            Serviços Avulsos
          </h2>
          <div className="relative" ref={openMenu === 'servicos' ? menuRef : undefined}>
            <button
              onClick={() => setOpenMenu(openMenu === 'servicos' ? null : 'servicos')}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Processos
              <ChevronDown className="w-4 h-4" />
            </button>
            {openMenu === 'servicos' && (
              <div className="absolute right-0 top-full mt-1 w-52 bg-card border border-border rounded-lg shadow-lg z-20 py-1">
                <button
                  onClick={() => {
                    setShowAddServico(true)
                    setOpenMenu(null)
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Serviço
                </button>
                <button
                  disabled
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground cursor-not-allowed"
                  title="Em breve"
                >
                  <Ban className="w-4 h-4" />
                  Cancelar Serviço
                </button>
                <button
                  disabled
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground cursor-not-allowed"
                  title="Em breve"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Concluir Serviço
                </button>
                <button
                  disabled
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground cursor-not-allowed"
                  title="Utilize o botão no card do serviço"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir Serviço
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="p-6">
          {/* Formulário de Adicionar Serviço */}
          {showAddServico && (
            <div className="mb-6 p-4 bg-muted rounded-lg border border-border">
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Selecionar Serviço
                    </label>
                    <select
                      value={selectedServicoId}
                      onChange={(e) => {
                        setSelectedServicoId(e.target.value)
                        const servico = servicos.find((s) => s.id === e.target.value)
                        if (servico && servico.valor != null) {
                          setValorServico(Number(servico.valor))
                        }
                      }}
                      className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    >
                      <option value="">Selecione um serviço...</option>
                      {servicos.map((servico) => (
                        <option key={servico.id} value={servico.id}>
                          {servico.nome}
                          {servico.valor && ` - ${formatCurrency(servico.valor)}`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Vincular ao contrato (opcional)</label>
                    <select
                      value={contratoIdServico}
                      onChange={(e) => setContratoIdServico(e.target.value)}
                      className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    >
                      <option value="">Nenhum</option>
                      {clienteContratos.map((c) => (
                        <option key={c.id} value={c.id}>{c.nome || 'Contrato (sem nome)'}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Valor do Contrato (R$) *
                    </label>
                    <InputMoeda
                      value={valorServico}
                      onValueChange={(v) => setValorServico(v ?? '')}
                      className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                      placeholder="0,00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Status *
                    </label>
                    <select
                      value={statusServico}
                      onChange={(e) => setStatusServico(e.target.value as 'ativo' | 'pausado' | 'cancelado' | 'finalizado')}
                      className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    >
                      <option value="ativo">Ativo</option>
                      <option value="pausado">Pausado</option>
                      <option value="cancelado">Cancelado</option>
                      <option value="finalizado">Finalizado</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Data de Início *
                    </label>
                    <input
                      type="date"
                      value={dataInicioServico}
                      onChange={(e) => setDataInicioServico(e.target.value)}
                      min={DATE_MIN}
                      max={DATE_MAX}
                      className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Data de Fim (opcional)
                    </label>
                    <input
                      type="date"
                      value={dataFimServico}
                      onChange={(e) => setDataFimServico(e.target.value)}
                      min={dataInicioServico || DATE_MIN}
                      max={DATE_MAX}
                      className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddServico}
                    disabled={!selectedServicoId || (valorServico !== 0 && !valorServico) || !dataInicioServico || creatingServico}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creatingServico && <Loader2 className="w-4 h-4 animate-spin" />}
                    <Plus className="w-4 h-4" />
                    Adicionar
                  </button>
                  <button
                    onClick={() => {
                      setShowAddServico(false)
                      setSelectedServicoId('')
                      setValorServico('')
                      setStatusServico('ativo')
                      setDataInicioServico('')
                      setDataFimServico('')
                    }}
                    className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Lista de Serviços */}
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Carregando serviços...</p>
            </div>
          ) : clienteServicos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p>Nenhum serviço avulso contratado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {clienteServicos.map((contrato) => (
                <div
                  key={contrato.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <div className="font-medium text-foreground">
                        {contrato.servico?.nome || 'Serviço não encontrado'}
                      </div>
                      {getStatusBadge(contrato.status)}
                      {getContratoBadge((contrato.contrato_assinado ?? 'nao_assinado') as 'assinado' | 'nao_assinado' | 'cancelado')}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Valor: {formatCurrency(contrato.valor)}
                      {contrato.servico?.valor && contrato.valor !== contrato.servico.valor && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          (Serviço: {formatCurrency(contrato.servico.valor)})
                        </span>
                      )}
                    </div>
                    {contrato.observacoes && (
                      <div className="text-sm text-muted-foreground mt-1">{contrato.observacoes}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setHistoricoServico(contrato)}
                      className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                      title="Ver histórico"
                    >
                      <Clock className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingServico(contrato)}
                      className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteServicoContrato(contrato)}
                      disabled={deletingServico}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Excluir contrato"
                    >
                      {deletingServico ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modais de Edição */}
      {editingContrato && (
        <EditClienteContratoModal
          contrato={editingContrato}
          isOpen={!!editingContrato}
          onClose={() => setEditingContrato(null)}
          onSuccess={async () => {
            await refetchContratos()
            await refetchPlanos()
            await refetchServicos()
            if (onSave) onSave()
          }}
        />
      )}

      {editingPlano && (
        <EditClientePlanoModal
          contrato={editingPlano}
          isOpen={!!editingPlano}
          onClose={() => setEditingPlano(null)}
          onSuccess={async () => {
            await refetchPlanos()
            if (onSave) onSave()
          }}
        />
      )}

      {editingServico && (
        <EditClienteServicoModal
          contrato={editingServico}
          isOpen={!!editingServico}
          onClose={() => setEditingServico(null)}
          onSuccess={async () => {
            await refetchServicos()
            if (onSave) onSave()
          }}
        />
      )}

      {/* Modais de Histórico */}
      {historicoPlano && (
        <HistoricoStatusModal
          tipoContrato="plano"
          contratoId={historicoPlano.id}
          contratoNome={historicoPlano.plano?.nome || 'Plano'}
          isOpen={!!historicoPlano}
          onClose={() => setHistoricoPlano(null)}
        />
      )}

      {historicoServico && (
        <HistoricoStatusModal
          tipoContrato="servico"
          contratoId={historicoServico.id}
          contratoNome={historicoServico.servico?.nome || 'Serviço'}
          isOpen={!!historicoServico}
          onClose={() => setHistoricoServico(null)}
        />
      )}
    </div>
  )
}
