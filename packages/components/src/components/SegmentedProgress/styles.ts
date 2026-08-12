import { css } from 'react-strict-dom'
import { tokens } from '../../theme/tokens.css'

export const styles = css.create({
  row: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: tokens.space15
  },
  segment: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    height: tokens.space1,
    borderRadius: tokens.radiusFull,
    backgroundColor: tokens.colorBorderStrong,
    overflow: 'hidden'
  },
  fill: {
    height: '100%',
    borderRadius: tokens.radiusFull,
    backgroundColor: tokens.colorAccent,
    transitionDuration: '260ms',
    transitionProperty: 'width',
    transitionTimingFunction: 'ease-out'
  },
  fillWidth: (percent: number) => ({
    width: `${percent}%`
  })
})
