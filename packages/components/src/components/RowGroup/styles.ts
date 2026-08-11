import { css } from 'react-strict-dom'
import { tokens } from '../../theme/tokens.css'

export const styles = css.create({
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8
  },
  heading: {
    margin: 0,
    fontSize: 13,
    fontWeight: '500',
    color: tokens.colorTextMuted
  },
  card: {
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: tokens.colorBorderPrimary,
    borderRadius: tokens.radius2xl,
    overflow: 'hidden',
    backgroundColor: tokens.colorBackgroundSubtle
  }
})
