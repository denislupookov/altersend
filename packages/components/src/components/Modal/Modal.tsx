import { useEffect } from 'react'
import { ArrowLeftIcon, CloseIcon } from '../../icons'
import { widthForSize } from './sizes'
import type { ModalProps } from './types'

const MODAL_Z_INDEX = 60

const openModals: symbol[] = []
let scrollLocks = 0
let overflowBeforeLock = ''

const iconButton =
  'inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-sm border-none bg-transparent p-0 text-text-muted transition-colors hover:bg-surface-primary hover:text-text-primary'

export function Modal({
  open,
  title,
  subtitle,
  size = 'md',
  closeLabel,
  backLabel,
  onClose,
  onBack,
  children
}: ModalProps) {
  useEffect(() => {
    if (!open) return

    const token = Symbol('modal')
    openModals.push(token)

    if (scrollLocks === 0) {
      overflowBeforeLock = document.body.style.overflow
      document.body.style.overflow = 'hidden'
    }
    scrollLocks += 1

    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (openModals[openModals.length - 1] !== token) return
      onClose()
    }
    window.addEventListener('keydown', onKey)

    return () => {
      window.removeEventListener('keydown', onKey)
      const index = openModals.lastIndexOf(token)
      if (index !== -1) openModals.splice(index, 1)
      scrollLocks = Math.max(0, scrollLocks - 1)
      if (scrollLocks === 0) document.body.style.overflow = overflowBeforeLock
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      aria-modal='true'
      role='dialog'
      className='fixed inset-0 flex items-center justify-center p-6'
      onClick={onClose}
      style={{
        zIndex: MODAL_Z_INDEX,
        animation: 'as-fade-in 180ms ease-out',
        backgroundColor: 'color-mix(in oklab, var(--as-color-scrim) 45%, transparent)'
      }}
    >
      <div
        className='flex max-w-full flex-col overflow-hidden rounded-2xl border border-border-primary bg-background shadow-[0_32px_64px_color-mix(in_oklab,var(--as-color-scrim)_50%,transparent)]'
        onClick={(event) => event.stopPropagation()}
        style={{
          width: widthForSize[size],
          animation: 'as-scale-in 240ms cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {(title || onBack) && (
          <div className='flex items-center gap-2 px-4 pb-3 pt-4'>
            {onBack && (
              <button
                aria-label={backLabel}
                type='button'
                onClick={onBack}
                className={`-ml-1 ${iconButton}`}
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
              aria-label={closeLabel}
              type='button'
              onClick={onClose}
              className={iconButton}
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
