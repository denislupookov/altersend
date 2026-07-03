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
    margin: 0,
    whiteSpace: 'nowrap',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: tokens.colorBorderStrong,
    borderRadius: tokens.radiusSm,
    backgroundColor: tokens.colorSurfaceTertiary,
    color: tokens.colorTextPrimary,
    paddingTop: tokens.space15,
    paddingBottom: tokens.space15,
    paddingLeft: tokens.space25,
    paddingRight: tokens.space25,
    fontSize: tokens.fontSizeMd,
    fontWeight: tokens.fontWeightMedium,
    lineHeight: tokens.lineHeightTight,
    boxShadow: `0 8px 24px ${tokens.colorShadow}`
  }
})
