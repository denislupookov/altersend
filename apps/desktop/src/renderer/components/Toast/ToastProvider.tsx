import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode
} from 'react'
import { AlertCircleIcon, CheckIcon } from '@altersend/components/icons'

interface ShowToastInput {
  title: string
  hint?: string
  durationMs?: number
  variant?: 'success' | 'error'
}

interface ToastPayload extends ShowToastInput {
  id: number
}

interface ToastContextValue {
  show: (input: ShowToastInput) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return ctx
}

const DEFAULT_DURATION = 3000

export function ToastProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<ToastPayload | null>(null)
  const nextId = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const show = useCallback((input: ShowToastInput) => {
    nextId.current += 1
    const id = nextId.current
    setCurrent({ ...input, id })
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setCurrent((prev) => (prev && prev.id === id ? null : prev))
    }, input.durationMs ?? DEFAULT_DURATION)
  }, [])

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    },
    []
  )

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {current && (
        <div className='pointer-events-none fixed inset-x-0 top-6 z-[100] flex justify-center px-6'>
          <div
            key={current.id}
            className='pointer-events-auto flex max-w-[420px] items-center gap-3 rounded-[12px] border border-border-primary bg-surface-primary px-4 py-3 shadow-[0_12px_32px_color-mix(in_oklab,var(--as-color-scrim)_45%,transparent)]'
            style={{ animation: 'as-toast-in 220ms cubic-bezier(0.16, 1, 0.3, 1)' }}
          >
            <span
              className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full text-text-primary ${current.variant === 'error' ? 'bg-danger' : 'bg-success'}`}
            >
              {current.variant === 'error' ? (
                <AlertCircleIcon size={11} />
              ) : (
                <CheckIcon size={11} />
              )}
            </span>
            <div className='flex flex-col gap-0.5'>
              <span className='text-[13px] font-semibold text-text-primary'>{current.title}</span>
              {current.hint && <span className='text-[12px] text-text-muted'>{current.hint}</span>}
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  )
}
