import type { ReactNode } from 'react'

export function CardFooter({ children }: { children: ReactNode }) {
  return (
    <div className='mt-5 flex items-center justify-between gap-3.5 border-t border-border-primary pt-5'>
      {children}
    </div>
  )
}
