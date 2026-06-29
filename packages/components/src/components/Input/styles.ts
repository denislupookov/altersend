import { css } from 'react-strict-dom'
import { tokens } from '../../theme/tokens.css'

export const styles = css.create({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.space2,
    minWidth: 0,
    width: '100%'
  },
  label: {
    margin: 0,
    color: tokens.colorTextMuted,
    fontFamily: tokens.fontFamilySans,
    fontSize: tokens.fontSizeBase,
    fontWeight: tokens.fontWeightRegular,
    lineHeight: tokens.lineHeightNormal
  },
  field: {
    width: '100%',
    height: 48,
    boxSizing: 'border-box',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: tokens.colorBorderPrimary,
    borderRadius: tokens.radiusLg,
    paddingBlock: 0,
    paddingInline: tokens.space3,
    backgroundColor: tokens.colorBackgroundSubtle,
    color: tokens.colorTextPrimary,
    fontFamily: tokens.fontFamilySans,
    fontSize: tokens.fontSizeBase,
    fontWeight: tokens.fontWeightRegular,
    lineHeight: tokens.lineHeightNormal,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    boxShadow: 'none',
    transitionDuration: '200ms',
    transitionProperty: 'border-color, box-shadow, background-color',
    transitionTimingFunction: 'ease',
    ':hover': {
      borderColor: tokens.colorBorderStrong,
      backgroundColor: tokens.colorSurfaceSecondary
    },
    ':focus': {
      outline: 'none',
      borderColor: tokens.colorFocusRing,
      backgroundColor: tokens.colorSurfaceSecondary,
      boxShadow: `0 0 0 1px ${tokens.colorBorderStrong}`
    },
    '::placeholder': {
      color: tokens.colorTextMuted
    }
  },
  mono: {
    fontFamily: tokens.fontFamilyMono,
    fontSize: tokens.fontSizeBase
  },
  invalid: {
    borderColor: tokens.colorDanger,
    boxShadow: `0 0 0 2px ${tokens.colorDangerSubtle}`,
    ':focus': {
      borderColor: tokens.colorDanger,
      boxShadow: `0 0 0 2px ${tokens.colorDangerSubtle}`
    }
  },
  hint: {
    margin: 0,
    color: tokens.colorTextMuted,
    fontFamily: tokens.fontFamilySans,
    fontSize: tokens.fontSizeMd,
    fontWeight: tokens.fontWeightRegular,
    lineHeight: tokens.lineHeightRelaxed
  },
  error: {
    color: tokens.colorDanger,
    fontWeight: tokens.fontWeightMedium
  },
  iconWrapper: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space2,
    width: '100%',
    height: 48,
    boxSizing: 'border-box',
    overflow: 'hidden',
    paddingBlock: 0,
    paddingInline: tokens.space3,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: tokens.colorBorderPrimary,
    borderRadius: tokens.radiusLg,
    backgroundColor: tokens.colorBackgroundSubtle,
    transitionDuration: '200ms',
    transitionProperty: 'border-color, box-shadow, background-color',
    transitionTimingFunction: 'ease',
    ':hover': {
      borderColor: tokens.colorBorderStrong,
      backgroundColor: tokens.colorSurfaceSecondary
    },
    ':focus-within': {
      borderColor: tokens.colorFocusRing,
      backgroundColor: tokens.colorSurfaceSecondary,
      boxShadow: `0 0 0 1px ${tokens.colorBorderStrong}`
    }
  },
  iconWrapperInvalid: {
    borderColor: tokens.colorDanger,
    boxShadow: `0 0 0 2px ${tokens.colorDangerSubtle}`,
    ':focus-within': {
      borderColor: tokens.colorDanger,
      boxShadow: `0 0 0 2px ${tokens.colorDangerSubtle}`
    }
  },
  iconSlot: {
    flexShrink: 0,
    width: tokens.space4,
    height: tokens.space4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 0,
    color: tokens.colorTextMuted
  },
  inputInner: {
    flex: 1,
    minWidth: 0,
    boxSizing: 'border-box',
    paddingBlock: 0,
    paddingInline: 0,
    borderWidth: 0,
    borderStyle: 'solid',
    borderColor: 'transparent',
    backgroundColor: 'transparent',
    color: tokens.colorTextPrimary,
    fontFamily: tokens.fontFamilySans,
    fontSize: tokens.fontSizeBase,
    fontWeight: tokens.fontWeightRegular,
    lineHeight: tokens.lineHeightNormal,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    outline: 'none',
    boxShadow: 'none',
    '::placeholder': {
      color: tokens.colorTextMuted
    }
  },
  inputInnerMono: {
    fontFamily: tokens.fontFamilyMono,
    fontSize: tokens.fontSizeBase
  },
  trailingSlot: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: tokens.colorTextMuted
  }
})
