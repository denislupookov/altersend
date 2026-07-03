import { css } from 'react-strict-dom'
import { tokens } from '../../theme/tokens.css'

export const styles = css.create({
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 28
  },
  text: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8
  },
  title: {
    margin: 0,
    fontFamily: tokens.fontFamilyDisplay,
    fontSize: 20,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorTextPrimary,
    textAlign: 'center',
    lineHeight: tokens.lineHeightSnug
  },
  description: {
    margin: 0,
    maxWidth: 300,
    fontFamily: tokens.fontFamilySans,
    fontSize: 14,
    fontWeight: tokens.fontWeightRegular,
    color: tokens.colorTextMuted,
    textAlign: 'center',
    lineHeight: tokens.lineHeightRelaxed
  }
})
