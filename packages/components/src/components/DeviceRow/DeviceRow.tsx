import type { ReactNode } from 'react'
import type { DeviceType } from '@altersend/core'
import { html } from 'react-strict-dom'
import { CloseIcon, deviceIcon } from '../../icons'
import { styles } from './styles'

export interface DeviceRowProps {
  deviceType: DeviceType
  name: string
  badge?: ReactNode
  badgeTone?: 'neutral' | 'success'
  subtitle?: string
  subtitleVariant?: 'default' | 'active'
  isActive?: boolean
  onClick?: () => void
  onRemove?: () => void
  removeLabel?: string
  trailing?: ReactNode
}

export function DeviceRow({
  badge,
  badgeTone = 'neutral',
  deviceType,
  name,
  onRemove,
  subtitle,
  subtitleVariant = 'default',
  isActive = false,
  onClick,
  removeLabel = 'Remove device',
  trailing
}: DeviceRowProps) {
  const Icon = deviceIcon(deviceType)
  const rowStyle = [styles.row, isActive && styles.rowActive]
  const trailingContent =
    trailing ??
    (onRemove ? (
      <html.button aria-label={removeLabel} onClick={onRemove} style={styles.removeButton} type='button'>
        <CloseIcon size={16} />
      </html.button>
    ) : null)

  const inner = (
    <>
      <html.div style={styles.iconWrap}>
        <Icon size={18} />
      </html.div>
      <html.div style={styles.labels}>
        <html.div style={styles.nameRow}>
          <html.p style={styles.name}>{name}</html.p>
          {badge ? (
            <html.span style={[styles.badge, badgeTone === 'success' && styles.badgeSuccess]}>
              {badge}
            </html.span>
          ) : null}
        </html.div>
        {subtitle ? (
          <html.p style={[styles.subtitle, subtitleVariant === 'active' && styles.subtitleActive]}>
            {subtitle}
          </html.p>
        ) : null}
      </html.div>
      {trailingContent ? <html.div style={styles.trailing}>{trailingContent}</html.div> : null}
    </>
  )

  if (onClick) {
    return (
      <html.button style={[...rowStyle, styles.rowButton]} onClick={onClick} type='button'>
        {inner}
      </html.button>
    )
  }

  return <html.div style={rowStyle}>{inner}</html.div>
}
