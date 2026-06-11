import { useEffect } from 'react'
import { buildJoinUrl } from '@altersend/domain'
import { CloseIcon } from '@altersend/components/icons'
import { useTranslation } from '@altersend/locales'
import { QRCode } from './QRCode'

interface QRModalProps {
  topic: string
  open: boolean
  onClose: () => void
}

export function QRModal({ topic, open, onClose }: QRModalProps) {
  const { t } = useTranslation(['send', 'common'])
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open || !topic) return null

  return (
    <div
      aria-modal='true'
      className='fixed inset-0 z-50 flex items-center justify-center p-6'
      onClick={onClose}
      role='dialog'
      style={{
        animation: 'as-fade-in 180ms ease-out',
        backgroundColor: 'color-mix(in oklab, var(--as-color-scrim) 60%, transparent)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)'
      }}
    >
      <div
        className='w-full max-w-[360px] overflow-hidden rounded-[20px] border border-border-primary bg-background-subtle shadow-[0_32px_64px_color-mix(in_oklab,var(--as-color-scrim)_60%,transparent)]'
        onClick={(event) => event.stopPropagation()}
        style={{ animation: 'as-scale-in 240ms cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        <div className='relative flex items-start justify-center px-10 pb-1 pt-5'>
          <div className='text-center'>
            <span className='block text-[17px] font-semibold text-text-primary'>
              {t('send:connection.scanToConnect')}
            </span>
            <p className='m-0 mt-1 text-[12px] leading-relaxed text-text-muted'>
              {t('send:connection.qrModalDescription')}
            </p>
          </div>
          <button
            aria-label={t('common:actions.close')}
            className='absolute right-4 top-4 inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-none bg-transparent p-0 text-text-muted transition-colors hover:bg-surface-secondary hover:text-text-primary'
            onClick={onClose}
            style={{ appearance: 'none' }}
            type='button'
          >
            <CloseIcon size={14} />
          </button>
        </div>

        <div className='flex justify-center px-6 pb-6 pt-4'>
          <div className='overflow-hidden rounded-[12px]'>
            <QRCode
              imageLabel={t('send:connection.qrCodeLabel')}
              loadingLabel={t('send:connection.generating')}
              size={240}
              value={buildJoinUrl(topic)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
