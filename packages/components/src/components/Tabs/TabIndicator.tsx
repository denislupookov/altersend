import { useLayoutEffect, useRef, useState } from 'react'
import { css, html } from 'react-strict-dom'
import { tokens } from '../../theme/tokens.css'

interface TabIndicatorProps {
  activeIndex: number
  count: number
  stretch: boolean
}

const INSET = 4

const styles = css.create({
  layer: {
    position: 'absolute',
    top: INSET,
    left: INSET,
    right: INSET,
    bottom: INSET,
    pointerEvents: 'none'
  },
  pill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderRadius: tokens.radiusSm,
    backgroundColor: tokens.colorSurfacePrimary,
    transitionProperty: 'transform, width',
    transitionDuration: '200ms',
    transitionTimingFunction: 'ease'
  },
  pillPercent: (widthPct: number, offsetPct: number) => ({
    width: `${widthPct}%`,
    transform: `translateX(${offsetPct}%)`
  }),
  pillMeasured: (left: number, width: number) => ({
    width: `${width}px`,
    transform: `translateX(${left}px)`
  })
})

export function TabIndicator({ activeIndex, count, stretch }: TabIndicatorProps) {
  const layerRef = useRef<HTMLDivElement | null>(null)
  const [measured, setMeasured] = useState<{ left: number; width: number } | null>(null)

  useLayoutEffect(() => {
    if (stretch) return
    const list = layerRef.current?.parentElement
    if (!list) return

    const measure = () => {
      const trigger = list.querySelectorAll('[role="tab"]')[activeIndex] as HTMLElement | undefined
      if (!trigger) return
      const listRect = list.getBoundingClientRect()
      const triggerRect = trigger.getBoundingClientRect()
      setMeasured({ left: triggerRect.left - listRect.left - INSET, width: triggerRect.width })
    }

    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [activeIndex, count, stretch])

  const showPill = stretch || measured !== null

  return (
    <html.div ref={layerRef} style={styles.layer}>
      {showPill ? (
        <html.div
          style={[
            styles.pill,
            stretch
              ? styles.pillPercent(100 / count, activeIndex * 100)
              : styles.pillMeasured(measured!.left, measured!.width)
          ]}
        />
      ) : null}
    </html.div>
  )
}
