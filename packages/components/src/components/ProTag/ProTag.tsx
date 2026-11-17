import { html } from 'react-strict-dom'
import { styles } from './styles'

export interface ProTagProps {
  label: string
  accessibleLabel?: string
  corner?: boolean
}

export function ProTag({ label, accessibleLabel, corner = false }: ProTagProps) {
  return (
    <html.div
      aria-label={accessibleLabel}
      role={accessibleLabel ? 'img' : undefined}
      style={[styles.tag, corner && styles.corner]}
    >
      <html.span style={[styles.label, corner && styles.cornerLabel]}>{label}</html.span>
    </html.div>
  )
}
