import { html } from 'react-strict-dom'
import { Button } from '../Button'
import { styles } from './styles'

export interface CrashScreenProps {
  error: Error
  onRestart: () => void
  title: string
  description?: string
  restartLabel: string
}

export function CrashScreen({
  error,
  onRestart,
  title,
  description,
  restartLabel
}: CrashScreenProps) {
  return (
    <html.div style={styles.root}>
      <html.div style={styles.card}>
        <html.h1 style={styles.title}>{title}</html.h1>
        {description ? <html.p style={styles.body}>{description}</html.p> : null}
        <html.p style={styles.detail}>{error.message}</html.p>
        <Button onClick={onRestart} size='sm' variant='primary'>
          {restartLabel}
        </Button>
      </html.div>
    </html.div>
  )
}
