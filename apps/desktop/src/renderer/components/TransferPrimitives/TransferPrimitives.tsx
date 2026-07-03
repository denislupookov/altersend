import type { ReactNode } from 'react'
import { Spinner } from '@altersend/components'

interface TransferCardProps {
  title: string
  description: string
  children: ReactNode
  footer?: ReactNode
  badge?: ReactNode
  headerRight?: ReactNode
}

type TransferTone = 'neutral' | 'success' | 'critical'

interface TransferStatusPanelProps {
  title: string
  description: string
  tone?: TransferTone
  loading?: boolean
}

function dotToneClass(tone: TransferTone): string {
  if (tone === 'success') return 'bg-success'
  if (tone === 'critical') return 'bg-danger'
  return 'bg-text-muted'
}

export function TransferCardFrame({
  children,
  description,
  footer,
  title,
  badge,
  headerRight
}: TransferCardProps) {
  const hasHeader = !!(title || badge)
  return (
    <div className='flex h-full min-h-0 w-full flex-col'>
      {hasHeader ? (
        <div className='shrink-0'>
          {badge ? <div className='mb-4'>{badge}</div> : null}
          <div className='flex items-center justify-between gap-4'>
            <div className='max-w-[720px]'>
              <h2 className='m-0 text-[23px] font-semibold leading-[1.2] tracking-[-0.02em] text-text-primary'>
                {title}
              </h2>
              {description ? (
                <p className='m-0 mt-1 text-[14px] leading-6 text-text-secondary'>{description}</p>
              ) : null}
            </div>
            {headerRight ? <div className='shrink-0'>{headerRight}</div> : null}
          </div>
        </div>
      ) : null}

      <div className={`min-h-0 flex-1 overflow-hidden ${hasHeader ? 'mt-8' : ''}`}>{children}</div>

      {footer ? <div className='mt-6 shrink-0'>{footer}</div> : null}
    </div>
  )
}

export function TransferActionGroup({ children }: { children: ReactNode }) {
  return <div className='flex items-center justify-end gap-2.5'>{children}</div>
}

export function TransferStatusPanel({
  description,
  title,
  tone = 'neutral',
  loading = false
}: TransferStatusPanelProps) {
  return (
    <div className='w-full rounded-[12px] border border-border-primary bg-background-subtle px-4 py-4'>
      <div className='flex items-start gap-3'>
        {loading ? (
          <span className='mt-0.5 shrink-0 text-info'>
            <Spinner size={15} />
          </span>
        ) : (
          <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${dotToneClass(tone)}`} />
        )}
        <div className='min-w-0'>
          <p className='m-0 text-[14px] font-medium text-text-primary'>{title}</p>
          <p className='mt-1 text-[13px] leading-6 text-text-secondary'>{description}</p>
        </div>
      </div>
    </div>
  )
}
