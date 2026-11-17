import type { ImageSourcePropType } from 'react-native'

export interface StepMedia {
  screen: ImageSourcePropType
  video?: number
}

export interface DeviceFrame {
  image: ImageSourcePropType
  width: number
  height: number
  screenLeft: number
  screenTop: number
  screenWidth: number
  screenHeight: number
  screenCornerRatio: number
}
