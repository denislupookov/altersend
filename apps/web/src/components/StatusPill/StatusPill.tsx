import type { ReactNode } from 'react'

export interface StatusPillProps {
  tone?: 'success' | 'muted'
  icon?: ReactNode
  children: ReactNode
}

export function StatusPill({ tone = 'muted', icon, children }: StatusPillProps) {
  const success = tone === 'success'
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 ${
        success ? 'bg-success-subtle' : 'bg-surface-secondary'
      }`}
    >
      {icon}
      <span className={`text-sm font-semibold ${success ? 'text-success' : 'text-text-muted'}`}>
        {children}
      </span>
    </div>
  )
}
