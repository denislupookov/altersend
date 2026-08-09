import { useEffect, useState, type ReactNode } from 'react'
import { css, html } from 'react-strict-dom'
import { BURST_DURATION_MS, MARK_DURATION_MS, PIECES, PIECE_SIZE } from './constants'

export interface SuccessBurstProps {
  icon: ReactNode
  markColor: string
  tones: string[]
  size?: number
  play?: boolean
}

const pop = css.keyframes({
  '0%': { transform: 'scale(0.2)', opacity: 0 },
  '70%': { transform: 'scale(1.08)', opacity: 1 },
  '100%': { transform: 'scale(1)', opacity: 1 }
})

const styles = css.create({
  wrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  piece: {
    position: 'absolute',
    transitionProperty: 'transform, opacity',
    transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)'
  },
  mark: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    animationName: pop,
    animationTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    animationFillMode: 'backwards'
  }
})

export function SuccessBurst({
  icon,
  markColor,
  tones,
  size = 96,
  play = true
}: SuccessBurstProps) {
  const [launched, setLaunched] = useState(false)
  const reach = size * 1.9

  useEffect(() => {
    if (!play) return
    const frame = requestAnimationFrame(() => setLaunched(true))
    return () => cancelAnimationFrame(frame)
  }, [play])

  return (
    <html.div style={[styles.wrap, { width: size * 3, height: size * 3 } as never]}>
      {play &&
        PIECES.map((piece, i) => (
          <html.div
            key={i}
            style={[
              styles.piece,
              {
                width: PIECE_SIZE,
                height: PIECE_SIZE * 2,
                borderRadius: PIECE_SIZE / 2,
                backgroundColor: tones[piece.tone % tones.length],
                transitionDuration: `${BURST_DURATION_MS}ms`,
                transitionDelay: `${piece.delay}ms`,
                opacity: launched ? 0 : 1,
                transform: launched
                  ? `translate(${piece.x * reach}px, ${
                      piece.y * reach + piece.drift * size
                    }px) rotate(220deg)`
                  : 'translate(0px, 0px) rotate(0deg)'
              } as never
            ]}
          />
        ))}

      <html.div
        style={[
          styles.mark,
          {
            width: size,
            height: size,
            borderRadius: '50%',
            backgroundColor: markColor,
            animationDuration: `${MARK_DURATION_MS}ms`
          } as never
        ]}
      >
        {icon}
      </html.div>
    </html.div>
  )
}
