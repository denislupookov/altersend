import { css } from 'react-strict-dom'
import { tokens } from '../../theme/tokens.css'

export const styles = css.create({
  card: {
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: tokens.colorBorderPrimary,
    borderRadius: tokens.radius2xl,
    overflow: 'hidden',
    backgroundColor: tokens.colorBackgroundSubtle
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space3,
    paddingInline: tokens.space4,
    paddingBlock: tokens.space3,
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
  rowCompact: {
    gap: tokens.space3,
    paddingTop: tokens.space25,
    paddingBottom: tokens.space25,
    paddingLeft: tokens.space25,
    paddingRight: tokens.space25
  },
  rowAlignTop: {
    alignItems: 'flex-start'
  },
  rowStandalone: {
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: tokens.colorBorderPrimary,
    borderRadius: tokens.radiusMd,
    backgroundColor: tokens.colorBackgroundSubtle,
    transitionDuration: '160ms',
    transitionProperty: 'background-color, border-color',
    ':hover': {
      backgroundColor: tokens.colorSurfacePrimary,
      borderColor: tokens.colorBorderPrimary
    }
  },
  rowBare: {
    borderWidth: 0,
    borderTopWidth: 1,
    borderTopStyle: 'solid',
    borderTopColor: tokens.colorBorderPrimary,
    borderRadius: 0,
    backgroundColor: 'transparent',
    ':hover': {
      backgroundColor: tokens.colorBackgroundSubtle,
      borderTopColor: tokens.colorBorderPrimary
    }
  },
  rowBareFirst: {
    borderTopWidth: 0
  },
  rowPressable: {
    cursor: 'pointer',
    transitionDuration: '150ms',
    transitionProperty: 'background-color',
    transitionTimingFunction: 'ease',
    ':hover': {
      backgroundColor: tokens.colorSurfacePrimary
    }
  },
  rowActive: {
    backgroundColor: tokens.colorSurfacePrimary
  },
  iconBox: {
    width: tokens.space9,
    height: tokens.space9,
    borderRadius: tokens.radiusMd,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colorSurfacePrimary
  },
  iconBoxCompact: {
    width: tokens.space9,
    height: tokens.space9,
    borderRadius: tokens.radiusMd
  },
  iconBoxCustom: (backgroundColor: string) => ({
    backgroundColor
  }),
  content: {
    minWidth: 0,
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.space05
  },
  metaRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.space3
  },
  text: {
    minWidth: 0,
    flex: 1,
    display: 'flex',
    flexDirection: 'column'
  },
  label: {
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    color: tokens.colorTextPrimary,
    fontFamily: tokens.fontFamilySans,
    fontSize: tokens.fontSizeBase,
    fontWeight: tokens.fontWeightMedium,
    lineHeight: tokens.lineHeightSnug
  },
  labelCompact: {
    fontSize: tokens.fontSizeBase
  },
  labelDisabled: {
    color: tokens.colorTextMuted
  },
  subtitle: {
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontFamily: tokens.fontFamilySans,
    fontSize: tokens.fontSizeSm,
    lineHeight: tokens.lineHeightNormal
  },
  subtitleCompact: {
    fontSize: tokens.fontSizeSm
  },
  subtitleMuted: {
    color: tokens.colorTextMuted
  },
  subtitleFaint: {
    color: tokens.colorTextFaint
  },
  subtitleSuccess: {
    color: tokens.colorSuccess
  },
  subtitleDanger: {
    color: tokens.colorDanger
  },
  subtitleInfo: {
    color: tokens.colorInfo
  },
  statusGroup: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space15,
    flexShrink: 0
  },
  statusDot: {
    width: tokens.space15,
    height: tokens.space15,
    borderRadius: tokens.radiusFull,
    flexShrink: 0
  },
  statusMuted: {
    backgroundColor: tokens.colorTextMuted
  },
  statusActive: {
    backgroundColor: tokens.colorTextPrimary
  },
  statusSuccess: {
    backgroundColor: tokens.colorSuccess
  },
  statusLabel: {
    margin: 0,
    color: tokens.colorTextSecondary,
    fontFamily: tokens.fontFamilySans,
    fontSize: tokens.fontSizeSm,
    lineHeight: tokens.lineHeightNormal
  },
  statusLabelMuted: {
    color: tokens.colorTextSecondary
  },
  statusLabelActive: {
    color: tokens.colorTextPrimary
  },
  statusLabelSuccess: {
    color: tokens.colorSuccess
  },
  progressTrack: {
    marginTop: tokens.space15,
    height: tokens.space1,
    overflow: 'hidden',
    borderRadius: tokens.radiusFull,
    backgroundColor: tokens.colorBorderPrimary
  },
  progressBar: {
    height: '100%',
    borderRadius: tokens.radiusFull,
    transitionDuration: '300ms',
    transitionProperty: 'width',
    transitionTimingFunction: 'ease-out'
  },
  progressWaiting: {
    width: '0%',
    backgroundColor: tokens.colorBorderPrimary
  },
  progressUploading: {
    width: '66.6667%',
    backgroundColor: tokens.colorInfo
  },
  progressCompleted: {
    width: '100%',
    backgroundColor: tokens.colorSuccess
  },
  progressDynamic: (percent: number) => ({
    width: `${percent}%`,
    backgroundColor: tokens.colorInfo
  }),
  trailing: {
    marginLeft: 'auto',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center'
  },
  divider: {
    height: 1,
    backgroundColor: tokens.colorBorderPrimary
  },
  dividerInset: (marginLeft: number) => ({
    marginLeft
  }),
  removeButton: {
    flexShrink: 0,
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
    color: tokens.colorTextFaint,
    cursor: 'pointer',
    transitionDuration: '150ms',
    transitionProperty: 'color, background-color',
    transitionTimingFunction: 'ease',
    ':hover': {
      color: tokens.colorTextSecondary,
      backgroundColor: tokens.colorSurfacePrimary
    }
  },
  removeButtonCompact: {
    width: tokens.space7,
    height: tokens.space7,
    borderRadius: tokens.radiusSm
  }
})
