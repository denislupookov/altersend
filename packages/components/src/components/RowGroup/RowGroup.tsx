import type { ReactNode } from 'react'
import { html } from 'react-strict-dom'
import { styles } from './styles'

export interface RowGroupProps {
  title?: string
  children: ReactNode
}

export function RowGroup({ title, children }: RowGroupProps) {
  return (
    <html.div style={styles.section}>
      {title ? <html.p style={styles.heading}>{title}</html.p> : null}
      <html.div style={styles.card}>{children}</html.div>
    </html.div>
  )
}
