import { html } from 'react-strict-dom'
import { styles } from './styles'

export type TooltipSide = 'right' | 'top' | 'bottom'

export interface TooltipProps {
  label: string
  visible: boolean
  side?: TooltipSide
}

const sideStyle = {
  right: styles.right,
  top: styles.top,
  bottom: styles.bottom
} as const

export function Tooltip({ label, visible, side = 'top' }: TooltipProps) {
  return (
    <html.div
      role='tooltip'
      style={[styles.layer, sideStyle[side], visible && styles.layerVisible]}
    >
      <html.span style={styles.tooltip}>{label}</html.span>
    </html.div>
  )
}
