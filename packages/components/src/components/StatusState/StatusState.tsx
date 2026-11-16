import type { ReactNode } from 'react'
import { html } from 'react-strict-dom'
import { Badge, type BadgeTone } from '../Badge'
import { styles } from './styles'

export interface StatusStateProps {
  label: string
  title: string
  description?: string
  tone?: BadgeTone
  active?: boolean
  children?: ReactNode
}

export function StatusState({
  label,
  title,
  description,
  tone = 'neutral',
  active = false,
  children
}: StatusStateProps) {
  return (
    <html.div style={styles.wrap}>
      <Badge pill tone={tone} spinner={active} dot={!active}>
        {label}
      </Badge>
      <html.div style={styles.text}>
        <html.p style={styles.title}>{title}</html.p>
        {description ? <html.p style={styles.description}>{description}</html.p> : null}
        {children}
      </html.div>
    </html.div>
  )
}
