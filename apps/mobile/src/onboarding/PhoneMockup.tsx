import { Image, type ImageSourcePropType, StyleSheet, View } from 'react-native'
import deviceFrame from '../../../../assets/onboarding/device-frame.png'
import { ScreenVideo } from './ScreenVideo'

const FRAME_WIDTH = 1350
const FRAME_HEIGHT = 2760
const SCREEN_LEFT = 72
const SCREEN_TOP = 69
const SCREEN_WIDTH = 1206
const SCREEN_HEIGHT = 2622
const SCREEN_CORNER_RATIO = 0.13

interface PhoneMockupProps {
  screen: ImageSourcePropType
  video?: number
  playing?: boolean
  width: number
}

export function PhoneMockup({ screen, video, playing = true, width }: PhoneMockupProps) {
  const scale = width / FRAME_WIDTH
  const screenWidth = SCREEN_WIDTH * scale
  const screenHeight = SCREEN_HEIGHT * scale
  const height = FRAME_HEIGHT * scale
  const screenSize = { width: screenWidth, height: screenHeight }

  return (
    <View style={{ width, height }}>
      <View
        style={[
          styles.screen,
          {
            left: SCREEN_LEFT * scale,
            top: SCREEN_TOP * scale,
            width: screenWidth,
            height: screenHeight,
            borderRadius: screenWidth * SCREEN_CORNER_RATIO
          }
        ]}
      >
        <Image source={screen} resizeMode='cover' style={screenSize} />
        {video ? (
          <ScreenVideo source={video} playing={playing} style={[styles.video, screenSize]} />
        ) : null}
      </View>
      <Image source={deviceFrame} style={[styles.frame, { width, height }]} resizeMode='stretch' />
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
