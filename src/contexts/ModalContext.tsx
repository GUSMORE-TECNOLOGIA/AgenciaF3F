import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from 'react'

export type ModalVariant = 'default' | 'danger' | 'success' | 'warning'

type BaseModalOptions = {
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: ModalVariant
}

type PromptOptions = BaseModalOptions & {
  defaultValue?: string
  placeholder?: string
  inputType?: 'text' | 'date' | 'email'
}

type ModalType = 'alert' | 'confirm' | 'prompt'

type ModalState = (BaseModalOptions | PromptOptions) & {
  type: ModalType
}

type ModalResult = boolean | string | null

type ModalContextValue = {
  confirm: (options: BaseModalOptions) => Promise<boolean>
  alert: (options: BaseModalOptions) => Promise<void>
  prompt: (options: PromptOptions) => Promise<string | null>
}

const ModalContext = createContext<ModalContextValue | null>(null)

const DEFAULT_TITLES: Record<ModalType, string> = {
  alert: 'Aviso',
  confirm: 'Confirmação',
  prompt: 'Informação',
}

function resolveConfirmLabel(type: ModalType, variant?: ModalVariant, label?: string) {
  if (label) return label
  if (type === 'alert') return 'Ok'
  if (variant === 'danger') return 'Excluir'
  return 'Confirmar'
}

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [modal, setModal] = useState<ModalState | null>(null)
  const resolverRef = useRef<((value: ModalResult) => void) | null>(null)

  const confirm = useCallback((options: BaseModalOptions) => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current = (value) => resolve(value === true)
      setModal({ type: 'confirm', ...options })
    })
  }, [])

  const alert = useCallback((options: BaseModalOptions) => {
    return new Promise<void>((resolve) => {
      resolverRef.current = () => resolve()
      setModal({ type: 'alert', ...options })
    })
  }, [])

  const prompt = useCallback((options: PromptOptions) => {
    return new Promise<string | null>((resolve) => {
      resolverRef.current = (value) => resolve(value === null ? null : String(value))
      setModal({ type: 'prompt', ...options })
    })
  }, [])

  const handleClose = useCallback(
    (result: ModalResult) => {
      const resolver = resolverRef.current
      resolverRef.current = null
      setModal(null)
      resolver?.(result)
    },
    [setModal]
  )

  const contextValue = useMemo(() => ({ confirm, alert, prompt }), [confirm, alert, prompt])

  return (
    <ModalContext.Provider value={contextValue}>
      {children}
      {modal ? <ModalOverlay modal={modal} onClose={handleClose} /> : null}
    </ModalContext.Provider>
  )
}

function ModalOverlay({ modal, onClose }: { modal: ModalState; onClose: (result: ModalResult) => void }) {
  const messageId = useId()
  const variant = modal.variant ?? 'default'
  const isDanger = variant === 'danger'
  const isPrompt = modal.type === 'prompt'
  const promptOptions = modal.type === 'prompt' ? (modal as PromptOptions) : null
  const [value, setValue] = useState(promptOptions?.defaultValue ?? '')

  const title = modal.title?.trim() || DEFAULT_TITLES[modal.type]
  const confirmLabel = resolveConfirmLabel(modal.type, variant, modal.confirmLabel)
  const cancelLabel = modal.cancelLabel || 'Cancelar'

  useEffect(() => {
    if (promptOptions) {
      setValue(promptOptions.defaultValue ?? '')
    }
  }, [promptOptions])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-describedby={messageId}
        className="w-full max-w-md rounded-lg bg-card p-6 shadow-lg"
      >
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <div
          id={messageId}
          className="mt-3 whitespace-pre-line text-sm text-muted-foreground"
        >
          {modal.message}
        </div>
        {isPrompt ? (
          <input
            type={promptOptions?.inputType || 'text'}
            value={value}
            placeholder={promptOptions?.placeholder}
            onChange={(event) => setValue(event.target.value)}
            className="mt-4 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        ) : null}
        <div className="mt-6 flex items-center justify-end gap-3">
          {modal.type !== 'alert' ? (
            <button
              type="button"
              onClick={() => onClose(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-muted"
            >
              {cancelLabel}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => onClose(isPrompt ? value : true)}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors ${
              isDanger
                ? 'bg-red-600 hover:bg-red-700'
                : variant === 'success'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : variant === 'warning'
                    ? 'bg-amber-500 hover:bg-amber-600'
                    : 'bg-primary hover:bg-primary/90'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export function useModal() {
  const context = useContext(ModalContext)
  if (!context) {
    throw new Error('useModal deve ser usado dentro de ModalProvider')
  }
  return context
}
