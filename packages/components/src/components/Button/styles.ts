import { css } from 'react-strict-dom'
import { tokens } from '../../theme/tokens.css'

export const styles = css.create({
  base: {
    display: 'flex',
    flexDirection: 'row',
    boxSizing: 'border-box',
    gap: tokens.space15,
    minWidth: 0,
    borderWidth: 1,
    borderStyle: 'solid',
    borderRadius: tokens.radiusLg,
    padding: tokens.space3,
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: tokens.fontFamilySans,
    fontSize: tokens.fontSizeMd,
    fontWeight: tokens.fontWeightSemibold,
    lineHeight: 1.1,
    letterSpacing: '-0.005em',
    textAlign: 'center',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    userSelect: 'none',
    transitionDuration: '160ms',
    transitionProperty: 'background-color, border-color, color, box-shadow, opacity',
    transitionTimingFunction: 'ease'
  },
  sm: {
    paddingTop: tokens.space3,
    paddingBottom: tokens.space3,
    paddingLeft: 22,
    paddingRight: 22,
    fontSize: tokens.fontSizeMd
  },
  md: {
    paddingTop: tokens.space4,
    paddingBottom: tokens.space4,
    paddingLeft: 26,
    paddingRight: 26,
    fontSize: tokens.fontSizeBase
  },
  lg: {
    paddingTop: tokens.space35,
    paddingBottom: tokens.space35,
    paddingLeft: tokens.space4,
    paddingRight: tokens.space4,
    gap: tokens.space2,
    fontSize: tokens.fontSizeLg
  },
  full: {
    width: '100%'
  },
  iconOnlySm: {
    paddingTop: tokens.space2,
    paddingBottom: tokens.space2,
    paddingLeft: tokens.space15,
    paddingRight: tokens.space15,
    borderRadius: tokens.radiusSm
  },
  iconOnlyMd: {
    paddingTop: tokens.space25,
    paddingBottom: tokens.space25,
    paddingLeft: tokens.space2,
    paddingRight: tokens.space2,
    borderRadius: tokens.radiusMd
  },
  iconOnlyLg: {
    paddingTop: tokens.space3,
    paddingBottom: tokens.space3,
    paddingLeft: tokens.space25,
    paddingRight: tokens.space25,
    borderRadius: tokens.radiusLg
  },
  primary: {
    backgroundColor: tokens.colorTextPrimary,
    borderColor: tokens.colorBorderPrimary,
    color: tokens.colorBackground,
    boxShadow: `0 1px 2px ${tokens.colorShadow}, inset 0 1px 0 ${tokens.colorHighlight}`,
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
    fontFamily: tokens.fontFamilySans,
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
  textGhost: { color: tokens.colorTextSecondary },
  textLight: { color: tokens.colorOnAccent },
  textDanger: { color: tokens.colorDanger },
  textSuccess: { color: tokens.colorSuccess },
  textOnBackground: { color: tokens.colorBackground },
  pill: { borderRadius: tokens.radiusFull },
  textDisabled: { color: tokens.colorTextMuted }
})
