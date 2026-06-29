import { useEffect, useRef } from 'react'
import { Animated, Easing, StyleSheet } from 'react-native'

export interface SpinnerProps {
  size?: number
  color?: string
}

export function Spinner({ size = 14, color = 'currentColor' }: SpinnerProps) {
  const rotation = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 650,
        easing: Easing.linear,
        useNativeDriver: true
      })
    )
    anim.start()
    return () => anim.stop()
  }, [rotation])

  const borderWidth = Math.max(1.5, Math.round(size * 0.12))
  const rotate = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] })

  return (
    <Animated.View
      style={[
        styles.root,
        { width: size, height: size, borderWidth, borderTopColor: color, transform: [{ rotate }] }
      ]}
    />
  )
}

const styles = StyleSheet.create({
  root: {
    borderRadius: 9999,
    borderColor: 'transparent'
  }
})
