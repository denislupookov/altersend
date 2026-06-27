import { cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react'
import { html } from 'react-strict-dom'
import { usePressState } from '../../hooks/usePressState'
import { useTheme } from '../../theme'
import { Spinner } from '../Spinner'
import { styles } from './styles'

type ButtonElementProps = Parameters<typeof html.button>[0]

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'light' | 'danger' | 'success'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends Omit<ButtonElementProps, 'children' | 'style'> {
  children?: ReactNode
  icon?: ReactNode
  iconOnly?: boolean
  loading?: boolean
  pill?: boolean
  size?: ButtonSize
  variant?: ButtonVariant
  width?: 'auto' | 'full'
}

const pressedStyle = {
  primary: styles.primaryPressed,
  secondary: styles.secondaryPressed,
  ghost: styles.ghostPressed,
  light: styles.lightPressed,
  danger: styles.dangerPressed,
  success: styles.successPressed
} as const

const textSize = {
  sm: styles.textSm,
  md: styles.textMd,
  lg: styles.textLg
} as const

const textVariant = {
  primary: styles.textPrimary,
  secondary: styles.textSecondary,
  ghost: styles.textGhost,
  light: styles.textLight,
  danger: styles.textDanger,
  success: styles.textSuccess
} as const

const pressedTextStyle: Partial<Record<ButtonVariant, (typeof styles)[keyof typeof styles]>> = {
  danger: styles.textOnBackground,
  success: styles.textOnBackground
}

const normalIconColor: Record<ButtonVariant, keyof ReturnType<typeof useTheme>['theme']['colors']> = {
  primary: 'colorBackground',
  secondary: 'colorTextPrimary',
  ghost: 'colorTextSecondary',
  light: 'colorOnAccent',
  danger: 'colorDanger',
  success: 'colorSuccess'
}

const pressedIconColor: Partial<Record<ButtonVariant, keyof ReturnType<typeof useTheme>['theme']['colors']>> = {
  danger: 'colorBackground',
  success: 'colorBackground'
}

const spinnerSize: Record<ButtonSize, number> = { sm: 12, md: 14, lg: 16 }

const iconOnlyPadding: Record<ButtonSize, (typeof styles)[keyof typeof styles]> = {
  sm: styles.iconOnlySm,
  md: styles.iconOnlyMd,
  lg: styles.iconOnlyLg
}

export function Button({
  children,
  disabled,
  icon,
  iconOnly = false,
  loading = false,
  pill,
  size = 'md',
  type = 'button',
  variant = 'primary',
  width = 'auto',
  ...props
}: ButtonProps) {
  const { isPressed, isHovered, pressHandlers } = usePressState()
  const { theme } = useTheme()
  const isDisabled = disabled || loading
  const showPressed = isPressed && !isDisabled
  const showHover = isHovered && !isDisabled && !isPressed

  const iconColorKey = isDisabled && !loading
    ? 'colorTextMuted'
    : (showPressed || showHover) && pressedIconColor[variant]
      ? pressedIconColor[variant]!
      : normalIconColor[variant]
  const resolvedIconColor = theme.colors[iconColorKey]

  const leadingEl = loading
    ? <Spinner size={spinnerSize[size]} color={resolvedIconColor} />
    : isValidElement(icon)
      ? cloneElement(icon as ReactElement<{ color?: string }>, { color: resolvedIconColor })
      : icon

  return (
    <html.button
      {...props}
      {...pressHandlers}
      disabled={isDisabled}
      type={type}
      style={[
        styles.base,
        styles[size],
        iconOnly && iconOnlyPadding[size],
        styles[variant],
        pill && styles.pill,
        width === 'full' && styles.full,
        (showPressed || showHover) && pressedStyle[variant],
        isDisabled && !loading && (variant === 'ghost' ? styles.disabledGhost : styles.disabled)
      ]}
    >
      {leadingEl ?? null}
      {typeof children === 'string' ? (
        <html.span
          style={[
            styles.textBase,
            textSize[size],
            textVariant[variant],
            (showPressed || showHover) && pressedTextStyle[variant],
            isDisabled && !loading && styles.textDisabled
          ]}
        >
          {children}
        </html.span>
      ) : (
        children
      )}
    </html.button>
  )
}
