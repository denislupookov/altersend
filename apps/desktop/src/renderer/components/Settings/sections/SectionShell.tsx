import type { ReactNode } from 'react'

export function SectionShell({
  title,
  action,
  children,
  footer
}: {
  title: string
  action?: ReactNode
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className='flex h-full min-h-0 flex-col'>
      <div className='flex shrink-0 items-center justify-between gap-3 px-6 pb-3 pt-5'>
        <h2 className='m-0 text-[16px] font-semibold text-text-primary'>{title}</h2>
        {action}
      </div>
      <div className='min-h-0 flex-1 overflow-y-auto px-6 pb-6'>{children}</div>
      {footer && (
        <div className='relative shrink-0 border-t border-border-primary px-6 py-4'>{footer}</div>
      )}
    </div>
  )
}
