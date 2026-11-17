import type { OnboardingStepKind } from '@altersend/domain'
import deviceFrame from '../../../../assets/onboarding/device-frame.png'
import sendDemoPoster from '../../../../assets/onboarding/send-demo-poster.png'
import sendDemoVideo from '../../../../assets/onboarding/send-demo.mp4'
import shareScreen from '../../../../assets/onboarding/share.png'
import receiveScreen from '../../../../assets/onboarding/receive.png'
import relayScreen from '../../../../assets/onboarding/relay.png'
import type { DeviceFrame, StepMedia } from './types'

export const STEP_MEDIA: Record<OnboardingStepKind, StepMedia> = {
  welcome: { screen: sendDemoPoster, video: sendDemoVideo },
  receive: { screen: receiveScreen },
  private: { screen: shareScreen },
  network: { screen: relayScreen }
}

export const DEVICE_FRAME: DeviceFrame = {
  image: deviceFrame,
  width: 1350,
  height: 2760,
  screenLeft: 72,
  screenTop: 69,
  screenWidth: 1206,
  screenHeight: 2622,
  screenCornerRatio: 0.13
}
