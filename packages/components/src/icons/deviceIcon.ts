import { LaptopIcon, MonitorIcon, SmartphoneIcon, TabletIcon } from './set'
import type { IconComponent } from './types'

export function deviceIcon(deviceType: string): IconComponent {
  switch (deviceType) {
    case 'laptop':
      return LaptopIcon
    case 'desktop':
      return MonitorIcon
    case 'tablet':
      return TabletIcon
    default:
      return SmartphoneIcon
  }
}
