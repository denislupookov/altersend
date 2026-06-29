import { cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react'
import { css, html } from 'react-strict-dom'
import { usePressState } from '../../hooks/usePressState'
import { useTheme } from '../../theme'

export interface ActionRowProps {
  icon: ReactNode
  title: string
  subtitle?: string
  onClick: () => void
  compact?: boolean
  tone?: 'default' | 'danger'
}

const styles = css.create({
  row: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    paddingTop: 14,
    paddingBottom: 14,
    paddingLeft: 20,
    paddingRight: 20,
    cursor: 'pointer',
    userSelect: 'none',
    borderWidth: 0,
    backgroundColor: 'transparent',
    transitionDuration: '120ms',
    transitionProperty: 'background-color',
    transitionTimingFunction: 'ease'
  },
  rowCompact: {
    gap: 12,
    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: 16,
    paddingRight: 16
  },
  iconSlot: {
    width: 16,
    height: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  iconSlotCompact: { width: 14, height: 18 },
  textGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    flex: 1
  },
  textGroupCompact: { gap: 2 },
  title: {
    fontSize: 15,
    lineHeight: 1.33,
    fontWeight: '600'
  },
  titleCompact: { fontSize: 13, lineHeight: 1.38 },
  subtitle: {
    fontSize: 13,
    lineHeight: 1.5
  },
  subtitleCompact: { fontSize: 11 }
})

export function ActionRow({
  icon,
  title,
  subtitle,
  onClick,
  compact = false,
  tone = 'default'
}: ActionRowProps) {
  const { theme } = useTheme()
  const c = theme.colors
  const { isHovered, isPressed, pressHandlers } = usePressState()

  const isDanger = tone === 'danger'
  const contentColor = isDanger ? c.colorDanger : c.colorTextPrimary
  const iconSize = compact ? 14 : 15
  const iconEl = isValidElement(icon)
    ? cloneElement(icon as ReactElement<{ color?: string; size?: number }>, {
        color: contentColor,
        size: iconSize
      })
    : icon

  const resolveBackgroundColor = () => {
    if (isDanger) return isHovered || isPressed ? c.colorDangerSubtle : 'transparent'
    if (isPressed) return c.colorSurfacePrimary
    if (isHovered) return c.colorSurfaceSecondary
    return 'transparent'
  }
  const backgroundColor = resolveBackgroundColor()

  return (
    <html.div
      {...pressHandlers}
      role='button'
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e: { key: string }) => {
        if (e.key === 'Enter' || e.key === ' ') onClick()
      }}
      style={[styles.row, compact && styles.rowCompact, { backgroundColor } as never]}
    >
      <html.div style={[styles.iconSlot, compact && styles.iconSlotCompact]}>{iconEl}</html.div>
      <html.div style={[styles.textGroup, compact && styles.textGroupCompact]}>
        <html.span
          style={[styles.title, compact && styles.titleCompact, { color: contentColor } as never]}
        >
          {title}
        </html.span>
        {subtitle ? (
          <html.span
            style={[
              styles.subtitle,
              compact && styles.subtitleCompact,
              { color: c.colorTextMuted } as never
            ]}
          >
            {subtitle}
          </html.span>
        ) : null}
      </html.div>
    </html.div>
  )
}
