import type { ReactNode } from 'react'

export function SectionShell({
  title,
  action,
  backdrop,
  leading,
  children,
  footer
}: {
  title?: string
  action?: ReactNode
  backdrop?: ReactNode
  leading?: ReactNode
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className='relative flex h-full min-h-0 flex-col'>
      {backdrop}
      {(title || action || leading) && (
        <div className='relative flex shrink-0 items-center justify-between gap-3 px-6 pb-3 pt-5'>
          <div className='flex min-w-0 items-center gap-2'>
            {leading}
            <h2 className='m-0 truncate text-[16px] font-semibold text-text-primary'>{title}</h2>
          </div>
          {action}
        </div>
      )}
      <div className='relative min-h-0 flex-1 overflow-y-auto px-6 pb-6'>{children}</div>
      {footer && (
        <div className='relative shrink-0 border-t border-border-primary px-6 py-4'>{footer}</div>
      )}
    </div>
  )
}
