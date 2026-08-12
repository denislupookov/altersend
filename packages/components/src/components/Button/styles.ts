import { css } from 'react-strict-dom'
import { fontTokens, tokens } from '../../theme/tokens.css'

export const styles = css.create({
  base: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'row',
    boxSizing: 'border-box',
    gap: tokens.space15,
    minWidth: 0,
    borderWidth: 1,
    borderStyle: 'solid',
    borderRadius: tokens.radiusControl,
    paddingBlock: tokens.space2,
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: fontTokens.fontFamilySans,
    fontSize: tokens.fontSizeMd,
    fontWeight: tokens.fontWeightSemibold,
    lineHeight: 1.1,
    letterSpacing: '-0.005em',
    textAlign: 'center',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    userSelect: 'none',
    transform: 'scale(1)'
  },
  transitionWeb: {
    transitionDuration: '160ms',
    transitionProperty: 'background-color, border-color, color, box-shadow, opacity, transform',
    transitionTimingFunction: 'ease'
  },
  transitionNative: {
    transitionDuration: '160ms',
    transitionProperty: 'transform, opacity',
    transitionTimingFunction: 'ease'
  },
  pressedScale: {
    transform: 'scale(0.97)'
  },
  sm: {
    minHeight: tokens.space10,
    paddingInline: tokens.space5,
    fontSize: tokens.fontSizeMd
  },
  md: {
    minHeight: tokens.space11,
    paddingInline: tokens.space6,
    fontSize: tokens.fontSizeBase
  },
  lg: {
    minHeight: tokens.space12,
    paddingInline: tokens.space6,
    gap: tokens.space2,
    fontSize: tokens.fontSizeLg
  },
  stack: {
    flexDirection: 'column',
    gap: tokens.space2,
    paddingBlock: tokens.space3,
    paddingInline: tokens.space2
  },
  stackText: {
    whiteSpace: 'normal'
  },
  full: {
    width: '100%'
  },
  iconOnlySm: {
    minWidth: tokens.space8,
    minHeight: tokens.space8,
    paddingInline: 0
  },
  iconOnlyMd: {
    minWidth: tokens.space9,
    minHeight: tokens.space9,
    paddingInline: 0
  },
  iconOnlyLg: {
    minWidth: tokens.space10,
    minHeight: tokens.space10,
    paddingInline: 0
  },
  primary: {
    backgroundColor: tokens.colorTextPrimary,
    borderColor: 'transparent',
    color: tokens.colorBackground,
    boxShadow: `0 1px 2px ${tokens.colorShadow}`,
    ':hover': {
      backgroundColor: tokens.colorAccentActive,
      borderColor: tokens.colorBorderStrong
    },
    ':focus-visible': {
      outline: 'none',
      boxShadow: `0 0 0 2px ${tokens.colorFocusRing}`
    }
  },
  primaryPressed: {
    backgroundColor: tokens.colorAccentActive,
    borderColor: tokens.colorBorderPrimary
  },
  secondary: {
    backgroundColor: tokens.colorBackgroundSubtle,
    borderColor: tokens.colorBorderPrimary,
    color: tokens.colorTextPrimary,
    boxShadow: 'none',
    ':hover': {
      backgroundColor: tokens.colorSurfacePrimary,
      borderColor: tokens.colorBorderStrong
    },
    ':focus-visible': {
      outline: 'none',
      boxShadow: `0 0 0 2px ${tokens.colorFocusRing}`
    }
  },
  secondaryPressed: {
    backgroundColor: tokens.colorSurfaceSecondary
  },
  surface: {
    backgroundColor: tokens.colorSurfacePrimary,
    borderColor: tokens.colorBorderPrimary,
    color: tokens.colorTextPrimary,
    boxShadow: 'none',
    ':hover': {
      backgroundColor: tokens.colorSurfaceSecondary,
      borderColor: tokens.colorBorderStrong
    },
    ':focus-visible': {
      outline: 'none',
      boxShadow: `0 0 0 2px ${tokens.colorFocusRing}`
    }
  },
  surfacePressed: {
    backgroundColor: tokens.colorSurfaceSecondary
  },
  outline: {
    backgroundColor: tokens.colorBackgroundSubtle,
    borderColor: tokens.colorBorderStrong,
    color: tokens.colorTextPrimary,
    boxShadow: 'none',
    ':hover': {
      backgroundColor: tokens.colorSurfacePrimary,
      borderColor: tokens.colorTextMuted
    },
    ':focus-visible': {
      outline: 'none',
      boxShadow: `0 0 0 2px ${tokens.colorFocusRing}`
    }
  },
  outlinePressed: {
    backgroundColor: tokens.colorSurfaceSecondary
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    color: tokens.colorTextSecondary,
    ':hover': {
      backgroundColor: tokens.colorBackgroundSubtle,
      color: tokens.colorTextPrimary
    },
    ':focus-visible': {
      outline: 'none',
      boxShadow: `0 0 0 2px ${tokens.colorFocusRing}`
    }
  },
  ghostPressed: {
    backgroundColor: tokens.colorSurfaceSecondary
  },
  light: {
    backgroundColor: tokens.colorAccent,
    borderColor: tokens.colorAccent,
    color: tokens.colorOnAccent,
    boxShadow: 'none',
    ':hover': {
      backgroundColor: tokens.colorAccentHover,
      borderColor: tokens.colorAccentHover
    },
    ':focus-visible': {
      outline: 'none',
      boxShadow: `0 0 0 2px ${tokens.colorHighlight}`
    }
  },
  lightPressed: {
    backgroundColor: tokens.colorAccentActive
  },
  danger: {
    backgroundColor: tokens.colorDangerSubtle,
    borderColor: 'transparent',
    color: tokens.colorDanger,
    ':hover': {
      backgroundColor: tokens.colorDanger,
      color: tokens.colorBackground
    },
    ':focus-visible': {
      outline: 'none',
      boxShadow: `0 0 0 2px ${tokens.colorDanger}`
    }
  },
  dangerPressed: {
    backgroundColor: tokens.colorDanger,
    color: tokens.colorBackground
  },
  success: {
    backgroundColor: tokens.colorSuccessSubtle,
    borderColor: 'transparent',
    color: tokens.colorSuccess,
    ':hover': {
      backgroundColor: tokens.colorSuccess,
      color: tokens.colorBackground
    },
    ':focus-visible': {
      outline: 'none',
      boxShadow: `0 0 0 2px ${tokens.colorSuccess}`
    }
  },
  successPressed: {
    backgroundColor: tokens.colorSuccess,
    color: tokens.colorBackground
  },
  disabled: {
    backgroundColor: tokens.colorSurfaceTertiary,
    borderColor: tokens.colorBorderPrimary,
    color: tokens.colorTextMuted,
    cursor: 'not-allowed',
    boxShadow: 'none',
    opacity: 1,
    ':hover': {
      backgroundColor: tokens.colorSurfaceTertiary,
      borderColor: tokens.colorBorderPrimary,
      color: tokens.colorTextMuted
    }
  },
  disabledGhost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    color: tokens.colorTextMuted,
    cursor: 'not-allowed',
    boxShadow: 'none',
    opacity: 0.5,
    ':hover': {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      color: tokens.colorTextMuted
    }
  },
  textBase: {
    fontFamily: fontTokens.fontFamilySans,
    fontWeight: tokens.fontWeightSemibold,
    letterSpacing: '-0.005em',
    textAlign: 'center',
    whiteSpace: 'nowrap'
  },
  textSm: { fontSize: tokens.fontSizeMd },
  textMd: { fontSize: tokens.fontSizeBase },
  textLg: { fontSize: tokens.fontSizeLg },
  textPrimary: { color: tokens.colorBackground },
  textSecondary: { color: tokens.colorTextPrimary },
  textOutline: { color: tokens.colorTextPrimary },
  textGhost: { color: tokens.colorTextSecondary },
  textLight: { color: tokens.colorOnAccent },
  textDanger: { color: tokens.colorDanger },
  textSuccess: { color: tokens.colorSuccess },
  textOnBackground: { color: tokens.colorBackground },
  pill: { borderRadius: tokens.radiusFull },
  textDisabled: { color: tokens.colorTextMuted }
})
