import { css } from 'react-strict-dom'
import { fontTokens, tokens } from '../../theme/tokens.css'

export const styles = css.create({
  group: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.space2
  },
  heading: {
    margin: 0,
    color: tokens.colorTextMuted,
    fontFamily: fontTokens.fontFamilySans,
    fontSize: tokens.fontSizeLg,
    fontWeight: tokens.fontWeightMedium,
    lineHeight: tokens.lineHeightSnug
  },
  card: {
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: tokens.colorBorderPrimary,
    borderRadius: tokens.radius2xl,
    overflow: 'hidden',
    backgroundColor: tokens.colorBackgroundSubtle
  },
  item: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space35,
    paddingInline: tokens.space4,
    paddingBlock: tokens.space4,
    backgroundColor: 'transparent',
    borderWidth: 0,
    outlineStyle: 'none',
    textAlign: 'left',
    width: '100%',
    boxSizing: 'border-box',
    ':focus-visible': {
      outlineStyle: 'none',
      boxShadow: 'none'
    }
  },
  itemPressable: {
    cursor: 'pointer',
    transitionDuration: '150ms',
    transitionProperty: 'background-color',
    transitionTimingFunction: 'ease',
    ':hover': {
      backgroundColor: tokens.colorSurfacePrimary
    }
  },
  iconSlot: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  iconSlotSize: (size: number) => ({
    width: size,
    height: size
  }),
  text: {
    minWidth: 0,
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.space05
  },
  label: {
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    color: tokens.colorTextPrimary,
    fontFamily: fontTokens.fontFamilySans,
    fontSize: tokens.fontSizeLg,
    fontWeight: tokens.fontWeightMedium,
    lineHeight: tokens.lineHeightSnug
  },
  labelDisabled: {
    color: tokens.colorTextMuted
  },
  labelDanger: {
    color: tokens.colorDanger
  },
  subtitle: {
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    color: tokens.colorTextMuted,
    fontFamily: fontTokens.fontFamilySans,
    fontSize: tokens.fontSizeSm,
    lineHeight: tokens.lineHeightNormal
  },
  trailing: {
    marginLeft: 'auto',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space2
  },
  value: {
    margin: 0,
    color: tokens.colorTextMuted,
    fontFamily: fontTokens.fontFamilySans,
    fontSize: tokens.fontSizeLg,
    lineHeight: tokens.lineHeightSnug,
    whiteSpace: 'nowrap'
  },
  divider: {
    height: 1,
    marginRight: tokens.space4,
    backgroundColor: tokens.colorBorderPrimary
  },
  dividerInset: (marginLeft: number) => ({
    marginLeft
  })
})
