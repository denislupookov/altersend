import { cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react'
import { html } from 'react-strict-dom'
import { WaitingRadar } from '../WaitingRadar'
import { useTheme } from '../../theme'
import { styles } from './styles'

export interface WaitingStateProps {
  icon: ReactNode
  title: string
  description?: string
  size?: number
}

export function WaitingState({ icon, title, description, size = 140 }: WaitingStateProps) {
  const { theme } = useTheme()
  const c = theme.colors

  const iconEl = isValidElement(icon)
    ? cloneElement(icon as ReactElement<{ color?: string }>, { color: c.colorInfo })
    : icon

  return (
    <html.div style={styles.wrap}>
      <WaitingRadar size={size} color={c.colorInfo} pulsing icon={iconEl} />
      <html.div style={styles.text}>
        <html.p style={styles.title}>{title}</html.p>
        {description ? <html.p style={styles.description}>{description}</html.p> : null}
      </html.div>
    </html.div>
  )
}
