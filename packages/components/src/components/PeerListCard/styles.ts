import { css } from 'react-strict-dom'
import { tokens } from '../../theme/tokens.css'

export const styles = css.create({
  section: {
    overflow: 'hidden',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: tokens.colorBorderPrimary,
    borderRadius: tokens.radiusMd,
    backgroundColor: tokens.colorBackgroundSubtle
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.space3,
    paddingBlock: tokens.space25,
    paddingInline: tokens.space4,
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: tokens.colorBorderPrimary
  },
  headerLabel: {
    margin: 0,
    color: tokens.colorTextSecondary,
    fontFamily: tokens.fontFamilySans,
    fontSize: tokens.fontSizeXs,
    fontWeight: tokens.fontWeightSemibold,
    lineHeight: tokens.lineHeightNormal,
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  headerCount: {
    margin: 0,
    color: tokens.colorTextMuted,
    fontFamily: tokens.fontFamilySans,
    fontSize: tokens.fontSizeXs,
    lineHeight: tokens.lineHeightNormal
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    margin: 0,
    padding: 0
  },
  row: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.space2,
    paddingBlock: tokens.space25,
    paddingInline: tokens.space4,
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: tokens.colorBorderPrimary
  },
  rowInner: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.space3
  },
  progressTrack: {
    height: tokens.space1,
    overflow: 'hidden',
    borderRadius: tokens.radiusFull,
    backgroundColor: tokens.colorBorderPrimary
  },
  progressBar: (percent: number) => ({
    height: '100%',
    width: `${percent}%`,
    borderRadius: tokens.radiusFull,
    backgroundColor: tokens.colorInfo,
    transitionDuration: '300ms',
    transitionProperty: 'width',
    transitionTimingFunction: 'ease-out'
  }),
  rowLast: {
    borderBottomWidth: 0
  },
  rowDimmed: {
    opacity: 0.55
  },
  identity: {
    display: 'flex',
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space25,
    minWidth: 0
  },
  avatar: {
    width: tokens.space6,
    height: tokens.space6,
    flexShrink: 0,
    borderRadius: tokens.radiusFull,
    backgroundColor: tokens.colorInfoSubtle,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarText: {
    margin: 0,
    color: tokens.colorInfo,
    fontFamily: tokens.fontFamilySans,
    fontSize: 10,
    fontWeight: tokens.fontWeightBold,
    letterSpacing: 0.5,
    textTransform: 'uppercase'
  },
  textBlock: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minWidth: 0,
    gap: tokens.space05
  },
  peerKey: {
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    color: tokens.colorTextPrimary,
    fontFamily: tokens.fontFamilyMono,
    fontSize: tokens.fontSizeMd,
    lineHeight: tokens.lineHeightSnug
  },
  detail: {
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    color: tokens.colorTextMuted,
    fontFamily: tokens.fontFamilySans,
    fontSize: tokens.fontSizeXs,
    lineHeight: tokens.lineHeightNormal
  },
  rowRight: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space3,
    flexShrink: 0
  },
  status: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space15,
    flexShrink: 0
  },
  pairedText: {
    margin: 0,
    color: tokens.colorSuccess,
    fontFamily: tokens.fontFamilySans,
    fontSize: tokens.fontSizeSm,
    fontWeight: tokens.fontWeightSemibold
  },
  requestedText: {
    margin: 0,
    color: tokens.colorTextMuted,
    fontFamily: tokens.fontFamilySans,
    fontSize: tokens.fontSizeSm,
    fontWeight: tokens.fontWeightMedium,
    lineHeight: tokens.lineHeightNormal
  },
  statusDot: {
    width: tokens.space15,
    height: tokens.space15,
    borderRadius: tokens.radiusFull
  },
  statusText: {
    margin: 0,
    fontFamily: tokens.fontFamilySans,
    fontSize: tokens.fontSizeSm,
    fontWeight: tokens.fontWeightMedium
  },
  dotOnline: { backgroundColor: tokens.colorInfo },
  dotDownloading: { backgroundColor: tokens.colorInfo },
  dotDownloaded: { backgroundColor: tokens.colorSuccess },
  dotFailed: { backgroundColor: tokens.colorDanger },
  dotDisconnected: { backgroundColor: tokens.colorTextMuted },
  textOnline: { color: tokens.colorInfo },
  textDownloading: { color: tokens.colorInfo },
  textDownloaded: { color: tokens.colorSuccess },
  textFailed: { color: tokens.colorDanger },
  textDisconnected: { color: tokens.colorTextMuted }
})
