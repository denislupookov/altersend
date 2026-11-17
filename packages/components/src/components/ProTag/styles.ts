import { css } from 'react-strict-dom'
import { fontTokens, tokens } from '../../theme/tokens.css'

export const styles = css.create({
  tag: {
    height: 22,
    paddingInline: 8,
    borderRadius: tokens.radiusFull,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colorSurfacePrimary
  },
  corner: {
    height: 17,
    paddingInline: 5,
    borderWidth: 1.5,
    borderStyle: 'solid',
    borderColor: tokens.colorBackground,
    backgroundColor: tokens.colorSurfaceTertiary
  },
  label: {
    fontFamily: fontTokens.fontFamilySans,
    fontSize: 11.5,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorTextSecondary
  },
  cornerLabel: {
    fontSize: 9.5,
    letterSpacing: 0.2,
    color: tokens.colorTextPrimary
  }
})
