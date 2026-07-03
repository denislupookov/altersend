import { useEffect, type ReactNode } from 'react'
import { ArrowLeftIcon, CloseIcon } from '@altersend/components/icons'
import { useTranslation } from '@altersend/locales'

interface ModalProps {
  open: boolean
  title?: string
  subtitle?: string
  width?: number
  onClose: () => void
  onBack?: () => void
  children: ReactNode
}

export function Modal({
  open,
  title,
  subtitle,
  width = 440,
  onClose,
  onBack,
  children
}: ModalProps) {
  const { t } = useTranslation(['common'])
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)

    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      aria-modal='true'
      role='dialog'
      className='fixed inset-0 z-[60] flex items-center justify-center p-6'
      onClick={onClose}
      style={{
        animation: 'as-fade-in 180ms ease-out',
        backgroundColor: 'color-mix(in oklab, var(--as-color-scrim) 45%, transparent)'
      }}
    >
      <div
        className='flex max-w-full flex-col overflow-hidden rounded-[16px] border border-border-primary bg-background shadow-[0_32px_64px_color-mix(in_oklab,var(--as-color-scrim)_50%,transparent)]'
        onClick={(e) => e.stopPropagation()}
        style={{ width, animation: 'as-scale-in 240ms cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        {(title || onBack) && (
          <div className='flex items-center gap-2 px-4 pb-3 pt-4'>
            {onBack && (
              <button
                aria-label={t('common:actions.back')}
                type='button'
                onClick={onBack}
                className='-ml-1 inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-[8px] border-none bg-transparent p-0 text-text-muted transition-colors hover:bg-surface-primary hover:text-text-primary'
                style={{ appearance: 'none' }}
              >
                <ArrowLeftIcon size={16} />
              </button>
            )}
            <div className='min-w-0 flex-1'>
              <span className='block text-[16px] font-bold text-text-primary'>{title}</span>
              {subtitle && (
                <span className='mt-0.5 block text-[13px] leading-snug text-text-muted'>
                  {subtitle}
                </span>
              )}
            </div>
            <button
              aria-label={t('common:actions.close')}
              type='button'
              onClick={onClose}
              className='inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-[8px] border-none bg-transparent p-0 text-text-muted transition-colors hover:bg-surface-primary hover:text-text-primary'
              style={{ appearance: 'none' }}
            >
              <CloseIcon size={14} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
