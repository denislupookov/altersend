import { html } from 'react-strict-dom'
import { styles } from './styles'

export interface SegmentedProgressProps {
  count: number
  activeIndex: number
  progress?: number
}

const fillFor = (position: number, index: number) =>
  Math.max(0, Math.min(1, 1 - Math.abs(position - index))) * 100

export function SegmentedProgress({ count, activeIndex, progress }: SegmentedProgressProps) {
  const position = progress ?? activeIndex

  return (
    <html.div style={styles.row} aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <html.div key={i} style={styles.segment}>
          <html.div style={[styles.fill, styles.fillWidth(fillFor(position, i))]} />
        </html.div>
      ))}
    </html.div>
  )
}
