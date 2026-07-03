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
  box: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    boxSizing: 'border-box',
    overflow: 'hidden',
    padding: tokens.space3,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: tokens.colorBorderPrimary,
    borderRadius: tokens.radiusLg,
    backgroundColor: tokens.colorBackgroundSubtle,
    transitionDuration: '180ms',
    transitionProperty: 'border-color, height',
    transitionTimingFunction: 'ease',
    ':focus-within': {
      borderColor: tokens.colorBorderStrong
    }
  },
  boxInvalid: {
    borderColor: tokens.colorDanger
  },
  boxDisabled: {
    opacity: 0.5
  },
  field: {
    flexGrow: 1,
    flexShrink: 1,
    minHeight: 0,
    width: '100%',
    minWidth: 0,
    boxSizing: 'border-box',
    padding: 0,
    borderWidth: 0,
    borderStyle: 'solid',
    borderColor: 'transparent',
    backgroundColor: 'transparent',
    resize: 'none',
    color: tokens.colorTextPrimary,
    fontFamily: tokens.fontFamilySans,
    fontSize: tokens.fontSizeMd,
    fontWeight: tokens.fontWeightRegular,
    lineHeight: tokens.lineHeightRelaxed,
    outline: 'none',
    boxShadow: 'none',
    '::placeholder': {
      color: tokens.colorTextMuted
    }
  },
  footer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
    gap: tokens.space2,
    marginTop: tokens.space3
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
  }
})
