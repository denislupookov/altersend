import { SegmentedProgress } from '@altersend/components'
import { StyleSheet, View } from 'react-native'

interface PageIndicatorProps {
  count: number
  index: number
}

export function PageIndicator({ count, index }: PageIndicatorProps) {
  return (
    <View style={styles.wrap}>
      <SegmentedProgress count={count} activeIndex={index} />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'center',
    width: 64,
    marginTop: 4
  }
})
