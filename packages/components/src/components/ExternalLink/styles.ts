import { css } from 'react-strict-dom'
import { tokens } from '../../theme/tokens.css'

export const styles = css.create({
  link: {
    fontFamily: tokens.fontFamilySans,
    fontSize: tokens.fontSizeSm,
    fontWeight: tokens.fontWeightMedium,
    color: tokens.colorTextSecondary,
    cursor: 'pointer',
    textDecorationLine: 'underline',
    textDecorationColor: tokens.colorTextMuted,
    textUnderlineOffset: '4px',
    transitionProperty: 'color',
    transitionDuration: '150ms',
    transitionTimingFunction: 'ease',
    ':hover': {
      color: tokens.colorTextPrimary
    }
  },
  icon: {
    display: 'inline-flex',
    verticalAlign: 'middle',
    marginLeft: '3px'
  }
})
