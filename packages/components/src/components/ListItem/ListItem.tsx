import { cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react'
import { html } from 'react-strict-dom'
import { ChevronRightIcon } from '../../icons'
import { usePressState } from '../../hooks/usePressState'
import { useTheme } from '../../theme'
import { Tooltip } from '../Tooltip'
import { styles } from './styles'

export interface ListItemProps {
  icon: ReactNode
  label: string
  onClick: () => void
  tooltip?: string
  active?: boolean
  collapsed?: boolean
  showDot?: boolean
  chevron?: boolean
  tone?: 'default' | 'danger'
  variant?: 'default' | 'plain'
  size?: 'default' | 'large'
  square?: boolean
  subtitle?: string
}

export function ListItem({
  icon,
  label,
  onClick,
  tooltip,
  active = false,
  collapsed = false,
  showDot = false,
  chevron = false,
  tone = 'default',
  variant = 'default',
  size = 'default',
  square = false,
  subtitle
}: ListItemProps) {
  const { theme } = useTheme()
  const c = theme.colors
  const { isHovered, isPressed, pressHandlers } = usePressState()
  const hot = isHovered || isPressed
  const large = size === 'large' && !collapsed

  const contentColor = active
    ? c.colorTextPrimary
    : tone === 'danger'
      ? c.colorDanger
      : variant === 'plain'
        ? c.colorTextPrimary
        : hot
          ? c.colorTextPrimary
          : c.colorTextSecondary

  const backgroundColor = active
    ? c.colorOverlaySelected
    : tone === 'danger'
      ? hot
        ? c.colorDangerSubtle
        : 'transparent'
      : hot
        ? c.colorOverlayHover
        : 'transparent'

  const iconEl = isValidElement(icon)
    ? cloneElement(icon as ReactElement<{ color?: string }>, { color: contentColor })
    : icon

  const iconSlot = (
    <html.div style={styles.iconSlot}>
      {iconEl}
      {showDot ? <html.div style={styles.dot} /> : null}
    </html.div>
  )

  return (
    <html.button
      {...pressHandlers}
      type='button'
      onClick={onClick}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      style={[
        styles.base,
        collapsed ? styles.collapsed : styles.expanded,
        large && styles.expandedLarge,
        square && styles.square,
        { backgroundColor } as never
      ]}
    >
      {collapsed ? (
        iconSlot
      ) : (
        <>
          <html.div style={[styles.left, large && styles.leftLarge]}>
            {iconSlot}
            {subtitle ? (
              <html.div style={styles.textColumn}>
                <html.span style={[styles.label, { color: contentColor } as never]}>
                  {label}
                </html.span>
                <html.span style={styles.subtitle}>{subtitle}</html.span>
              </html.div>
            ) : (
              <html.span style={[styles.label, { color: contentColor } as never]}>
                {label}
              </html.span>
            )}
          </html.div>
          {chevron ? <ChevronRightIcon size={14} color={contentColor} /> : null}
        </>
      )}

      {collapsed && tooltip ? <Tooltip label={tooltip} visible={isHovered} side='right' /> : null}
    </html.button>
  )
}
