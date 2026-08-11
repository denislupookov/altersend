import { css } from 'react-strict-dom'
import { fontTokens, tokens } from '../../theme/tokens.css'

export const styles = css.create({
  root: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.space15,
    minHeight: tokens.space6,
    paddingBlock: tokens.space05,
    paddingInline: tokens.space25,
    borderWidth: 1,
    borderStyle: 'solid',
    borderRadius: tokens.radiusSm,
    fontFamily: fontTokens.fontFamilySans,
    fontSize: tokens.fontSizeSm,
    fontWeight: tokens.fontWeightMedium,
    lineHeight: tokens.lineHeightTight
  },
  pill: {
    borderRadius: tokens.radiusFull,
    borderWidth: 0,
    gap: tokens.space2,
    paddingBlock: tokens.space15,
    paddingInline: tokens.space3,
    fontSize: tokens.fontSizeBase,
    fontWeight: tokens.fontWeightSemibold
  },
  muted: {
    backgroundColor: tokens.colorSurfaceSecondary,
    borderColor: 'transparent',
    color: tokens.colorTextMuted
  },
  neutral: {
    backgroundColor: tokens.colorBackgroundSubtle,
    borderColor: tokens.colorBorderPrimary,
    color: tokens.colorTextSecondary
  },
  accent: {
    backgroundColor: tokens.colorAccentSubtle,
    borderColor: tokens.colorBorderStrong,
    color: tokens.colorAccent
  },
  success: {
    backgroundColor: tokens.colorSuccessSubtle,
    borderColor: tokens.colorSuccess,
    color: tokens.colorSuccess
  },
  danger: {
    backgroundColor: tokens.colorDangerSubtle,
    borderColor: tokens.colorDanger,
    color: tokens.colorDanger
  },
  dot: {
    width: tokens.space15,
    height: tokens.space15,
    borderRadius: tokens.radiusFull,
    backgroundColor: 'currentColor',
    flexShrink: 0
  },
  label: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  }
})
