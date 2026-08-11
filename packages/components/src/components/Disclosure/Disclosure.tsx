import type { ReactNode } from 'react'
import { html } from 'react-strict-dom'
import { ChevronDownIcon, ChevronUpIcon } from '../../icons'
import { useTheme } from '../../theme'
import { styles } from './styles'

export interface DisclosureProps {
  title: string
  subtitle?: string
  icon?: ReactNode
  expanded: boolean
  compact?: boolean
  onToggle: () => void
  children?: ReactNode
}

export function Disclosure({
  title,
  subtitle,
  icon,
  expanded,
  compact = false,
  onToggle,
  children
}: DisclosureProps) {
  const { theme } = useTheme()
  const Chevron = expanded ? ChevronUpIcon : ChevronDownIcon
  const chevronSize = compact ? 14 : 16

  return (
    <html.section style={styles.section}>
      <html.div
        aria-expanded={expanded}
        onClick={onToggle}
        role='button'
        style={[styles.header, compact && styles.headerCompact]}
        tabIndex={0}
      >
        <html.div style={styles.leftGroup}>
          {icon ? (
            <html.div style={[styles.iconBox, compact && styles.iconBoxCompact]}>{icon}</html.div>
          ) : null}

          <html.div style={styles.content}>
            <html.p style={[styles.title, compact && styles.titleCompact]}>{title}</html.p>
            {subtitle ? (
              <html.p style={[styles.subtitle, compact && styles.subtitleCompact]}>
                {subtitle}
              </html.p>
            ) : null}
          </html.div>
        </html.div>

        <html.div style={[styles.chevronBox, compact && styles.chevronBoxCompact]}>
          <Chevron size={chevronSize} color={theme.colors.colorTextSecondary} />
        </html.div>
      </html.div>

      {expanded ? <html.div style={styles.body}>{children}</html.div> : null}
    </html.section>
  )
}
