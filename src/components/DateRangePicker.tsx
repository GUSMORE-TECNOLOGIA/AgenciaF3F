import { useState, useRef, useEffect } from 'react'
import { DayPicker } from 'react-day-picker'
import {
  format,
  subDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfDay,
  parseISO,
  isValid,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar, ChevronDown } from 'lucide-react'
import 'react-day-picker/dist/style.css'

const toYMD = (d: Date) => format(d, 'yyyy-MM-dd')

export type DateRange = { from: string; to: string }

export type PresetId =
  | 'hoje'
  | 'ontem'
  | 'ultimos_7'
  | 'ultimos_14'
  | 'ultimos_28'
  | 'ultimos_30'
  | 'esta_semana'
  | 'semana_passada'
  | 'este_mes'
  | 'mes_passado'
  | 'custom'

const PRESETS: { id: PresetId; label: string; getRange: () => DateRange }[] = [
  { id: 'hoje', label: 'Hoje', getRange: () => { const t = startOfDay(new Date()); return { from: toYMD(t), to: toYMD(t) } } },
  { id: 'ontem', label: 'Ontem', getRange: () => { const t = subDays(startOfDay(new Date()), 1); return { from: toYMD(t), to: toYMD(t) } } },
  { id: 'ultimos_7', label: 'Últimos 7 dias', getRange: () => { const today = startOfDay(new Date()); const from = subDays(today, 6); return { from: toYMD(from), to: toYMD(today) } } },
  { id: 'ultimos_14', label: 'Últimos 14 dias', getRange: () => { const today = startOfDay(new Date()); const from = subDays(today, 13); return { from: toYMD(from), to: toYMD(today) } } },
  { id: 'ultimos_28', label: 'Últimos 28 dias', getRange: () => { const today = startOfDay(new Date()); const from = subDays(today, 27); return { from: toYMD(from), to: toYMD(today) } } },
  { id: 'ultimos_30', label: 'Últimos 30 dias', getRange: () => { const today = startOfDay(new Date()); const from = subDays(today, 29); return { from: toYMD(from), to: toYMD(today) } } },
  { id: 'esta_semana', label: 'Esta semana', getRange: () => { const today = new Date(); const from = startOfWeek(today, { weekStartsOn: 1 }); const to = endOfWeek(today, { weekStartsOn: 1 }); return { from: toYMD(from), to: toYMD(to) } } },
  { id: 'semana_passada', label: 'Semana passada', getRange: () => { const today = subDays(new Date(), 7); const from = startOfWeek(today, { weekStartsOn: 1 }); const to = endOfWeek(today, { weekStartsOn: 1 }); return { from: toYMD(from), to: toYMD(to) } } },
  { id: 'este_mes', label: 'Este mês', getRange: () => { const today = new Date(); const from = startOfMonth(today); const to = endOfMonth(today); return { from: toYMD(from), to: toYMD(to) } } },
  { id: 'mes_passado', label: 'Mês passado', getRange: () => { const m = subMonths(new Date(), 1); const from = startOfMonth(m); const to = endOfMonth(m); return { from: toYMD(from), to: toYMD(to) } } },
]

const DEFAULT_PRESET: PresetId = 'ultimos_30'

function formatDisplay(d: string) {
  try {
    const parsed = parseISO(d)
    if (!isValid(parsed)) return d
    return format(parsed, "d 'de' MMM 'de' yyyy", { locale: ptBR })
  } catch {
    return d
  }
}

export interface DateRangePickerProps {
  value: DateRange | null
  onChange: (range: DateRange) => void
  placeholder?: string
  className?: string
}

