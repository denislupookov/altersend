import { css } from 'react-strict-dom'
import { tokens } from '../../theme/tokens.css'

export const styles = css.create({
  banner: {
    paddingTop: tokens.space3,
    paddingBottom: tokens.space3,
    paddingLeft: tokens.space4,
    paddingRight: tokens.space4,
    borderRadius: tokens.radius2xl,
    borderWidth: 1,
    borderColor: tokens.colorDanger,
    backgroundColor: tokens.colorDangerSubtle
  },
  message: {
    margin: 0,
    fontSize: tokens.fontSizeMd,
    lineHeight: 20,
    color: tokens.colorDanger
  }
})
