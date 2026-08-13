import { css } from 'react-strict-dom'
import { fontTokens, tokens } from '../../theme/tokens.css'

export const styles = css.create({
  group: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch'
  },
  option: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: tokens.space1,
    paddingTop: tokens.space3,
    paddingRight: tokens.space4,
    paddingBottom: tokens.space3,
    paddingLeft: tokens.space4,
    borderWidth: 0,
    borderStyle: 'solid',
    borderColor: 'transparent',
    backgroundColor: {
      default: 'transparent',
      ':hover': tokens.colorOverlayHover
    },
    transitionProperty: 'background-color',
    transitionDuration: '160ms',
    textAlign: 'start',
    cursor: 'pointer',
    userSelect: 'none'
  },
  optionBlock: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch'
  },
  divider: {
    height: '1px',
    flexShrink: 0,
    backgroundColor: tokens.colorBorderPrimary,
    marginLeft: tokens.space4
  },
  optionBare: {
    paddingTop: '6px',
    paddingRight: 0,
    paddingBottom: '6px',
    paddingLeft: 0,
    backgroundColor: {
      default: 'transparent',
      ':hover': 'transparent'
    }
  },
  expansion: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    paddingTop: '10px',
    paddingLeft: tokens.space4,
    paddingRight: tokens.space4,
    paddingBottom: '20px'
  },
  optionDisabled: {
    cursor: 'not-allowed',
    opacity: 0.5,
    pointerEvents: 'none'
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.space3
  },
  control: {
    boxSizing: 'border-box',
    display: 'flex',
    width: '16px',
    height: '16px',
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: tokens.radiusFull,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: tokens.colorBorderStrong,
    backgroundColor: tokens.colorBackgroundSubtle,
    transform: 'scale(1)',
    transitionProperty: 'background-color, border-color, transform',
    transitionDuration: '150ms',
    transitionTimingFunction: 'ease-out'
  },
  controlSelected: {
    borderColor: 'transparent',
    backgroundColor: tokens.colorAccent
  },
  controlPressed: {
    transform: 'scale(0.92)'
  },
  dot: {
    width: '6px',
    height: '6px',
    borderRadius: tokens.radiusFull,
    backgroundColor: tokens.colorBackground,
    opacity: 0,
    transform: 'scale(0.4)',
    transitionProperty: 'opacity, transform',
    transitionDuration: '200ms',
    transitionTimingFunction: 'ease-out'
  },
  dotSelected: {
    opacity: 1,
    transform: 'scale(1)'
  },
  dotSelectedPressed: {
    transform: 'scale(1.33)'
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
    lineHeight: tokens.lineHeightNormal,
    paddingLeft: '28px'
  }
})
