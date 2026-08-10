import { heroBackdrop, type HeroBackdropStop } from '@altersend/components'

const tint = (alpha: number) =>
  `color-mix(in oklab, var(--as-color-info) ${alpha * 100}%, transparent)`

const shade = (alpha: number) => `color-mix(in oklab, black ${alpha * 100}%, transparent)`

const stops = (list: HeroBackdropStop[], color: (alpha: number) => string) =>
  list.map((stop) => `${color(stop.alpha)} ${stop.offset * 100}%`).join(', ')

const { glowCenter, maskCenter, gridSize, gridAlpha } = heroBackdrop

const WASH = `linear-gradient(180deg, ${stops(heroBackdrop.wash, tint)})`

const GLOW = `radial-gradient(${glowCenter.radiusX}% ${glowCenter.radiusY}% at ${glowCenter.x}% ${glowCenter.y}%, ${stops(heroBackdrop.glow, tint)})`

const GRID = `linear-gradient(90deg, ${tint(gridAlpha)} 1px, transparent 1px), linear-gradient(180deg, ${tint(gridAlpha)} 1px, transparent 1px)`

const GRID_MASK = `radial-gradient(${maskCenter.radiusX}% ${maskCenter.radiusY}% at ${maskCenter.x}% ${maskCenter.y}%, ${stops(heroBackdrop.mask, shade)})`

export function HeroBackdrop({ height = heroBackdrop.height }: { height?: number }) {
  return (
    <div
      aria-hidden
      className='pointer-events-none absolute inset-x-0 top-0 overflow-hidden'
      style={{ height }}
    >
      <div className='absolute inset-0' style={{ background: WASH }} />
      <div className='absolute inset-0' style={{ background: GLOW }} />
      <div
        className='absolute inset-0'
        style={{
          backgroundImage: GRID,
          backgroundSize: `${gridSize}px ${gridSize}px`,
          maskImage: GRID_MASK,
          WebkitMaskImage: GRID_MASK
        }}
      />
    </div>
  )
}
