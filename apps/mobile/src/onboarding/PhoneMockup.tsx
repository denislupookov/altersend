import { Image, type ImageSourcePropType, StyleSheet, View } from 'react-native'
import { DEVICE_FRAME } from './media'
import { ScreenVideo } from './ScreenVideo'

interface PhoneMockupProps {
  screen: ImageSourcePropType
  video?: number
  playing?: boolean
  width: number
}

export function PhoneMockup({ screen, video, playing = true, width }: PhoneMockupProps) {
  const scale = width / DEVICE_FRAME.width
  const screenWidth = DEVICE_FRAME.screenWidth * scale
  const screenHeight = DEVICE_FRAME.screenHeight * scale
  const height = DEVICE_FRAME.height * scale
  const screenSize = { width: screenWidth, height: screenHeight }

  return (
    <View style={{ width, height }}>
      <View
        style={[
          styles.screen,
          {
            left: DEVICE_FRAME.screenLeft * scale,
            top: DEVICE_FRAME.screenTop * scale,
            width: screenWidth,
            height: screenHeight,
            borderRadius: screenWidth * DEVICE_FRAME.screenCornerRatio
          }
        ]}
      >
        <Image source={screen} resizeMode='cover' style={screenSize} />
        {video ? (
          <ScreenVideo source={video} playing={playing} style={[styles.video, screenSize]} />
        ) : null}
      </View>
      <Image
        source={DEVICE_FRAME.image}
        style={[styles.frame, { width, height }]}
        resizeMode='stretch'
      />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    position: 'absolute',
    overflow: 'hidden'
  },
  video: {
    position: 'absolute',
    left: 0,
    top: 0
  },
  frame: {
    position: 'absolute',
    left: 0,
    top: 0
  }
})
