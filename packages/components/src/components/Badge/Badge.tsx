import { isValidElement, type ReactNode } from 'react'
import { html } from 'react-strict-dom'
import { useTheme } from '../../theme'
import type { ThemeColors } from '../../theme/types'
import { Spinner } from '../Spinner'
import { styles } from './styles'

type DivElementProps = Parameters<typeof html.div>[0]

export type BadgeTone = 'neutral' | 'muted' | 'accent' | 'success' | 'danger' | 'info' | 'warning'

export interface BadgeProps extends Omit<DivElementProps, 'children' | 'style'> {
  children: ReactNode
  dot?: boolean
  spinner?: boolean
  icon?: ReactNode
  pill?: boolean
  tone?: BadgeTone
}

const TONE_COLOR: Record<BadgeTone, keyof ThemeColors> = {
  neutral: 'colorTextSecondary',
  muted: 'colorTextMuted',
  accent: 'colorAccent',
  success: 'colorSuccess',
  danger: 'colorDanger',
  info: 'colorInfo',
  warning: 'colorWarning'
}

export function Badge({
  children,
  dot = false,
  spinner = false,
  icon,
  pill = false,
  tone = 'neutral',
  ...props
}: BadgeProps) {
  const { theme } = useTheme()
  const toneColor = theme.colors[TONE_COLOR[tone]]

  const renderLead = (): ReactNode => {
    if (isValidElement(icon)) return icon
    if (spinner) return <Spinner size={12} color={toneColor} />
    if (dot) return <html.div aria-hidden={true} style={[styles.dot, styles.dotColor(toneColor)]} />
    return null
  }

  return (
    <html.div {...props} style={[styles.root, styles[tone], pill && styles.pill]}>
      {renderLead()}
      <html.span style={styles.label}>{children}</html.span>
    </html.div>
  )
}
