import { useEffect, useRef, type ReactNode } from 'react'
import { Animated, Easing, StyleSheet, View } from 'react-native'
import { BURST_DURATION_MS, PIECES, PIECE_SIZE } from './constants'

export interface SuccessBurstProps {
  icon: ReactNode
  markColor: string
  tones: string[]
  size?: number
  play?: boolean
}

export function SuccessBurst({
  icon,
  markColor,
  tones,
  size = 96,
  play = true
}: SuccessBurstProps) {
  const mark = useRef(new Animated.Value(0)).current
  const burst = useRef(new Animated.Value(0)).current
  const reach = size * 1.9

  useEffect(() => {
    if (!play) return

    const animation = Animated.parallel([
      Animated.spring(mark, { toValue: 1, friction: 5, tension: 90, useNativeDriver: true }),
      Animated.timing(burst, {
        toValue: 1,
        duration: BURST_DURATION_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      })
    ])

    animation.start()
    return () => animation.stop()
  }, [burst, mark, play])

  return (
    <View style={[styles.wrap, { width: size * 3, height: size * 3 }]} pointerEvents='none'>
      {PIECES.map((piece, i) => (
        <Animated.View
          key={i}
          style={[
            styles.piece,
            {
              backgroundColor: tones[piece.tone % tones.length],
              opacity: burst.interpolate({ inputRange: [0, 0.75, 1], outputRange: [1, 1, 0] }),
              transform: [
                {
                  translateX: burst.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, piece.x * reach]
                  })
                },
                {
                  translateY: burst.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, piece.y * reach + piece.drift * size]
                  })
                },
                {
                  rotate: burst.interpolate({
                    inputRange: [0, 1],
                    outputRange: [`${piece.tilt}deg`, `${piece.tilt + 220}deg`]
                  })
                }
              ]
            }
          ]}
        />
      ))}

      <Animated.View
        style={[
          styles.mark,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: markColor,
            opacity: mark,
            transform: [{ scale: mark }]
          }
        ]}
      >
        {icon}
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  piece: {
    position: 'absolute',
    width: PIECE_SIZE,
    height: PIECE_SIZE * 2,
    borderRadius: PIECE_SIZE / 2
  },
  mark: { alignItems: 'center', justifyContent: 'center' }
})
