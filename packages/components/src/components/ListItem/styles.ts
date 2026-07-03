import { css } from 'react-strict-dom'
import { tokens } from '../../theme/tokens.css'

export const styles = css.create({
  base: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    boxSizing: 'border-box',
    borderWidth: 0,
    borderStyle: 'solid',
    borderRadius: tokens.radiusMd,
    padding: 0,
    fontFamily: tokens.fontFamilySans,
    fontSize: tokens.fontSizeBase,
    fontWeight: tokens.fontWeightMedium,
    lineHeight: tokens.lineHeightTight,
    textAlign: 'left',
    cursor: 'pointer',
    userSelect: 'none',
    outlineStyle: 'none',
    transitionDuration: '120ms',
    transitionProperty: 'background-color, color',
    transitionTimingFunction: 'ease',
    ':focus-visible': {
      boxShadow: `0 0 0 2px ${tokens.colorFocusRing}`
    }
  },
  expanded: {
    width: '100%',
    justifyContent: 'space-between',
    gap: tokens.space25,
    paddingLeft: tokens.space3,
    paddingRight: tokens.space3,
    paddingTop: tokens.space25,
    paddingBottom: tokens.space25
  },
  expandedLarge: {
    minHeight: tokens.space14,
    gap: tokens.space3,
    paddingLeft: tokens.space5,
    paddingRight: tokens.space5,
    paddingTop: tokens.space4,
    paddingBottom: tokens.space4,
    fontSize: tokens.fontSizeLg,
    fontWeight: tokens.fontWeightSemibold
  },
  collapsed: {
    width: tokens.space10,
    height: tokens.space10,
    justifyContent: 'center'
  },
  square: {
    borderRadius: 0
  },
  left: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
    gap: tokens.space25
  },
  leftLarge: {
    gap: tokens.space3
  },
  iconSlot: {
    position: 'relative',
    display: 'flex',
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center'
  },
  dot: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: tokens.space2,
    height: tokens.space2,
    borderRadius: tokens.radiusFull,
    backgroundColor: tokens.colorSuccess,
    boxShadow: `0 0 0 2px ${tokens.colorBackgroundDeep}`
  },
  textColumn: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    gap: 2
  },
  label: {
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    lineHeight: tokens.lineHeightTight
  },
  subtitle: {
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontSize: tokens.fontSizeSm,
    fontWeight: tokens.fontWeightRegular,
    lineHeight: tokens.lineHeightTight,
    color: tokens.colorTextMuted
  }
})
