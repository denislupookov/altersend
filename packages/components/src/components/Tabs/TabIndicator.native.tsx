import { useEffect, useRef, useState } from 'react'
import { Animated, StyleSheet, View, type LayoutChangeEvent } from 'react-native'
import { radius, useTheme } from '../../theme'

interface TabIndicatorProps {
  activeIndex: number
  count: number
  stretch: boolean
}

export function TabIndicator({ activeIndex, count, stretch }: TabIndicatorProps) {
  const { theme } = useTheme()
  const [width, setWidth] = useState(0)
  const translateX = useRef(new Animated.Value(0)).current
  const slot = stretch && count > 0 ? width / count : 0

  useEffect(() => {
    if (slot <= 0) {
      return
    }
    Animated.timing(translateX, {
      toValue: activeIndex * slot,
      duration: 200,
      useNativeDriver: true
    }).start()
  }, [activeIndex, slot, translateX])

  const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)

  if (!stretch || count < 1) {
    return null
  }

  return (
    <View pointerEvents='none' style={styles.layer} onLayout={onLayout}>
      <Animated.View
        style={[
          styles.pill,
          {
            width: `${100 / count}%`,
            backgroundColor: theme.colors.colorTabIndicator,
            transform: [{ translateX }]
          }
        ]}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  layer: { position: 'absolute', top: 4, left: 4, right: 4, bottom: 4 },
  pill: { position: 'absolute', top: 0, bottom: 0, borderRadius: radius.radiusSm }
})
