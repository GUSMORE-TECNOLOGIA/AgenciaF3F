import { useState, useEffect, useMemo } from 'react'
import { Sparkles, Plus, X, Save, Filter, BookmarkCheck } from 'lucide-react'
import type { SmartFilter, SmartFilterCondition } from '@/services/clientes'
import { useAuth } from '@/contexts/AuthContext'
import { fetchUsuariosParaSelecaoResponsavel } from '@/services/usuarios'

interface FieldDefinition {
  value: string
  label: string
  type: 'text' | 'select' | 'boolean'
  options?: Array<{ value: string; label: string }>
}

const AVAILABLE_FIELDS: FieldDefinition[] = [
  { value: 'nome', label: 'Nome', type: 'text' },
  { value: 'email', label: 'E-mail', type: 'text' },
  { value: 'telefone', label: 'Telefone', type: 'text' },
  {
    value: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'ativo', label: 'Ativo' },
      { value: 'inativo', label: 'Inativo' },
      { value: 'pausado', label: 'Pausado' },
    ],
  },
  { value: 'responsavel_id', label: 'Responsável', type: 'select' },
  { value: 'tem_contrato', label: 'Tem contrato', type: 'boolean' },
  {
    value: 'contrato_assinado',
    label: 'Contrato assinado',
    type: 'select',
    options: [
      { value: 'assinado', label: 'Assinado' },
      { value: 'nao_assinado', label: 'Não assinado' },
      { value: 'cancelado', label: 'Cancelado' },
    ],
  },
  { value: 'contrato_vencido', label: 'Contrato vencido', type: 'boolean' },
  { value: 'tem_plano', label: 'Tem plano', type: 'boolean' },
  {
    value: 'plano_status',
    label: 'Status do plano',
    type: 'select',
    options: [
      { value: 'ativo', label: 'Ativo' },
      { value: 'pausado', label: 'Pausado' },
      { value: 'cancelado', label: 'Cancelado' },
      { value: 'finalizado', label: 'Finalizado' },
    ],
  },
  { value: 'tem_servico', label: 'Tem serviço', type: 'boolean' },
  {
    value: 'servico_status',
    label: 'Status do serviço',
    type: 'select',
    options: [
      { value: 'ativo', label: 'Ativo' },
      { value: 'pausado', label: 'Pausado' },
      { value: 'cancelado', label: 'Cancelado' },
      { value: 'finalizado', label: 'Finalizado' },
    ],
  },
  { value: 'tem_financeiro_gerado', label: 'Tem financeiro gerado', type: 'boolean' as const },
]

const OPERATORS: Array<{ value: string; label: string; supportsValue: boolean }> = [
  { value: 'contains', label: 'Contém', supportsValue: true },
  { value: 'equals', label: 'Igual a', supportsValue: true },
  { value: 'not_contains', label: 'Não contém', supportsValue: true },
  { value: 'not_equals', label: 'Diferente de', supportsValue: true },
  { value: 'is_empty', label: 'Está vazio', supportsValue: false },
  { value: 'is_not_empty', label: 'Não está vazio', supportsValue: false },
]

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onApply: (conditions: SmartFilterCondition[]) => void
  currentConditions: SmartFilterCondition[]
  savedFilters: SmartFilter[]
  onSaveFilter: (filter: Omit<SmartFilter, 'id' | 'createdAt'>) => void
  onDeleteFilter: (filterId: string) => void
  onLoadFilter: (filter: SmartFilter) => void
}

function createEmptyCondition(): SmartFilterCondition {
  return {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    field: '',
    operator: 'contains',
    value: '',
  }
}

