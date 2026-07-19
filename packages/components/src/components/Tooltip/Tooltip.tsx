import { html } from 'react-strict-dom'
import { styles } from './styles'

export type TooltipSide = 'left' | 'right' | 'top' | 'bottom'

export interface TooltipProps {
  label: string
  visible: boolean
  side?: TooltipSide
}

const sideStyle = {
  left: styles.left,
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
