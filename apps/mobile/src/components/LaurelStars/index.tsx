import { memo } from 'react'
import Svg, { Path } from 'react-native-svg'

const W = 270
const H = 90

const STEM = { cx: 58, cy: 46, r: 40, from: (122 * Math.PI) / 180, to: (232 * Math.PI) / 180 }
const PAIRS = 6
const OUTER = { angle: 52, length: 23, width: 7.6 }
const INNER = { angle: 44, length: 15, width: 5.2 }
const TIP = { length: 17, width: 5.6 }
const STEM_WIDTH = 2.8

const STAR = { r: 13, inner: 0.48, gap: 6, round: 2.6 }

type Point = readonly [number, number]

const fmt = (n: number) => n.toFixed(2)

function leaf(at: Point, direction: Point, length: number, width: number, mirror: boolean): string {
  const angle = Math.atan2(direction[0], -direction[1])
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const place = ([x, y]: Point) => {
    const px = at[0] + x * cos - y * sin
    const py = at[1] + x * sin + y * cos
    return `${fmt(mirror ? W - px : px)},${fmt(py)}`
  }
  const l = length
  const w = width
  return (
    `M${place([0, 0])}` +
    ` C${place([w, -l * 0.28])} ${place([w * 0.9, -l * 0.72])} ${place([0, -l])}` +
    ` C${place([-w * 0.9, -l * 0.72])} ${place([-w, -l * 0.28])} ${place([0, 0])}Z`
  )
}

function branch(mirror: boolean): { stem: string; leaves: string } {
  const { cx, cy, r, from, to } = STEM
  const at = (t: number): Point => [cx + r * Math.cos(t), cy + r * Math.sin(t)]
  const x = (value: number) => fmt(mirror ? W - value : value)

  const [sx, sy] = at(from)
  const [ex, ey] = at(to)
  const stem = `M${x(sx)},${fmt(sy)} A${r},${r} 0 0 ${mirror ? 0 : 1} ${x(ex)},${fmt(ey)}`

  const leaves: string[] = []
  for (let i = 0; i < PAIRS; i++) {
    const t = from + ((to - from) * (i + 0.5)) / PAIRS
    const tangent: Point = [-Math.sin(t), Math.cos(t)]
    const outward: Point = [Math.cos(t), Math.sin(t)]
    const scale = 0.72 + 0.28 * (1 - i / (PAIRS - 1))
    for (const [side, spec] of [
      [1, OUTER],
      [-1, INNER]
    ] as const) {
      const a = (spec.angle * Math.PI) / 180
      const direction: Point = [
        tangent[0] * Math.cos(a) + side * outward[0] * Math.sin(a),
        tangent[1] * Math.cos(a) + side * outward[1] * Math.sin(a)
      ]
      leaves.push(leaf(at(t), direction, spec.length * scale, spec.width * scale, mirror))
    }
  }
  leaves.push(leaf([ex, ey], [-Math.sin(to), Math.cos(to)], TIP.length, TIP.width, mirror))

  return { stem, leaves: leaves.join(' ') }
}

function stars(): string {
  const { r, inner, gap } = STAR
  const count = 5
  const total = count * 2 * r + (count - 1) * gap
  const paths: string[] = []
  for (let s = 0; s < count; s++) {
    const cx = W / 2 - total / 2 + r + s * (2 * r + gap)
    const points: string[] = []
    for (let i = 0; i < 10; i++) {
      const radius = i % 2 === 1 ? r * inner : r
      const a = -Math.PI / 2 + (i * Math.PI) / 5
      points.push(`${fmt(cx + radius * Math.cos(a))},${fmt(H / 2 + radius * Math.sin(a))}`)
    }
    paths.push(`M${points.join(' L')}Z`)
  }
  return paths.join(' ')
}

const LEADING = branch(false)
const TRAILING = branch(true)
const STARS = stars()

interface LaurelStarsProps {
  width: number
  color: string
}

export const LaurelStars = memo(function LaurelStars({ width, color }: LaurelStarsProps) {
  return (
    <Svg
      width={width}
      height={(width * H) / W}
      viewBox={`0 0 ${W} ${H}`}
      accessibilityElementsHidden
      importantForAccessibility='no-hide-descendants'
    >
      {[LEADING, TRAILING].map((side, index) => (
        <Path
          key={`stem-${index}`}
          d={side.stem}
          fill='none'
          stroke={color}
          strokeWidth={STEM_WIDTH}
          strokeLinecap='round'
        />
      ))}
      <Path d={LEADING.leaves} fill={color} />
      <Path d={TRAILING.leaves} fill={color} />
      <Path d={STARS} fill={color} stroke={color} strokeWidth={STAR.round} strokeLinejoin='round' />
    </Svg>
  )
})
