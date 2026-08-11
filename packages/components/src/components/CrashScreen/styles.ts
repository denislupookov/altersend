import { css } from 'react-strict-dom'
import { fontTokens, tokens } from '../../theme/tokens.css'

export const styles = css.create({
  root: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.space6,
    backgroundColor: tokens.colorBackground
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    maxWidth: 420,
    gap: tokens.space3,
    padding: tokens.space6,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: tokens.colorBorderPrimary,
    borderRadius: tokens.radius2xl,
    backgroundColor: tokens.colorSurfacePrimary,
    textAlign: 'center'
  },
  title: {
    margin: 0,
    color: tokens.colorTextPrimary,
    fontFamily: fontTokens.fontFamilyDisplay,
    fontSize: tokens.fontSizeXl,
    fontWeight: tokens.fontWeightSemibold,
    lineHeight: tokens.lineHeightSnug
  },
  body: {
    margin: 0,
    color: tokens.colorTextSecondary,
    fontFamily: fontTokens.fontFamilySans,
    fontSize: tokens.fontSizeMd,
    lineHeight: tokens.lineHeightRelaxed
  },
  detail: {
    margin: 0,
    width: '100%',
    paddingBlock: tokens.space2,
    paddingInline: tokens.space3,
    borderRadius: tokens.radiusXs,
    backgroundColor: tokens.colorBackgroundSubtle,
    color: tokens.colorTextMuted,
    fontFamily: fontTokens.fontFamilyMono,
    fontSize: tokens.fontSizeSm
  }
})
