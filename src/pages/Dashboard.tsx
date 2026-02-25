import { useState, useMemo, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useDashboard } from '@/hooks/useDashboard'
import type { DashboardStats } from '@/services/dashboard'
import { getDebugVisibilidadeClientes, type DebugVisibilidadeClientes } from '@/services/dashboard'
import {
  Users,
  UserCheck,
  DollarSign,
  AlertCircle,
  TrendingUp,
  Clock,
  ArrowUpRight,
  BarChart3,
  PieChart,
  FileText,
  Filter,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { Link } from 'react-router-dom'

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

const COLORS = ['#5B7CFA', '#22D3EE', '#34D399', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']
const CONTRATO_FAIXA_COLORS: Record<string, string> = {
  Vencidos: '#EF4444',
  'Próximos 30 dias': '#F59E0B',
  '31 a 60 dias': '#EAB308',
  '61 a 90 dias': '#84CC16',
  'Após 90 dias': '#22C55E',
  'Sem data fim': '#94A3B8',
}

export default function Dashboard() {
  const { user, pode } = useAuth()
  const podeFinanceiro = pode('financeiro', 'visualizar')
  const [filterContratoResponsavel, setFilterContratoResponsavel] = useState<string>('')
  const [filterContratoFaixa, setFilterContratoFaixa] = useState<string>('todos')
  const [debugVisibilidade, setDebugVisibilidade] = useState<DebugVisibilidadeClientes | null>(null)
  const { stats, loading, error, refetch } = useDashboard({
    skipFinance: !podeFinanceiro,
    responsavelId: undefined,
  })

  // Quando o usuário vê 0 clientes, buscar diagnóstico (auth_uid no backend) para corrigir responsavel_id no banco.
  useEffect(() => {
    if (!stats || stats.clientes.total > 0) {
      setDebugVisibilidade(null)
      return
    }
    let cancelled = false
    getDebugVisibilidadeClientes().then((d) => {
      if (!cancelled && d) setDebugVisibilidade(d)
    })
    return () => { cancelled = true }
  }, [stats?.clientes.total])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground">Carregando indicadores...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 p-6 text-center">
        <p className="text-red-700 font-medium">Erro ao carregar o dashboard</p>
        <p className="text-red-600 text-sm mt-1">{error.message}</p>
        <button
          onClick={refetch}
          className="mt-4 px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  if (!stats) return null

  const { clientes, financeiro, ocorrencias } = stats
  const ocorrenciasAbertasTotal = ocorrencias.abertas + ocorrencias.emAndamento

  const kpisBase = [
    {
      label: 'Total de clientes',
      value: clientes.total,
      icon: Users,
      href: '/clientes',
      gradient: 'from-blue-500 to-indigo-600',
      bg: 'bg-gradient-to-br from-blue-500/10 to-indigo-600/10',
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-600',
    },
    {
      label: 'Clientes ativos',
      value: clientes.ativos,
      icon: UserCheck,
      href: '/clientes',
      gradient: 'from-emerald-500 to-teal-600',
      bg: 'bg-gradient-to-br from-emerald-500/10 to-teal-600/10',
      iconBg: 'bg-emerald-500/20',
      iconColor: 'text-emerald-600',
    },
    ...(podeFinanceiro
      ? [
          {
            label: 'Receita do mês',
            value: formatCurrency(financeiro.receitaMes),
            icon: DollarSign,
            href: '/financeiro',
            gradient: 'from-amber-500 to-orange-600',
            bg: 'bg-gradient-to-br from-amber-500/10 to-orange-600/10',
            iconBg: 'bg-amber-500/20',
            iconColor: 'text-amber-600',
          },
        ]
      : []),
    {
      label: 'Ocorrências abertas',
      value: ocorrenciasAbertasTotal,
      icon: AlertCircle,
      href: '/ocorrencias',
      gradient: 'from-rose-500 to-pink-600',
      bg: 'bg-gradient-to-br from-rose-500/10 to-pink-600/10',
      iconBg: 'bg-rose-500/20',
      iconColor: 'text-rose-600',
    },
  ]
  const kpis = kpisBase

  return (
    <div className="space-y-8 animate-fade-in">
      {debugVisibilidade && clientes.total === 0 && debugVisibilidade.auth_uid && (
        <div className="rounded-xl border-2 border-amber-400 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Você vê 0 clientes — diagnóstico</p>
          <p className="mt-1">
            ID do seu login: <code className="rounded bg-amber-100 px-1 font-mono text-xs">{debugVisibilidade.auth_uid}</code>
          </p>
          <p className="mt-2 text-amber-800">
            <strong>Admin:</strong> siga o guia <strong>VALIDAR_E_APLICAR_FIX_AGENTE_VISIBILIDADE</strong> no repositório (.context/docs/guias/). Primeiro rode a <em>Validação</em> no SQL Editor (projeto F3F). Se aparecer FALTA_APLICAR_FIX, execute o bloco <em>Aplicar o fix</em> e depois <code className="rounded bg-amber-100 px-1">NOTIFY pgrst, &apos;reload schema&apos;;</code>. Se o ID acima for diferente do responsável dos clientes, use o UPDATE do guia (seção 5).
          </p>
          <p className="mt-1 text-amber-700">
            Depois o usuário atualiza a página (Ctrl+F5).
          </p>
        </div>
      )}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-primary to-indigo-600 bg-clip-text text-transparent">
            Olá, {user?.name ?? 'Admin'}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Visão geral da agência · dados em tempo real
          </p>
        </div>
        <button
          onClick={refetch}
          className="self-start px-4 py-2 rounded-xl border border-border hover:border-primary/40 hover:bg-primary/5 transition-all text-sm font-medium text-foreground"
        >
          Atualizar
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k, idx) => {
          const Icon = k.icon
          return (
            <Link
              key={k.label}
              to={k.href}
              className={`group relative overflow-hidden rounded-2xl border border-border/80 p-6 ${k.bg} hover:shadow-lg hover:shadow-border/50 hover:border-border transition-all duration-300 animate-slide-up`}
              style={{ animationDelay: `${idx * 60}ms`, animationFillMode: 'both' }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{k.label}</p>
                  <p className="mt-2 text-2xl font-bold text-foreground tabular-nums">
                    {k.value}
                  </p>
                </div>
                <div
                  className={`rounded-xl p-3 ${k.iconBg} ${k.iconColor} group-hover:scale-110 transition-transform`}
                >
                  <Icon className="w-6 h-6" />
                </div>
              </div>
              <ArrowUpRight className="absolute bottom-4 right-4 w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">
              Clientes por responsável
            </h2>
          </div>
          {clientes.porResponsavel.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhum dado ainda</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={clientes.porResponsavel}
                layout="vertical"
                margin={{ top: 0, right: 24, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tickFormatter={(v) => String(v)} />
                <YAxis
                  type="category"
                  dataKey="responsavelNome"
                  width={100}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  formatter={(v) => [Number(v) || 0, 'Clientes']}
                  labelFormatter={(label) => `Responsável: ${label}`}
                />
                <Bar dataKey="total" name="Total" radius={[0, 4, 4, 0]} maxBarSize={28}>
                  {clientes.porResponsavel.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <PieChart className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">
              Status dos clientes
            </h2>
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-3 rounded-xl bg-emerald-50 px-4 py-3 border border-emerald-100">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-sm text-muted-foreground">Ativos</span>
              <span className="font-bold text-emerald-700">{clientes.ativos}</span>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-muted px-4 py-3 border border-border">
              <div className="w-3 h-3 rounded-full bg-gray-400" />
              <span className="text-sm text-muted-foreground">Inativos</span>
              <span className="font-bold text-foreground">{clientes.inativos}</span>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-amber-50 px-4 py-3 border border-amber-100">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-sm text-muted-foreground">Pausados</span>
              <span className="font-bold text-amber-700">{clientes.pausados}</span>
            </div>
          </div>
        </div>
      </div>

      {podeFinanceiro && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <DollarSign className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">
              Financeiro · visão geral
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4">
              <div className="flex items-center gap-2 text-emerald-700">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-medium">Receita do mês</span>
              </div>
              <p className="mt-2 text-xl font-bold text-emerald-800 tabular-nums">
                {formatCurrency(financeiro.receitaMes)}
              </p>
            </div>
            <div className="rounded-xl bg-blue-50 border border-blue-100 p-4">
              <div className="flex items-center gap-2 text-blue-700">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">Em abertos</span>
              </div>
              <p className="mt-2 text-xl font-bold text-blue-800 tabular-nums">
                {formatCurrency(financeiro.totalEmAbertos)}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {financeiro.percEmAbertos.toFixed(1)}% do total
              </p>
            </div>
            <div className="rounded-xl bg-rose-50 border border-rose-100 p-4">
              <div className="flex items-center gap-2 text-rose-700">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Atrasados</span>
              </div>
              <p className="mt-2 text-xl font-bold text-rose-800 tabular-nums">
                {formatCurrency(financeiro.totalAtrasados)}
              </p>
              <p className="text-xs text-rose-600 mt-1">
                {financeiro.percAtrasados.toFixed(1)}% do total
              </p>
            </div>
            <div className="rounded-xl bg-violet-50 border border-violet-100 p-4">
              <div className="flex items-center gap-2 text-violet-700">
                <ArrowUpRight className="w-4 h-4" />
                <span className="text-sm font-medium">Provisão faturamento</span>
              </div>
              <p className="mt-2 text-xl font-bold text-violet-800 tabular-nums">
                {formatCurrency(financeiro.provisaoFaturamento)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-4">
                Atrasados por responsável
              </h3>
              {financeiro.atrasadosPorResponsavel.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4">Nenhum título atrasado</p>
              ) : (
                <div className="space-y-2">
                  {financeiro.atrasadosPorResponsavel
                    .sort((a, b) => b.valor - a.valor)
                    .map((r) => (
                      <div
                        key={r.responsavelId}
                        className="flex items-center justify-between rounded-lg bg-rose-50/50 px-4 py-3 border border-rose-100"
                      >
                        <span className="font-medium text-foreground">{r.responsavelNome}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-rose-600">{r.qtd} título(s)</span>
                          <span className="font-bold text-rose-700 tabular-nums">
                            {formatCurrency(r.valor)}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-4">
                Em abertos por responsável
              </h3>
              {financeiro.emAbertosPorResponsavel.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4">Nenhum título em aberto</p>
              ) : (
                <div className="space-y-2">
                  {financeiro.emAbertosPorResponsavel
                    .sort((a, b) => b.valor - a.valor)
                    .map((r) => (
                      <div
                        key={r.responsavelId}
                        className="flex items-center justify-between rounded-lg bg-blue-50/50 px-4 py-3 border border-blue-100"
                      >
                        <span className="font-medium text-foreground">{r.responsavelNome}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-blue-600">{r.qtd} título(s)</span>
                          <span className="font-bold text-blue-700 tabular-nums">
                            {formatCurrency(r.valor)}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          {financeiro.atrasadosPorResponsavel.length > 0 && (
            <div className="mt-8">
              <h3 className="text-sm font-semibold text-foreground mb-4">
                Gráfico · Atrasados por responsável
              </h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={[...financeiro.atrasadosPorResponsavel].sort(
                    (a, b) => b.valor - a.valor
                  )}
                  layout="vertical"
                  margin={{ top: 0, right: 24, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    type="number"
                    tickFormatter={(v) => formatCurrency(v)}
                    fontSize={11}
                  />
                  <YAxis
                    type="category"
                    dataKey="responsavelNome"
                    width={100}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(v) => [formatCurrency(Number(v) || 0), 'Atrasados']}
                    labelFormatter={(label) => `Responsável: ${label}`}
                  />
                  <Bar dataKey="valor" name="Atrasados" radius={[0, 4, 4, 0]} fill="#f43f5e">
                    {[...financeiro.atrasadosPorResponsavel]
                      .sort((a, b) => b.valor - a.valor)
                      .map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Painel Contratos · análise por responsável e vencimento */}
      {stats.contratos && (
        <ContratosPanel
          contratos={stats.contratos}
          filterResponsavel={filterContratoResponsavel}
          setFilterResponsavel={setFilterContratoResponsavel}
          filterFaixa={filterContratoFaixa}
          setFilterFaixa={setFilterContratoFaixa}
        />
      )}
    </div>
  )
}

type ContratosPanelProps = {
  contratos: NonNullable<DashboardStats['contratos']>
  filterResponsavel: string
  setFilterResponsavel: (v: string) => void
  filterFaixa: string
  setFilterFaixa: (v: string) => void
}

function ContratosPanel({
  contratos,
  filterResponsavel,
  setFilterResponsavel,
  filterFaixa,
  setFilterFaixa,
}: ContratosPanelProps) {
  const faixaKeys: Array<{ key: string; label: string }> = [
    { key: 'todos', label: 'Todos' },
    { key: 'vencidos', label: 'Vencidos' },
    { key: 'proximos30', label: 'Próximos 30 dias' },
    { key: 'proximos60', label: '31 a 60 dias' },
    { key: 'proximos90', label: '61 a 90 dias' },
    { key: 'apos90', label: 'Após 90 dias' },
    { key: 'semData', label: 'Sem data fim' },
  ]

  const chartPorResponsavelData = useMemo(() => {
    let list = contratos.porResponsavel
    if (filterResponsavel) {
      list = list.filter((r) => r.responsavelId === filterResponsavel)
    }
    const getValue = (r: (typeof list)[0]) => {
      if (filterFaixa === 'todos') return r.total
      if (filterFaixa === 'vencidos') return r.vencidos
      if (filterFaixa === 'proximos30') return r.pertoVencer30
      if (filterFaixa === 'proximos60') return r.pertoVencer60
      if (filterFaixa === 'proximos90') return r.pertoVencer90
      if (filterFaixa === 'apos90') return r.apos90
      if (filterFaixa === 'semData') return r.semData
      return r.total
    }
    return list
      .map((r) => ({ ...r, valor: getValue(r) }))
      .filter((r) => r.valor > 0)
      .sort((a, b) => b.valor - a.valor)
  }, [contratos.porResponsavel, filterResponsavel, filterFaixa])

  const chartPorFaixaData = useMemo(() => {
    if (filterResponsavel && contratos.faixasPorResponsavel[filterResponsavel]) {
      const f = contratos.faixasPorResponsavel[filterResponsavel]
      return [
        { faixa: 'Vencidos', count: f.vencidos, ordem: 0 },
        { faixa: 'Próximos 30 dias', count: f.proximos30, ordem: 1 },
        { faixa: '31 a 60 dias', count: f.proximos60, ordem: 2 },
        { faixa: '61 a 90 dias', count: f.proximos90, ordem: 3 },
        { faixa: 'Após 90 dias', count: f.apos90, ordem: 4 },
        { faixa: 'Sem data fim', count: f.semData, ordem: 5 },
      ].sort((a, b) => a.ordem - b.ordem)
    }
    return contratos.porFaixaVencimento
  }, [contratos.porFaixaVencimento, contratos.faixasPorResponsavel, filterResponsavel])

  const responsavelLabel = filterResponsavel
    ? contratos.responsaveisUnicos.find((r) => r.responsavelId === filterResponsavel)?.responsavelNome ?? 'Responsável'
    : 'Todos'

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <div className="rounded-xl p-2.5 bg-indigo-50 text-indigo-600">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Contratos · visão para decisão
            </h2>
            <p className="text-sm text-muted-foreground">
              Analise por responsável e por vencimento para renovar e priorizar
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              value={filterResponsavel}
              onChange={(e) => setFilterResponsavel(e.target.value)}
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              title="Filtrar por responsável (agente)"
            >
              <option value="">Todos os responsáveis</option>
              {contratos.responsaveisUnicos.map((r) => (
                <option key={r.responsavelId} value={r.responsavelId}>
                  {r.responsavelNome}
                </option>
              ))}
            </select>
          </div>
          <select
            value={filterFaixa}
            onChange={(e) => setFilterFaixa(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            title="Filtrar por faixa de vencimento"
          >
            {faixaKeys.map((f) => (
              <option key={f.key} value={f.key}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-4">
            Por responsável {filterFaixa !== 'todos' ? `· ${faixaKeys.find((f) => f.key === filterFaixa)?.label}` : ''}
          </h3>
          {chartPorResponsavelData.length === 0 ? (
            <div className="rounded-xl bg-muted border border-border py-12 text-center text-muted-foreground text-sm">
              Nenhum contrato nesta combinação de filtros
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={chartPorResponsavelData}
                layout="vertical"
                margin={{ top: 0, right: 24, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tickFormatter={(v) => String(v)} fontSize={11} />
                <YAxis
                  type="category"
                  dataKey="responsavelNome"
                  width={120}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  formatter={(v) => [Number(v), 'Contratos']}
                  labelFormatter={(label) => `Responsável: ${label}`}
                />
                <Bar dataKey="valor" name="Contratos" radius={[0, 4, 4, 0]} maxBarSize={32}>
                  {chartPorResponsavelData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div>
          <h3 className="text-sm font-semibold text-foreground mb-4">
            Por faixa de vencimento {filterResponsavel ? `· ${responsavelLabel}` : ''}
          </h3>
          {chartPorFaixaData.every((d) => d.count === 0) ? (
            <div className="rounded-xl bg-muted border border-border py-12 text-center text-muted-foreground text-sm">
              Nenhum contrato com data de vencimento nesta seleção
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={chartPorFaixaData.filter((d) => d.count > 0)}
                layout="vertical"
                margin={{ top: 0, right: 24, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tickFormatter={(v) => String(v)} fontSize={11} />
                <YAxis
                  type="category"
                  dataKey="faixa"
                  width={120}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip formatter={(v) => [Number(v), 'Contratos']} />
                <Bar dataKey="count" name="Contratos" radius={[0, 4, 4, 0]} maxBarSize={28}>
                  {chartPorFaixaData
                    .filter((d) => d.count > 0)
                    .map((d) => (
                      <Cell key={d.faixa} fill={CONTRATO_FAIXA_COLORS[d.faixa] ?? '#64748B'} />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 px-4 py-3">
        <p className="text-sm text-foreground">
          <strong>Dica:</strong> Use &quot;Próximos 30 dias&quot; para ver quem renovar primeiro; filtre por responsável para acompanhar sua carteira.
        </p>
        <Link
          to="/clientes?view=contratos"
          className="inline-flex items-center gap-2 text-sm font-medium text-indigo-700 hover:text-indigo-800"
        >
          Ver lista de contratos
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}
