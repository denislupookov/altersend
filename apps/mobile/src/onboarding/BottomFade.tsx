import { StyleSheet, View } from 'react-native'
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg'

interface BottomFadeProps {
  color: string
  height: number
}

export function BottomFade({ color, height }: BottomFadeProps) {
  return (
    <View pointerEvents='none' style={[styles.fade, { height }]}>
      <Svg width='100%' height='100%'>
        <Defs>
          <LinearGradient id='onboardingFade' x1='0' y1='0' x2='0' y2='1'>
            <Stop offset='0' stopColor={color} stopOpacity={0} />
            <Stop offset='0.75' stopColor={color} stopOpacity={1} />
            <Stop offset='1' stopColor={color} stopOpacity={1} />
          </LinearGradient>
        </Defs>
        <Rect width='100%' height='100%' fill='url(#onboardingFade)' />
      </Svg>
    </View>
  )
}

const styles = StyleSheet.create({
  fade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0
  }
})
