import type { ReactNode } from 'react'

export function CardFooter({
  children,
  align = 'between'
}: {
  children: ReactNode
  align?: 'between' | 'end'
}) {
  const justify = align === 'end' ? 'sm:justify-end' : 'sm:justify-between'
  return (
    <div
      className={`mt-5 flex flex-col items-stretch gap-3 border-border-primary pt-5 sm:flex-row sm:items-center sm:gap-3.5 sm:border-t ${justify}`}
    >
      {children}
    </div>
  )
}