export default function DateRangePicker({ value, onChange, placeholder = 'Selecionar período', className = '' }: DateRangePickerProps) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<DateRange>(value ?? PRESETS.find((p) => p.id === DEFAULT_PRESET)!.getRange())
  const [activePreset, setActivePreset] = useState<PresetId>(value ? 'custom' : DEFAULT_PRESET)
  const [customFrom, setCustomFrom] = useState(value?.from ?? '')
  const [customTo, setCustomTo] = useState(value?.to ?? '')
  const [recent, setRecent] = useState<PresetId[]>(() => {
    try {
      const s = localStorage.getItem('dateRangePickerRecent')
      if (s) return JSON.parse(s) as PresetId[]
    } catch { /* ignore */ }
    return [DEFAULT_PRESET, 'este_mes', 'ultimos_7']
  })
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (value) setDraft(value)
  }, [value])

  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [open])

  const applyPreset = (id: PresetId) => {
    const p = PRESETS.find((x) => x.id === id)
    if (!p) return
    const r = p.getRange()
    setDraft(r)
    setActivePreset(id)
    setCustomFrom(r.from)
    setCustomTo(r.to)
    const next = [id, ...recent.filter((x) => x !== id)].slice(0, 10)
    setRecent(next)
    try {
      localStorage.setItem('dateRangePickerRecent', JSON.stringify(next))
    } catch { /* ignore */ }
  }

  const handleAtualizar = () => {
    if (activePreset === 'custom') {
      if (customFrom && customTo) {
        const from = parseISO(customFrom)
        const to = parseISO(customTo)
        if (isValid(from) && isValid(to) && from <= to) {
          const r = { from: customFrom, to: customTo }
          setDraft(r)
          onChange(r)
        }
      }
    } else {
      onChange(draft)
    }
    setOpen(false)
  }

  const handleCancelar = () => {
    setDraft(value ?? PRESETS.find((p) => p.id === DEFAULT_PRESET)!.getRange())
    setActivePreset(value ? 'custom' : DEFAULT_PRESET)
    if (value) {
      setCustomFrom(value.from)
      setCustomTo(value.to)
    }
    setOpen(false)
  }

  const rangeForPicker = draft ? { from: parseISO(draft.from), to: parseISO(draft.to) } : undefined
  const matchPreset = (): string => {
    if (!value) return ''
    for (const p of PRESETS) {
      const r = p.getRange()
      if (r.from === value.from && r.to === value.to) return p.label
    }
    return 'Intervalo personalizado'
  }
  const displayLabel = value ? matchPreset() : ''
  const displayText = value
    ? `${displayLabel}: ${formatDisplay(value.from)} a ${formatDisplay(value.to)}`
    : placeholder

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 w-full min-w-[280px] px-4 py-2.5 rounded-lg border border-border bg-card hover:bg-muted focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-left"
      >
        <Calendar className="w-5 h-5 text-muted-foreground shrink-0" />
        <span className="flex-1 truncate text-foreground">{displayText}</span>
        <ChevronDown className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 flex bg-card rounded-xl border border-border shadow-xl overflow-hidden">
          {/* Left: Usados recentemente / Presets */}
          <div className="w-56 border-r border-border bg-muted/80 overflow-y-auto max-h-[420px]">
            <p className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Usados recentemente</p>
            <div className="py-2 pb-4">
              {[...new Set(recent)]
                .map((id) => PRESETS.find((p) => p.id === id))
                .filter(Boolean)
                .map((p) => (
                  <label
                    key={p!.id}
                    className="flex items-center gap-3 px-4 py-2 hover:bg-muted cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="preset"
                      checked={activePreset === p!.id}
                      onChange={() => applyPreset(p!.id)}
                      className="text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-foreground">{p!.label}</span>
                  </label>
                ))}
            </div>
            <p className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-t border-border mt-2">Outros</p>
            <div className="py-2 pb-4">
              {PRESETS.filter((p) => !recent.includes(p.id)).map((p) => (
                <label
                  key={p.id}
                  className="flex items-center gap-3 px-4 py-2 hover:bg-muted cursor-pointer"
                >
                  <input
                    type="radio"
                    name="preset"
                    checked={activePreset === p.id}
                    onChange={() => applyPreset(p.id)}
                    className="text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-foreground">{p.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Right: Calendar + Custom */}
          <div className="p-4 min-w-[360px]">
            <DayPicker
              mode="range"
              selected={rangeForPicker}
              onSelect={(r) => {
                if (r?.from) {
                  const from = toYMD(r.from)
                  const to = r.to ? toYMD(r.to) : from
                  setDraft({ from, to })
                  setCustomFrom(from)
                  setCustomTo(to)
                  setActivePreset('custom')
                }
              }}
              numberOfMonths={2}
              pagedNavigation
              locale={ptBR}
              weekStartsOn={1}
              className="rdp-date-range-picker-root border-0 p-0 mb-4"
            />

            <div className="border-t border-border pt-4 space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="preset"
                  id="custom-range"
                  checked={activePreset === 'custom'}
                  onChange={() => setActivePreset('custom')}
                  className="text-primary focus:ring-primary"
                />
                <label htmlFor="custom-range" className="text-sm font-medium text-foreground">Intervalo personalizado</label>
              </div>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={activePreset === 'custom' ? customFrom : draft?.from ?? ''}
                  onChange={(e) => {
                    setCustomFrom(e.target.value)
                    setActivePreset('custom')
                    if (e.target.value && customTo && e.target.value <= customTo) setDraft({ from: e.target.value, to: customTo })
                  }}
                  className="flex-1 px-3 py-2 rounded-lg border border-border bg-card text-foreground text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <input
                  type="date"
                  value={activePreset === 'custom' ? customTo : draft?.to ?? ''}
                  onChange={(e) => {
                    setCustomTo(e.target.value)
                    setActivePreset('custom')
                    if (customFrom && e.target.value && customFrom <= e.target.value) setDraft({ from: customFrom, to: e.target.value })
                  }}
                  className="flex-1 px-3 py-2 rounded-lg border border-border bg-card text-foreground text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-4">Fuso horário das datas: Horário de São Paulo</p>

            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={handleCancelar}
                className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAtualizar}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium"
              >
                Atualizar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
