import { css, html } from 'react-strict-dom'

const spin = css.keyframes({
  '0%': { transform: 'rotate(0deg)' },
  '100%': { transform: 'rotate(360deg)' }
})

const styles = css.create({
  root: {
    borderRadius: '50%',
    borderStyle: 'solid',
    borderColor: 'transparent',
    animationName: spin,
    animationDuration: '650ms',
    animationTimingFunction: 'linear',
    animationIterationCount: 'infinite',
    flexShrink: 0
  }
})

export interface SpinnerProps {
  size?: number
  color?: string
}

export function Spinner({ size = 14, color = 'currentColor' }: SpinnerProps) {
  const borderWidth = Math.max(1.5, Math.round(size * 0.12))
  return (
    <html.div
      style={[
        styles.root,
        { width: size, height: size, borderWidth, borderTopColor: color } as never
      ]}
    />
  )
}