export default function SmartFiltersModal({
  open,
  onOpenChange,
  onApply,
  currentConditions,
  savedFilters,
  onSaveFilter,
  onDeleteFilter,
  onLoadFilter,
}: Props) {
  const { pode } = useAuth()
  const podeFinanceiro = pode('financeiro', 'visualizar')
  const availableFields = useMemo(
    () =>
      podeFinanceiro
        ? AVAILABLE_FIELDS
        : AVAILABLE_FIELDS.filter((f) => f.value !== 'tem_financeiro_gerado'),
    [podeFinanceiro]
  )

  const [conditions, setConditions] = useState<SmartFilterCondition[]>(currentConditions)
  const [saveFilterName, setSaveFilterName] = useState('')
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [responsaveis, setResponsaveis] = useState<Array<{ id: string; name: string }>>([])

  useEffect(() => {
    if (open) {
      setConditions(currentConditions.length > 0 ? currentConditions : [createEmptyCondition()])
    }
  }, [open, currentConditions])

  useEffect(() => {
    if (open) {
      fetchUsuariosParaSelecaoResponsavel().then((list) => {
        setResponsaveis(
          list.map((u) => ({ id: u.id, name: u.name || u.email || '(sem nome)' }))
        )
      })
    }
  }, [open])

  function addCondition() {
    setConditions([...conditions, createEmptyCondition()])
  }

  function removeCondition(id: string) {
    setConditions(conditions.filter((c) => c.id !== id))
  }

  function updateCondition(id: string, updates: Partial<SmartFilterCondition>) {
    setConditions(conditions.map((c) => (c.id === id ? { ...c, ...updates } : c)))
  }

  function handleApply() {
    let validConditions = conditions.filter((c) => c.field && c.operator)
    if (!podeFinanceiro) {
      validConditions = validConditions.filter((c) => c.field !== 'tem_financeiro_gerado')
    }
    if (validConditions.length === 0) {
      return
    }
    onApply(validConditions)
    onOpenChange(false)
  }

  function handleClear() {
    setConditions([createEmptyCondition()])
    onApply([])
    onOpenChange(false)
  }

  function handleSaveFilter() {
    if (!saveFilterName.trim()) return
    const validConditions = conditions.filter((c) => c.field && c.operator)
    if (validConditions.length === 0) return
    onSaveFilter({ name: saveFilterName.trim(), conditions: validConditions })
    setSaveFilterName('')
    setShowSaveDialog(false)
  }

  function handleLoadFilter(filter: SmartFilter) {
    setConditions(filter.conditions.length > 0 ? filter.conditions : [createEmptyCondition()])
    onLoadFilter(filter)
  }

  function getFieldDefinition(fieldValue: string): FieldDefinition | undefined {
    return AVAILABLE_FIELDS.find((f) => f.value === fieldValue)
  }

  function getOperatorsForField(fieldValue: string) {
    const field = getFieldDefinition(fieldValue)
    if (!field) return OPERATORS
    if (field.type === 'boolean') {
      return OPERATORS.filter((op) =>
        ['equals', 'not_equals', 'is_empty', 'is_not_empty'].includes(op.value)
      )
    }
    return OPERATORS
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex-shrink-0 border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              <h2 className="text-xl font-bold text-foreground">Filtros Inteligentes</h2>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Crie filtros complexos combinando múltiplas condições. Os filtros são mantidos ao navegar.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {savedFilters.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <BookmarkCheck className="w-4 h-4" />
                Filtros Salvos
              </label>
              <div className="flex flex-wrap gap-2">
                {savedFilters.map((filter) => (
                  <span
                    key={filter.id}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-muted hover:bg-primary hover:text-white rounded-full text-sm cursor-pointer transition-colors"
                    onClick={() => handleLoadFilter(filter)}
                  >
                    {filter.name}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteFilter(filter.id)
                      }}
                      className="hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <hr className="border-border" />
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-foreground">Condições</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowSaveDialog(true)}
                  disabled={conditions.filter((c) => c.field && c.operator).length === 0}
                  className="inline-flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-sm hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  Salvar Filtro
                </button>
                <button
                  type="button"
                  onClick={addCondition}
                  className="inline-flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-sm hover:bg-muted"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Condição
                </button>
              </div>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {conditions.map((condition, index) => {
                const fieldDef = getFieldDefinition(condition.field)
                const operators = getOperatorsForField(condition.field)
                const needsValue =
                  operators.find((op) => op.value === condition.operator)?.supportsValue ?? true
                const val = typeof condition.value === 'string' ? condition.value : ''

                return (
                  <div key={condition.id} className="border rounded-lg p-4 space-y-3">
                    {index > 0 && (
                      <div className="flex items-center gap-2 mb-2">
                        <select
                          value={condition.logicalOperator || 'AND'}
                          onChange={(e) =>
                            updateCondition(condition.id!, {
                              logicalOperator: e.target.value as 'AND' | 'OR',
                            })
                          }
                          className="min-w-[8.5rem] w-36 px-3 py-2 bg-background text-foreground border border-border rounded-lg text-sm"
                        >
                          <option value="AND">E (AND)</option>
                          <option value="OR">OU (OR)</option>
                        </select>
                        <span className="text-sm text-muted-foreground">então</span>
                      </div>
                    )}

                    <div className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-4">
                        <label className="block text-xs text-muted-foreground mb-1">Campo</label>
                        <select
                          value={condition.field}
                          onChange={(e) => {
                            const v = e.target.value
                            const fd = getFieldDefinition(v)
                            updateCondition(condition.id!, {
                              field: v,
                              operator: fd?.type === 'boolean' ? 'equals' : 'contains',
                              value: '',
                            })
                          }}
                          className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-lg text-sm"
                        >
                          <option value="">Selecione o campo</option>
                          {availableFields.map((f) => (
                            <option key={f.value} value={f.value}>
                              {f.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-3">
                        <label className="block text-xs text-muted-foreground mb-1">Operador</label>
                        <select
                          value={condition.operator}
                          onChange={(e) =>
                            updateCondition(condition.id!, { operator: e.target.value })
                          }
                          disabled={!condition.field}
                          className="w-full px-3 py-2 border border-border rounded-lg text-sm disabled:opacity-50"
                        >
                          {operators.map((op) => (
                            <option key={op.value} value={op.value}>
                              {op.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-4">
                        {needsValue && (
                          <>
                            <label className="block text-xs text-muted-foreground mb-1">Valor</label>
                            {condition.field === 'responsavel_id' ? (
                              <select
                                value={val}
                                onChange={(e) =>
                                  updateCondition(condition.id!, { value: e.target.value })
                                }
                                disabled={!condition.field}
                                className="w-full px-3 py-2 border border-border rounded-lg text-sm disabled:opacity-50"
                              >
                                <option value="">Selecione</option>
                                {responsaveis.map((r) => (
                                  <option key={r.id} value={r.id}>
                                    {r.name}
                                  </option>
                                ))}
                              </select>
                            ) : fieldDef?.type === 'select' && fieldDef.options ? (
                              <select
                                value={val}
                                onChange={(e) =>
                                  updateCondition(condition.id!, { value: e.target.value })
                                }
                                disabled={!condition.field}
                                className="w-full px-3 py-2 border border-border rounded-lg text-sm disabled:opacity-50"
                              >
                                <option value="">Selecione</option>
                                {fieldDef.options.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            ) : fieldDef?.type === 'boolean' ? (
                              <select
                                value={val || 'true'}
                                onChange={(e) =>
                                  updateCondition(condition.id!, { value: e.target.value })
                                }
                                disabled={!condition.field}
                                className="w-full px-3 py-2 border border-border rounded-lg text-sm disabled:opacity-50"
                              >
                                <option value="true">Sim</option>
                                <option value="false">Não</option>
                              </select>
                            ) : (
                              <input
                                type="text"
                                value={val}
                                onChange={(e) =>
                                  updateCondition(condition.id!, { value: e.target.value })
                                }
                                placeholder="Digite o valor"
                                disabled={!condition.field}
                                className="w-full px-3 py-2 border border-border rounded-lg text-sm disabled:opacity-50"
                              />
                            )}
                          </>
                        )}
                      </div>
                      <div className="col-span-1">
                        <button
                          type="button"
                          onClick={() => removeCondition(condition.id!)}
                          disabled={conditions.length === 1}
                          className="p-2 hover:bg-muted rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {showSaveDialog && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-10 rounded-lg">
              <div className="bg-card border rounded-lg p-6 w-96 space-y-4 shadow-lg mx-4">
                <h3 className="text-lg font-semibold">Salvar Filtro</h3>
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Nome do Filtro</label>
                  <input
                    type="text"
                    value={saveFilterName}
                    onChange={(e) => setSaveFilterName(e.target.value)}
                    placeholder="Ex: Clientes sem contrato"
                    className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg"
                    autoFocus
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSaveDialog(false)
                      setSaveFilterName('')
                    }}
                    className="px-4 py-2 border border-border rounded-lg hover:bg-muted"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveFilter}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex-shrink-0 border-t border-border px-6 py-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={handleClear}
            className="px-4 py-2 border border-border rounded-lg hover:bg-muted"
          >
            Limpar Filtros
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 inline-flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Aplicar Filtros
          </button>
        </div>
      </div>
    </div>
  )
}
