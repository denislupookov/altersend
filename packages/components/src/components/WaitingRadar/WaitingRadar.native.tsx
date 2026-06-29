import { useEffect, useRef, type ReactNode } from 'react'
import { Animated, Easing, StyleSheet, View } from 'react-native'
import { withAlpha } from '../../theme/withAlpha'
import { RADAR_RINGS, RADAR_DURATION_MS } from './constants'

export interface WaitingRadarProps {
  icon: ReactNode
  color: string
  pulsing: boolean
  size?: number
}

export function WaitingRadar({ icon, color, pulsing, size = 176 }: WaitingRadarProps) {
  const core = Math.round(size * 0.43)
  const values = useRef(Array.from({ length: RADAR_RINGS }, () => new Animated.Value(0))).current

  useEffect(() => {
    if (!pulsing) {
      values.forEach((v) => v.setValue(0))
      return
    }
    const anims = values.map((v, i) =>
      Animated.sequence([
        Animated.delay((i * RADAR_DURATION_MS) / RADAR_RINGS),
        Animated.loop(
          Animated.timing(v, {
            toValue: 1,
            duration: RADAR_DURATION_MS,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true
          })
        )
      ])
    )
    anims.forEach((a) => a.start())
    return () => anims.forEach((a) => a.stop())
  }, [pulsing, values])

  const offset = (size - core) / 2

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      {pulsing &&
        values.map((v, i) => (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              top: offset,
              left: offset,
              width: core,
              height: core,
              borderRadius: core / 2,
              backgroundColor: color,
              opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0] }),
              transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 2.15] }) }]
            }}
          />
        ))}
      <View
        style={{
          width: core,
          height: core,
          borderRadius: core / 2,
          borderWidth: 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: withAlpha(color, 0.14),
          borderColor: pulsing ? 'transparent' : color
        }}
      >
        {icon}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center'
  }
})
