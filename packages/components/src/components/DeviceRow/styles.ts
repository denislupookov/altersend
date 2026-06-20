import { css } from 'react-strict-dom'
import { tokens } from '../../theme/tokens.css'

export const styles = css.create({
  row: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space25,
    minHeight: 48,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'transparent',
    borderRadius: tokens.radiusLg,
    paddingBlock: tokens.space25,
    paddingInline: 0,
    width: '100%',
    boxSizing: 'border-box'
  },
  rowButton: {
    cursor: 'pointer',
    appearance: 'none',
    backgroundColor: 'transparent',
    textAlign: 'left'
  },
  rowActive: {
    borderColor: tokens.colorBorderStrong,
    backgroundColor: tokens.colorBackgroundSubtle
  },
  iconWrap: {
    width: tokens.space8,
    height: tokens.space8,
    flexShrink: 0,
    borderRadius: tokens.radiusMd,
    borderWidth: 0,
    backgroundColor: 'transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: tokens.colorAccentHover
  },
  labels: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.space05
  },
  nameRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space2,
    minWidth: 0
  },
  name: {
    margin: 0,
    minWidth: 0,
    color: tokens.colorTextPrimary,
    fontFamily: tokens.fontFamilySans,
    fontSize: tokens.fontSizeBase,
    fontWeight: tokens.fontWeightSemibold,
    lineHeight: tokens.lineHeightSnug,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  badge: {
    flexShrink: 0,
    borderRadius: tokens.radiusXs,
    paddingBlock: tokens.space05,
    paddingInline: tokens.space2,
    backgroundColor: tokens.colorBackgroundSubtle,
    color: tokens.colorTextSecondary,
    fontFamily: tokens.fontFamilySans,
    fontSize: tokens.fontSizeMd,
    fontWeight: tokens.fontWeightMedium,
    lineHeight: tokens.lineHeightTight
  },
  badgeSuccess: {
    backgroundColor: tokens.colorSuccessSubtle,
    color: tokens.colorSuccess
  },
  subtitle: {
    margin: 0,
    color: tokens.colorTextMuted,
    fontFamily: tokens.fontFamilySans,
    fontSize: tokens.fontSizeMd,
    lineHeight: tokens.lineHeightNormal
  },
  subtitleActive: {
    color: tokens.colorSuccess
  },
  trailing: {
    marginLeft: 'auto',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center'
  },
  removeButton: {
    width: tokens.space8,
    height: tokens.space8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
    borderStyle: 'solid',
    borderRadius: tokens.radiusSm,
    backgroundColor: 'transparent',
    padding: 0,
    color: tokens.colorTextMuted,
    cursor: 'pointer',
    transitionDuration: '150ms',
    transitionProperty: 'color, background-color',
    transitionTimingFunction: 'ease',
    ':hover': {
      color: tokens.colorTextPrimary,
      backgroundColor: tokens.colorSurfacePrimary
    }
  }
})
