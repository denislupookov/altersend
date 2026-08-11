import { css } from 'react-strict-dom'
import { fontTokens, tokens } from '../../theme/tokens.css'

export const styles = css.create({
  card: {
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: tokens.colorBorderPrimary,
    borderRadius: tokens.radius2xl,
    backgroundColor: tokens.colorBackgroundSubtle
  },
  cardAttached: {
    borderWidth: 0,
    borderRadius: 0,
    backgroundColor: 'transparent'
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.space3,
    paddingBlock: tokens.space35,
    paddingInline: tokens.space4
  },
  rowInline: {
    alignItems: 'center',
    paddingBlock: tokens.space3
  },
  inlineLabel: {
    margin: 0,
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,
    color: tokens.colorTextPrimary,
    fontFamily: fontTokens.fontFamilySans,
    fontSize: tokens.fontSizeBase,
    fontWeight: tokens.fontWeightMedium,
    lineHeight: tokens.lineHeightNormal
  },
  codeInline: {
    fontSize: tokens.fontSizeBase,
    color: tokens.colorTextSecondary
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
    color: tokens.colorTextPrimary,
    fontFamily: fontTokens.fontFamilySans,
    fontSize: tokens.fontSizeLg,
    fontWeight: tokens.fontWeightMedium,
    lineHeight: tokens.lineHeightNormal
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
