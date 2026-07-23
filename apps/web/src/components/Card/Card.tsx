import type { ReactNode } from 'react'

export const BLOCK_WIDTH = 'w-[620px] max-w-full'

export function Card({ children }: { children: ReactNode }) {
  return (
    <div
      className={`${BLOCK_WIDTH} rounded-2xl border border-border-primary bg-background-subtle p-6`}
    >
      {children}
    </div>
  )
}
