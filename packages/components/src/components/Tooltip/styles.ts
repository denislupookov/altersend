import { css } from 'react-strict-dom'
import { tokens } from '../../theme/tokens.css'

export const styles = css.create({
  layer: {
    position: 'absolute',
    zIndex: 50,
    display: 'flex',
    flexDirection: 'row',
    pointerEvents: 'none',
    opacity: 0,
    transitionProperty: 'opacity',
    transitionDuration: '150ms',
    transitionTimingFunction: 'ease'
  },
  layerVisible: {
    opacity: 1
  },
  right: {
    left: '100%',
    top: 0,
    bottom: 0,
    marginLeft: tokens.space2,
    alignItems: 'center'
  },
  left: {
    right: '100%',
    top: 0,
    bottom: 0,
    marginRight: tokens.space2,
    alignItems: 'center',
    justifyContent: 'flex-end'
  },
  top: {
    bottom: '100%',
    left: 0,
    right: 0,
    marginBottom: tokens.space2,
    justifyContent: 'center',
    alignItems: 'flex-end'
  },
  bottom: {
    top: '100%',
    left: 0,
    right: 0,
    marginTop: tokens.space2,
    justifyContent: 'center',
    alignItems: 'flex-start'
  },
  tooltip: {
    position: 'relative',
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    borderRadius: tokens.radiusLg,
    backgroundColor: tokens.colorSurfaceSecondary,
    paddingTop: tokens.space25,
    paddingBottom: tokens.space25,
    paddingLeft: tokens.space3,
    paddingRight: tokens.space3,
    boxShadow: `0 10px 30px ${tokens.colorShadow}`
  },
  title: {
    textAlign: 'left',
    whiteSpace: 'nowrap',
    color: tokens.colorTextPrimary,
    fontSize: tokens.fontSizeMd,
    fontWeight: tokens.fontWeightSemibold,
    lineHeight: tokens.lineHeightTight
  },
  description: {
    marginTop: tokens.space05,
    textAlign: 'left',
    whiteSpace: 'nowrap',
    color: tokens.colorTextSecondary,
    fontSize: tokens.fontSizeSm,
    fontWeight: tokens.fontWeightRegular,
    lineHeight: tokens.lineHeightSnug
  }
})
