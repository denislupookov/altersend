import { css } from 'react-strict-dom'

export const styles = css.create({
  trailing: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  children: {
    paddingLeft: 40
  },
  chevron: {
    display: 'flex',
    alignItems: 'center',
    transitionProperty: 'transform',
    transitionDuration: '200ms'
  },
  chevronOpen: {
    transform: 'rotate(90deg)'
  }
})
