import type { ReactNode } from 'react'
import { html } from 'react-strict-dom'
import { CloseIcon } from '../../icons'
import { fileTypeColors, useTheme } from '../../theme'
import { FileKindIcon, getFileKind } from '../TransferFileRow/fileKinds'
import { styles } from './styles'
import { formatFileSize } from '../../utils/formatFileSize'

export type FileRowStatusTone = 'muted' | 'active' | 'success'
export type FileRowProgressState = 'waiting' | 'uploading' | 'completed'

interface SendFileListRowBaseProps {
  name: string
  size?: number
  description?: string
  isFirst?: boolean
  compact?: boolean
  bare?: boolean
  disabled?: boolean
  status?: { label: string; tone?: FileRowStatusTone }
  progress?: FileRowProgressState
  progressPercent?: number
}

export type SendFileListRowProps =
  | (SendFileListRowBaseProps & {
      onRemove: () => void
      removeLabel: string
      trailing?: ReactNode
    })
  | (SendFileListRowBaseProps & {
      onRemove?: undefined
      removeLabel?: undefined
      trailing?: ReactNode
    })

const THUMB_STYLE_BY_KIND = {
  image: styles.thumbImage,
  video: styles.thumbVideo,
  pdf: styles.thumbPdf,
  audio: styles.thumbAudio,
  archive: styles.thumbArchive,
  app: styles.thumbApp,
  code: styles.thumbCode,
  generic: styles.thumbGeneric
} as const

const STATUS_STYLE_BY_TONE = {
  muted: styles.statusMuted,
  active: styles.statusActive,
  success: styles.statusSuccess
} as const

const PROGRESS_STYLE_BY_STATE = {
  waiting: styles.progressWaiting,
  uploading: styles.progressUploading,
  completed: styles.progressCompleted
} as const

export function SendFileListRow({
  name,
  size,
  description,
  compact = false,
  bare = false,
  isFirst = false,
  disabled = false,
  onRemove,
  removeLabel,
  trailing,
  status,
  progress,
  progressPercent
}: SendFileListRowProps) {
  const { theme } = useTheme()
  const kind = getFileKind(name)
  const iconSize = compact ? 16 : 20
  const iconColor = disabled ? theme.colors.colorTextMuted : fileTypeColors[kind].fg

  return (
    <html.div
      style={[
        styles.row,
        compact && styles.rowCompact,
        bare && styles.rowBare,
        bare && isFirst && styles.rowBareFirst
      ]}
    >
      <html.div
        style={[
          styles.thumb,
          disabled ? styles.thumbDisabled : THUMB_STYLE_BY_KIND[kind],
          compact && styles.thumbCompact
        ]}
      >
        <FileKindIcon kind={kind} size={iconSize} color={iconColor} />
      </html.div>

      <html.div style={styles.content}>
        <html.div style={styles.metaRow}>
          <html.div style={styles.nameBlock}>
            <html.p
              style={[styles.name, disabled && styles.nameDisabled, compact && styles.nameCompact]}
            >
              {name}
            </html.p>
            {description ? (
              <html.p style={[styles.size, compact && styles.sizeCompact]}>{description}</html.p>
            ) : typeof size === 'number' ? (
              <html.p style={[styles.size, compact && styles.sizeCompact]}>
                {formatFileSize(size)}
              </html.p>
            ) : null}
          </html.div>

          {status ? (
            <html.div style={styles.statusGroup}>
              <html.div style={[styles.statusDot, STATUS_STYLE_BY_TONE[status.tone ?? 'muted']]} />
              <html.p style={styles.statusLabel}>{status.label}</html.p>
            </html.div>
          ) : null}
        </html.div>

        {typeof progressPercent === 'number' ? (
          <html.div style={styles.progressTrack}>
            <html.div
              style={[
                styles.progressBar,
                styles.progressDynamic(Math.max(0, Math.min(100, progressPercent)))
              ]}
            />
          </html.div>
        ) : progress ? (
          <html.div style={styles.progressTrack}>
            <html.div style={[styles.progressBar, PROGRESS_STYLE_BY_STATE[progress]]} />
          </html.div>
        ) : null}
      </html.div>

      {disabled
        ? null
        : (trailing ??
          (onRemove ? (
            <html.button
              aria-label={removeLabel}
              onClick={onRemove}
              style={[styles.removeButton, compact && styles.removeButtonCompact]}
              type='button'
            >
              <CloseIcon size={compact ? 14 : 16} />
            </html.button>
          ) : null))}
    </html.div>
  )
}
