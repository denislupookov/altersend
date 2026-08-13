import { css } from 'react-strict-dom'
import { fontTokens, tokens } from '../../theme/tokens.css'

export const styles = css.create({
  card: {
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: tokens.colorBorderPrimary,
    borderRadius: tokens.radius2xl,
    overflow: 'hidden',
    backgroundColor: tokens.colorBackgroundSubtle
  },
  title: {
    margin: 0,
    fontFamily: fontTokens.fontFamilySans,
    fontSize: tokens.fontSizeLg,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorTextPrimary,
    lineHeight: tokens.lineHeightNormal
  },
  description: {
    margin: 0,
    marginTop: tokens.space1,
    fontFamily: fontTokens.fontFamilySans,
    fontSize: tokens.fontSizeMd,
    color: tokens.colorTextMuted,
    lineHeight: tokens.lineHeightRelaxed
  },
  field: {
    marginTop: tokens.space3
  },
  fallbackTitle: {
    marginTop: tokens.space5,
    marginBottom: tokens.space2
  },
  commitError: {
    margin: 0,
    marginTop: tokens.space3,
    fontFamily: fontTokens.fontFamilySans,
    fontSize: tokens.fontSizeMd,
    fontWeight: tokens.fontWeightMedium,
    color: tokens.colorDanger,
    lineHeight: tokens.lineHeightRelaxed
  }
})
