import { html } from 'react-strict-dom'
import { FileKindIcon, getFileKind } from './fileKinds'
import { styles } from './styles'
import { formatFileSize } from '@altersend/domain'

type DivElementProps = Parameters<typeof html.div>[0]

export interface TransferFileRowProps extends Omit<DivElementProps, 'children' | 'style'> {
  name: string
  size?: number
  isLast?: boolean
  statusLabel?: string
  statusTone?: 'muted' | 'active' | 'success'
  progressState?: 'hidden' | 'waiting' | 'uploading' | 'completed'
}

export function TransferFileRow({
  isLast = false,
  name,
  progressState = 'hidden',
  size,
  statusLabel,
  statusTone = 'muted',
  ...props
}: TransferFileRowProps) {
  const fileKind = getFileKind(name)

  return (
    <html.div {...props} style={[styles.row, !isLast && styles.rowBorder]}>
      <html.div style={styles.rowContent}>
        <html.div style={styles.iconBox}>
          <FileKindIcon kind={fileKind} />
        </html.div>

        <html.div style={styles.content}>
          <html.div style={styles.metaRow}>
            <html.div style={styles.nameBlock}>
              <html.p style={styles.name}>{name}</html.p>
              {typeof size === 'number' ? (
                <html.p style={styles.size}>{formatFileSize(size)}</html.p>
              ) : null}
            </html.div>

            {statusLabel ? (
              <html.div style={styles.status}>
                <html.div
                  style={[
                    styles.statusDot,
                    statusTone === 'success'
                      ? styles.statusSuccess
                      : statusTone === 'active'
                        ? styles.statusActive
                        : styles.statusMuted
                  ]}
                />
                <html.p style={styles.statusLabel}>{statusLabel}</html.p>
              </html.div>
            ) : null}
          </html.div>

          {progressState !== 'hidden' ? (
            <html.div style={styles.progressTrack}>
              <html.div
                style={[
                  styles.progressBar,
                  progressState === 'completed'
                    ? styles.progressCompleted
                    : progressState === 'uploading'
                      ? styles.progressUploading
                      : styles.progressWaiting
                ]}
              />
            </html.div>
          ) : null}
        </html.div>
      </html.div>
    </html.div>
  )
}
