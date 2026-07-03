import { css } from 'react-strict-dom'
import { tokens } from '../../theme/tokens.css'

export const styles = css.create({
  root: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    gap: tokens.space4,
    minHeight: 0,
    minWidth: 0,
    width: '100%'
  },
  rootStretch: {
    flex: 0
  },
  list: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space05,
    alignSelf: 'flex-start',
    padding: tokens.space1,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: tokens.colorBorderPrimary,
    borderRadius: tokens.radiusMd,
    backgroundColor: tokens.colorBackgroundSubtle
  },
  listStretch: {
    alignSelf: 'stretch',
    gap: 0
  },
  trigger: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 88,
    paddingBlock: tokens.space25,
    paddingInline: tokens.space2,
    borderWidth: 0,
    borderRadius: tokens.radiusSm,
    backgroundColor: 'transparent',
    fontFamily: tokens.fontFamilySans,
    fontSize: tokens.fontSizeBase,
    cursor: 'pointer',
    transitionDuration: '150ms',
    transitionProperty: 'background-color',
    transitionTimingFunction: 'ease',
    ':focus-visible': {
      outline: 'none',
      boxShadow: `inset 0 0 0 2px ${tokens.colorFocusRing}`
    }
  },
  triggerSm: {
    minWidth: 0,
    paddingBlock: 7,
    paddingInline: tokens.space5
  },
  triggerStretch: {
    flex: 1,
    minWidth: 0
  },
  triggerDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
    pointerEvents: 'none'
  },
  triggerLabel: {
    width: '100%',
    color: tokens.colorTextSecondary,
    fontWeight: tokens.fontWeightMedium,
    fontSize: tokens.fontSizeMd,
    textAlign: 'center',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  triggerLabelActive: {
    color: tokens.colorTextPrimary
  },
  triggerLabelSm: {
    fontSize: tokens.fontSizeMd
  },
  content: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    minHeight: 0,
    minWidth: 0,
    outline: 'none'
  }
})
