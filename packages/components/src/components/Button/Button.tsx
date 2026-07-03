import { cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react'
import { html } from 'react-strict-dom'
import { usePressState } from '../../hooks/usePressState'
import { useTheme } from '../../theme'
import { Spinner } from '../Spinner'
import { Tooltip, type TooltipSide } from '../Tooltip'
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
  tooltip?: string
  tooltipSide?: TooltipSide
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

const normalIconColor: Record<ButtonVariant, keyof ReturnType<typeof useTheme>['theme']['colors']> =
  {
    primary: 'colorBackground',
    secondary: 'colorTextPrimary',
    ghost: 'colorTextSecondary',
    light: 'colorOnAccent',
    danger: 'colorDanger',
    success: 'colorSuccess'
  }

const pressedIconColor: Partial<
  Record<ButtonVariant, keyof ReturnType<typeof useTheme>['theme']['colors']>
> = {
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
  tooltip,
  tooltipSide = 'top',
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

  const resolveIconColorKey = () => {
    if (isDisabled && !loading) return 'colorTextMuted'
    if ((showPressed || showHover) && pressedIconColor[variant]) return pressedIconColor[variant]!
    return normalIconColor[variant]
  }
  const resolvedIconColor = theme.colors[resolveIconColorKey()]

  const renderLeading = (): ReactNode => {
    if (loading) return <Spinner size={spinnerSize[size]} color={resolvedIconColor} />
    if (isValidElement(icon)) {
      return cloneElement(icon as ReactElement<{ color?: string }>, { color: resolvedIconColor })
    }
    return icon
  }
  const leadingEl = renderLeading()

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
      {tooltip ? <Tooltip label={tooltip} visible={showHover} side={tooltipSide} /> : null}
    </html.button>
  )
}
