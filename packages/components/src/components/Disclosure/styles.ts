import { css } from 'react-strict-dom'
import { fontTokens, tokens } from '../../theme/tokens.css'

export const styles = css.create({
  section: {
    width: '100%',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: tokens.colorBorderPrimary,
    borderRadius: tokens.radius2xl,
    backgroundColor: tokens.colorBackgroundSubtle
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.space3,
    borderWidth: 0,
    borderStyle: 'solid',
    backgroundColor: 'transparent',
    paddingTop: tokens.space3,
    paddingBottom: tokens.space3,
    paddingLeft: tokens.space35,
    paddingRight: tokens.space35,
    textAlign: 'left',
    cursor: 'pointer',
    transitionDuration: '160ms',
    transitionProperty: 'background-color',
    ':hover': {
      backgroundColor: tokens.colorSurfacePrimary
    }
  },
  leftGroup: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space35,
    flexShrink: 1,
    minWidth: 0
  },
  headerCompact: {
    gap: tokens.space25,
    paddingTop: tokens.space2,
    paddingBottom: tokens.space2,
    paddingLeft: tokens.space25,
    paddingRight: tokens.space25
  },
  iconBox: {
    width: tokens.space10,
    height: tokens.space10,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: tokens.radiusSm,
    backgroundColor: tokens.colorAccentSubtle,
    color: tokens.colorTextPrimary
  },
  iconBoxCompact: {
    width: 30,
    height: 30,
    borderRadius: tokens.radiusXs
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    flex: 1,
    gap: tokens.space05
  },
  title: {
    margin: 0,
    color: tokens.colorTextPrimary,
    fontFamily: fontTokens.fontFamilySans,
    fontSize: tokens.fontSizeBase,
    fontWeight: tokens.fontWeightMedium,
    lineHeight: tokens.lineHeightSnug
  },
  titleCompact: {
    fontSize: tokens.fontSizeMd
  },
  subtitle: {
    margin: 0,
    color: tokens.colorTextMuted,
    fontFamily: fontTokens.fontFamilySans,
    fontSize: tokens.fontSizeSm,
    lineHeight: tokens.lineHeightNormal
  },
  subtitleCompact: {
    fontSize: tokens.fontSizeXs
  },
  chevronBox: {
    width: tokens.space6,
    height: tokens.space6,
    minWidth: tokens.space6,
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    color: tokens.colorTextSecondary
  },
  chevronBoxCompact: {
    width: tokens.space5,
    height: tokens.space5,
    minWidth: tokens.space5
  },
  body: {
    display: 'flex',
    flexDirection: 'column'
  }
})
