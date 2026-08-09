import { css } from 'react-strict-dom'
import { fontTokens, tokens } from '../../theme/tokens.css'

export const styles = css.create({
  card: {
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: tokens.colorBorderPrimary,
    borderRadius: tokens.radiusLg,
    backgroundColor: tokens.colorBackgroundSubtle,
    paddingBlock: tokens.space35,
    paddingInline: tokens.space4
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.space3
  },
  actions: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space2
  },
  text: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.space1,
    minWidth: 0
  },
  label: {
    margin: 0,
    color: tokens.colorTextMuted,
    fontFamily: fontTokens.fontFamilySans,
    fontSize: tokens.fontSizeXs,
    fontWeight: tokens.fontWeightSemibold,
    lineHeight: tokens.lineHeightNormal,
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  code: {
    margin: 0,
    color: tokens.colorTextPrimary,
    fontFamily: fontTokens.fontFamilyMono,
    fontSize: tokens.fontSizeXl,
    lineHeight: tokens.lineHeightSnug,
    letterSpacing: 1
  }
})
