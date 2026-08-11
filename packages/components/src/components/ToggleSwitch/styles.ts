import { css } from 'react-strict-dom'
import { fontTokens, tokens } from '../../theme/tokens.css'

export const styles = css.create({
  root: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.space3,
    justifyContent: 'space-between',
    alignSelf: 'stretch'
  },
  details: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: tokens.space1,
    flexGrow: 1,
    flexShrink: 0,
    flexBasis: 0,
    cursor: 'pointer'
  },
  label: {
    fontFamily: fontTokens.fontFamilySans,
    fontSize: tokens.fontSizeBase,
    fontWeight: tokens.fontWeightMedium,
    color: tokens.colorTextPrimary,
    lineHeight: tokens.lineHeightNormal
  },
  description: {
    fontFamily: fontTokens.fontFamilySans,
    fontSize: tokens.fontSizeSm,
    color: tokens.colorTextMuted,
    lineHeight: tokens.lineHeightNormal
  },
  rail: {
    boxSizing: 'border-box',
    display: 'flex',
    width: '44px',
    height: '24px',
    paddingTop: '2px',
    paddingRight: '2px',
    paddingBottom: '2px',
    paddingLeft: '2px',
    alignItems: 'center',
    justifyContent: 'flex-start',
    borderRadius: tokens.radiusFull,
    cursor: 'pointer',
    userSelect: 'none',
    borderWidth: 0,
    borderStyle: 'solid',
    borderColor: 'transparent',
    transitionProperty: 'background-color',
    transitionDuration: '150ms',
    transitionTimingFunction: 'ease-out'
  },
  railUnchecked: {
    backgroundColor: tokens.colorBorderStrong
  },
  railChecked: {
    backgroundColor: tokens.colorSuccess
  },
  railDisabled: {
    cursor: 'not-allowed',
    pointerEvents: 'none',
    opacity: 0.5
  },
  knob: {
    boxSizing: 'border-box',
    width: '20px',
    height: '20px',
    flexShrink: 0,
    borderRadius: tokens.radiusFull,
    backgroundColor: tokens.colorControlKnob,
    transitionProperty: 'transform',
    transitionDuration: '150ms',
    transitionTimingFunction: 'ease-out'
  },
  knobUnchecked: {
    transform: 'translateX(0px)'
  },
  knobChecked: {
    transform: 'translateX(20px)'
  }
})
