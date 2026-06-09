export type DeviceType = 'desktop' | 'laptop' | 'phone' | 'tablet' | 'unknown'

export const DEVICE_TYPES: ReadonlySet<DeviceType> = new Set([
  'desktop',
  'laptop',
  'phone',
  'tablet',
  'unknown'
])

export function isDeviceType(value: unknown): value is DeviceType {
  return typeof value === 'string' && DEVICE_TYPES.has(value as DeviceType)
}
