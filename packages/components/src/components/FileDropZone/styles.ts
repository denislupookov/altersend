import { css } from 'react-strict-dom'
import { tokens } from '../../theme/tokens.css'

export const styles = css.create({
  card: {
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: tokens.space11,
    paddingBottom: tokens.space11,
    paddingLeft: tokens.space11,
    paddingRight: tokens.space11,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: tokens.colorBorderStrong,
    borderRadius: tokens.radius2xl,
    backgroundColor: tokens.colorBackgroundSubtle,
    cursor: 'pointer',
    transitionDuration: '180ms',
    transitionProperty: 'border-color, background-color, transform, padding',
    ':hover': {
      borderColor: tokens.colorHighlight,
      backgroundColor: tokens.colorSurfaceSecondary
    }
  },
  cardActive: {
    borderColor: tokens.colorInfo,
    backgroundColor: tokens.colorInfoSubtle
  },
  cardHasFile: {
    paddingTop: tokens.space6,
    paddingBottom: tokens.space6,
    backgroundColor: 'transparent'
  },
  cardReadOnly: {
    cursor: 'default',
    ':hover': {
      borderColor: tokens.colorBorderStrong,
      backgroundColor: tokens.colorBackgroundSubtle
    }
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    gap: tokens.space35,
    textAlign: 'center'
  },
  contentHasFile: {
    gap: tokens.space25
  },
  iconRing: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    height: 50,
    borderRadius: 13,
    backgroundColor: tokens.colorSurfacePrimary,
    color: tokens.colorTextMuted,
    transitionDuration: '180ms',
    transitionProperty: 'background-color, transform, width, height'
  },
  iconRingHasFile: {
    width: tokens.space10,
    height: tokens.space10
  },
  iconRingActive: {
    backgroundColor: tokens.colorInfoSubtle,
    transform: 'translateY(-2px)'
  },
  textStack: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: tokens.space1,
    maxWidth: 360
  },
  title: {
    fontFamily: tokens.fontFamilyDisplay,
    fontSize: tokens.fontSizeLg,
    fontWeight: tokens.fontWeightMedium,
    letterSpacing: '-0.005em',
    color: tokens.colorTextSecondary,
    margin: 0,
    lineHeight: tokens.lineHeightSnug
  },
  titleHasFile: {
    fontSize: tokens.fontSizeBase
  },
  description: {
    fontFamily: tokens.fontFamilySans,
    fontSize: tokens.fontSizeMd,
    fontWeight: tokens.fontWeightRegular,
    color: tokens.colorTextFaint,
    margin: 0,
    lineHeight: tokens.lineHeightRelaxed
  },
  descriptionHasFile: {
    fontSize: tokens.fontSizeSm
  },
  link: {
    color: tokens.colorInfo,
    fontWeight: tokens.fontWeightMedium,
    textDecorationLine: 'underline'
  }
})
