import type { OnboardingSlideKind } from '@altersend/domain'
import type { SvgProps } from 'react-native-svg'
import PrivateSharingSvg from '../../../../assets/private-sharing.svg'
import SyncDevicesSvg from '../../../../assets/sync_devices.svg'
import ShareLinkSvg from '../../../../assets/share-link.svg'

const ILLUSTRATIONS: Record<OnboardingSlideKind, React.FC<SvgProps>> = {
  privacy: PrivateSharingSvg,
  pair: SyncDevicesSvg,
  link: ShareLinkSvg
}

export function OnboardingIllustration({
  kind,
  height
}: {
  kind: OnboardingSlideKind
  height: number
}) {
  const Svg = ILLUSTRATIONS[kind]
  return <Svg height={height} />
}
