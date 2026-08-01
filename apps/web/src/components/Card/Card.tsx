import type { ReactNode } from 'react'

export const BLOCK_WIDTH = 'w-[620px] max-w-full'

export function Card({ children, bare = false }: { children: ReactNode; bare?: boolean }) {
  if (bare) return <div className={BLOCK_WIDTH}>{children}</div>

  return (
    <div
      className={`${BLOCK_WIDTH} rounded-2xl border border-border-primary bg-background-subtle p-4 sm:p-6`}
    >
      {children}
    </div>
  )
}
