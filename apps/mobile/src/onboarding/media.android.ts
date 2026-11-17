import type { OnboardingStepKind } from '@altersend/domain'
import deviceFrame from '../../../../assets/onboarding/android-device-frame.png'
import sendDemoPoster from '../../../../assets/onboarding/android-send-demo-poster.png'
import sendDemoVideo from '../../../../assets/onboarding/android-send-demo.mp4'
import shareScreen from '../../../../assets/onboarding/android-share.png'
import receiveScreen from '../../../../assets/onboarding/android-receive.png'
import relayScreen from '../../../../assets/onboarding/android-relay.png'
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
  height: 2757,
  screenLeft: 72,
  screenTop: 72,
  screenWidth: 1206,
  screenHeight: 2613,
  screenCornerRatio: 0.085
}
