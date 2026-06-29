import type { ReactNode } from 'react'
import { html } from 'react-strict-dom'
import { ChevronRightIcon, CloseIcon } from '../../icons'
import { fileTypeColors, useTheme } from '../../theme'
import { FileKindIcon, getFileKind } from './fileKinds'
import { styles } from './styles'
import { formatFileSize } from '@altersend/domain'

export type LinkRowStatusTone = 'muted' | 'active' | 'success'
export type LinkRowProgressState = 'waiting' | 'uploading' | 'completed'

interface LinkRowBaseProps {
  icon?: ReactNode
  iconBackground?: string
  label: string
  size?: number
  subtitle?: string
  subtitleTone?: 'muted' | 'success' | 'danger' | 'info'
  description?: string
  isActive?: boolean
  isFirst?: boolean
  trailing?: ReactNode
  onPress?: () => void
  isLast?: boolean
  file?: boolean
  compact?: boolean
  bare?: boolean
  standalone?: boolean
  disabled?: boolean
  status?: { label: string; tone?: LinkRowStatusTone }
  progress?: LinkRowProgressState
  progressPercent?: number
}

export type LinkRowProps =
  | (LinkRowBaseProps & {
      onRemove: () => void
      removeLabel: string
    })
  | (LinkRowBaseProps & {
      onRemove?: undefined
      removeLabel?: undefined
    })

export interface LinkCardProps {
  children: ReactNode
}

const subtitleToneStyle = {
  muted: styles.subtitleMuted,
  success: styles.subtitleSuccess,
  danger: styles.subtitleDanger,
  info: styles.subtitleInfo
} as const

const statusToneStyle = {
  muted: styles.statusMuted,
  active: styles.statusActive,
  success: styles.statusSuccess
} as const

const progressStateStyle = {
  waiting: styles.progressWaiting,
  uploading: styles.progressUploading,
  completed: styles.progressCompleted
} as const

export function LinkRow({
  icon,
  iconBackground,
  label,
  size,
  subtitle,
  subtitleTone = 'muted',
  description,
  isActive,
  isFirst = false,
  trailing,
  onPress,
  isLast,
  file = false,
  compact = false,
  bare = false,
  standalone = false,
  disabled = false,
  status,
  progress,
  progressPercent,
  onRemove,
  removeLabel
}: LinkRowProps) {
  const { theme } = useTheme()
  const kind = file ? getFileKind(label) : null
  const fileTone = kind ? fileTypeColors[kind] : null
  const renderIcon = (): ReactNode => {
    if (icon != null) return icon
    if (!kind) return null
    return (
      <FileKindIcon
        kind={kind}
        size={compact ? 16 : 20}
        color={disabled ? theme.colors.colorTextMuted : fileTone?.fg}
      />
    )
  }

  const resolveIconBoxBackground = (): string | undefined => {
    if (disabled) return theme.colors.colorBackgroundSubtle
    return iconBackground ?? fileTone?.bg
  }

  const resolveSubtitle = (): string | undefined => {
    if (subtitle != null) return subtitle
    if (description != null) return description
    if (typeof size === 'number') return formatFileSize(size)
    return undefined
  }

  const renderTrailing = (): ReactNode => {
    if (disabled) return null
    if (trailing !== undefined) return trailing
    if (onRemove) {
      return (
        <html.button
          aria-label={removeLabel}
          onClick={onRemove}
          style={[styles.removeButton, compact && styles.removeButtonCompact]}
          type='button'
        >
          <CloseIcon size={compact ? 14 : 16} />
        </html.button>
      )
    }
    if (onPress) return <ChevronRightIcon size={14} color={theme.colors.colorTextMuted} />
    return null
  }

  const iconNode = renderIcon()
  const iconBoxBackground = resolveIconBoxBackground()
  const rowSubtitle = resolveSubtitle()
  const trailingContent = renderTrailing()

  const clampedProgressPercent =
    typeof progressPercent === 'number' ? Math.max(0, Math.min(100, progressPercent)) : undefined

  return (
    <>
      <html.div
        aria-disabled={disabled || undefined}
        onClick={disabled ? undefined : onPress}
        role={onPress && !disabled ? 'button' : undefined}
        style={[
          styles.row,
          compact && styles.rowCompact,
          standalone && styles.rowStandalone,
          bare && styles.rowBare,
          bare && isFirst && styles.rowBareFirst,
          onPress && !disabled && styles.rowPressable,
          isActive && styles.rowActive
        ]}
        tabIndex={onPress && !disabled ? 0 : undefined}
      >
        {iconNode ? (
          <html.div
            style={[
              styles.iconBox,
              compact && styles.iconBoxCompact,
              iconBoxBackground ? styles.iconBoxCustom(iconBoxBackground) : null
            ]}
          >
            {iconNode}
          </html.div>
        ) : null}
        <html.div style={styles.content}>
          <html.div style={styles.metaRow}>
            <html.div style={styles.text}>
              <html.p
                style={[
                  styles.label,
                  disabled && styles.labelDisabled,
                  compact && styles.labelCompact
                ]}
              >
                {label}
              </html.p>
              {rowSubtitle ? (
                <html.p
                  style={[
                    styles.subtitle,
                    subtitleToneStyle[subtitleTone],
                    compact && styles.subtitleCompact
                  ]}
                >
                  {rowSubtitle}
                </html.p>
              ) : null}
            </html.div>

            {status ? (
              <html.div style={styles.statusGroup}>
                <html.div style={[styles.statusDot, statusToneStyle[status.tone ?? 'muted']]} />
                <html.p style={styles.statusLabel}>{status.label}</html.p>
              </html.div>
            ) : null}
          </html.div>

          {clampedProgressPercent !== undefined ? (
            <html.div style={styles.progressTrack}>
              <html.div
                style={[styles.progressBar, styles.progressDynamic(clampedProgressPercent)]}
              />
            </html.div>
          ) : progress ? (
            <html.div style={styles.progressTrack}>
              <html.div style={[styles.progressBar, progressStateStyle[progress]]} />
            </html.div>
          ) : null}
        </html.div>
        {trailingContent ? <html.div style={styles.trailing}>{trailingContent}</html.div> : null}
      </html.div>
      {!isLast && !bare && !standalone ? <html.div style={styles.divider} /> : null}
    </>
  )
}

export function LinkCard({ children }: LinkCardProps) {
  return <html.div style={styles.card}>{children}</html.div>
}
