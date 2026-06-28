import type { ReactNode } from 'react'

interface TransferCardProps {
  title: string
  description: string
  children: ReactNode
  footer?: ReactNode
  badge?: ReactNode
}

interface TransferStatusPanelProps {
  title: string
  description: string
  tone?: 'neutral' | 'success' | 'critical'
}

export function TransferCardFrame({
  children,
  description,
  footer,
  title,
  badge
}: TransferCardProps) {
  const hasHeader = !!(title || badge)
  return (
    <div className='flex h-full min-h-0 w-full flex-col rounded-[12px] border border-border-primary bg-background-subtle px-6 py-6'>
      {hasHeader ? (
        <div className='shrink-0'>
          {badge ? <div className='mb-4'>{badge}</div> : null}
          <div className='max-w-[720px]'>
            <h2 className='m-0 text-[22px] font-bold leading-[1.2] tracking-[-0.015em] text-text-primary'>
              {title}
            </h2>
            {description ? (
              <p className='m-0 mt-1 text-[14px] leading-6 text-text-secondary'>{description}</p>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className={`min-h-0 flex-1 overflow-hidden ${hasHeader ? 'mt-5' : ''}`}>{children}</div>

      {footer ? <div className='mt-3 shrink-0 pt-1'>{footer}</div> : null}
    </div>
  )
}

export function TransferActionGroup({ children }: { children: ReactNode }) {
  return <div className='flex items-center justify-end gap-2.5'>{children}</div>
}

export function TransferStatusPanel({
  description,
  title,
  tone = 'neutral'
}: TransferStatusPanelProps) {
  const dotToneClass =
    tone === 'success' ? 'bg-success' : tone === 'critical' ? 'bg-red-500' : 'bg-text-muted'

  return (
    <div className='w-full rounded-[12px] border border-border-primary bg-background-subtle px-4 py-4'>
      <div className='flex items-start gap-3'>
        <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${dotToneClass}`} />
        <div className='min-w-0'>
          <p className='m-0 text-[14px] font-medium text-text-primary'>{title}</p>
          <p className='mt-1 text-[13px] leading-6 text-text-secondary'>{description}</p>
        </div>
      </div>
    </div>
  )
}
