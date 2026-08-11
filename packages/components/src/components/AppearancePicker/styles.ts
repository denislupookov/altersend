import { css } from 'react-strict-dom'
import { fontTokens, tokens } from '../../theme/tokens.css'

export const styles = css.create({
  options: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: tokens.space2,
    padding: tokens.space3
  },
  tile: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.space2,
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,
    padding: tokens.space2,
    borderRadius: tokens.radiusLg,
    backgroundColor: 'transparent',
    cursor: 'pointer',
    transitionDuration: '150ms',
    transitionProperty: 'background-color',
    transitionTimingFunction: 'ease',
    ':hover': {
      backgroundColor: tokens.colorOverlayHover
    },
    ':focus-visible': {
      outlineStyle: 'none',
      boxShadow: `inset 0 0 0 2px ${tokens.colorFocusRing}`
    }
  },
  tileSelected: {
    backgroundColor: tokens.colorSurfaceHover
  },
  preview: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    aspectRatio: 1.7,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: tokens.colorBorderPrimary,
    borderRadius: tokens.radiusSm,
    overflow: 'hidden'
  },
  half: {
    position: 'relative',
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    overflow: 'hidden'
  },
  halfStart: {
    display: 'flex',
    position: 'absolute',
    insetBlock: 0,
    insetInlineStart: 0,
    width: '200%'
  },
  halfEnd: {
    display: 'flex',
    position: 'absolute',
    insetBlock: 0,
    insetInlineEnd: 0,
    width: '200%'
  },
  window: {
    display: 'flex',
    flexDirection: 'row',
    flexGrow: 1,
    height: '100%'
  },
  windowSidebar: {
    width: '26%',
    height: '100%'
  },
  windowContent: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    gap: tokens.space1,
    paddingBlock: tokens.space2,
    paddingInline: tokens.space15
  },
  bar: {
    height: 3,
    borderRadius: tokens.radiusFull
  },
  barWide: {
    width: '82%'
  },
  barMedium: {
    width: '64%'
  },
  barNarrow: {
    width: '52%'
  },
  labelRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.space1
  },
  label: {
    margin: 0,
    color: tokens.colorTextPrimary,
    fontFamily: fontTokens.fontFamilySans,
    fontSize: tokens.fontSizeMd,
    fontWeight: tokens.fontWeightMedium,
    lineHeight: tokens.lineHeightSnug,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  check: {
    display: 'flex',
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center'
  },
  fill: (color: string) => ({
    backgroundColor: color
  })
})
