import { useWindowDimensions } from 'react-native'
import Svg, {
  Defs,
  G,
  Line,
  LinearGradient,
  Mask,
  RadialGradient,
  Rect,
  Stop
} from 'react-native-svg'
import { heroBackdrop, useTheme, withAlpha, type HeroBackdropStop } from '@altersend/components'

interface HeroBackdropProps {
  height?: number
}

const percent = (value: number) => `${value}%`

export function HeroBackdrop({ height = heroBackdrop.height }: HeroBackdropProps) {
  const { theme } = useTheme()
  const { width } = useWindowDimensions()
  const tint = theme.colors.colorInfo
  const { gridSize, glowCenter, maskCenter } = heroBackdrop

  const columns = Array.from({ length: Math.ceil(width / gridSize) }, (_, i) => (i + 1) * gridSize)
  const rows = Array.from({ length: Math.ceil(height / gridSize) }, (_, i) => (i + 1) * gridSize)

  const tintStops = (stops: HeroBackdropStop[]) =>
    stops.map((stop) => (
      <Stop key={stop.offset} offset={stop.offset} stopColor={tint} stopOpacity={stop.alpha} />
    ))

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id='wash' x1='0' y1='0' x2='0' y2='1'>
          {tintStops(heroBackdrop.wash)}
        </LinearGradient>

        <RadialGradient
          id='glow'
          cx={percent(glowCenter.x)}
          cy={percent(glowCenter.y)}
          rx={percent(glowCenter.radiusX)}
          ry={percent(glowCenter.radiusY)}
        >
          {tintStops(heroBackdrop.glow)}
        </RadialGradient>

        <RadialGradient
          id='gridFade'
          cx={percent(maskCenter.x)}
          cy={percent(maskCenter.y)}
          rx={percent(maskCenter.radiusX)}
          ry={percent(maskCenter.radiusY)}
        >
          {heroBackdrop.mask.map((stop) => (
            <Stop
              key={stop.offset}
              offset={stop.offset}
              stopColor='white'
              stopOpacity={stop.alpha}
            />
          ))}
        </RadialGradient>

        <Mask id='gridMask'>
          <Rect width={width} height={height} fill='url(#gridFade)' />
        </Mask>
      </Defs>

      <Rect width={width} height={height} fill='url(#wash)' />
      <Rect width={width} height={height} fill='url(#glow)' />

      <G mask='url(#gridMask)' stroke={withAlpha(tint, heroBackdrop.gridAlpha)} strokeWidth={1}>
        {columns.map((x) => (
          <Line key={`column-${x}`} x1={x} y1={0} x2={x} y2={height} />
        ))}
        {rows.map((y) => (
          <Line key={`row-${y}`} x1={0} y1={y} x2={width} y2={y} />
        ))}
      </G>
    </Svg>
  )
}
