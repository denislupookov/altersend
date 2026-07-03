import { type ReactNode } from 'react'
import { css, html } from 'react-strict-dom'
import { RADAR_RINGS, RADAR_DURATION_MS } from './constants'

export interface WaitingRadarProps {
  icon: ReactNode
  color: string
  pulsing: boolean
  size?: number
}

const ping = css.keyframes({
  '0%': { transform: 'scale(1)', opacity: 0.3 },
  '100%': { transform: 'scale(2.15)', opacity: 0 }
})

const styles = css.create({
  wrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  ring: {
    position: 'absolute',
    borderRadius: '50%'
  },
  core: {
    position: 'relative',
    borderRadius: '50%',
    borderWidth: 2,
    borderStyle: 'solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }
})

export function WaitingRadar({ icon, color, pulsing, size = 176 }: WaitingRadarProps) {
  const coreSize = Math.round(size * 0.43)

  return (
    <html.div style={[styles.wrap, { width: size, height: size } as never]}>
      {pulsing &&
        Array.from({ length: RADAR_RINGS }, (_, i) => (
          <html.div
            key={i}
            style={[
              styles.ring,
              {
                width: coreSize,
                height: coreSize,
                backgroundColor: color,
                animationName: ping,
                animationDuration: `${RADAR_DURATION_MS}ms`,
                animationDelay: `${(i * RADAR_DURATION_MS) / RADAR_RINGS}ms`,
                animationTimingFunction: 'cubic-bezier(0.25, 0, 0, 1)',
                animationIterationCount: 'infinite',
                animationFillMode: 'backwards'
              } as never
            ]}
          />
        ))}
      <html.div
        style={[
          styles.core,
          {
            width: coreSize,
            height: coreSize,
            backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)`,
            borderColor: pulsing ? 'transparent' : color
          } as never
        ]}
      >
        {icon}
      </html.div>
    </html.div>
  )
}
