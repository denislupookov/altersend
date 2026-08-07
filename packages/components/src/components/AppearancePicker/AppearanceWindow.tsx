import { html } from 'react-strict-dom'
import type { ThemeColors } from '../../theme'
import { styles } from './styles'

export function AppearanceWindow({ colors }: { colors: ThemeColors }) {
  return (
    <html.div style={[styles.window, styles.fill(colors.colorBackgroundDeep)]}>
      <html.div style={styles.windowSidebar} />
      <html.div style={[styles.windowContent, styles.fill(colors.colorBackgroundSubtle)]}>
        <html.div style={[styles.bar, styles.barMedium, styles.fill(colors.colorBorderStrong)]} />
        <html.div style={[styles.bar, styles.barWide, styles.fill(colors.colorBorderStrong)]} />
        <html.div style={[styles.bar, styles.barNarrow, styles.fill(colors.colorBorderStrong)]} />
      </html.div>
    </html.div>
  )
}
