import { css } from 'react-strict-dom'
import { fontTokens, tokens } from '../../theme/tokens.css'

export const styles = css.create({
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: tokens.space4
  },
  text: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: tokens.space2
  },
  title: {
    margin: 0,
    fontFamily: fontTokens.fontFamilyDisplay,
    fontSize: 20,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorTextPrimary,
    textAlign: 'center',
    lineHeight: tokens.lineHeightSnug
  },
  description: {
    margin: 0,
    maxWidth: 340,
    fontFamily: fontTokens.fontFamilySans,
    fontSize: tokens.fontSizeBase,
    fontWeight: tokens.fontWeightRegular,
    color: tokens.colorTextMuted,
    textAlign: 'center',
    lineHeight: tokens.lineHeightRelaxed
  }
})
