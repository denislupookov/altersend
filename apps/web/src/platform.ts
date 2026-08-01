export type OS = 'mac' | 'windows' | 'linux' | 'ios' | 'android' | 'other'

export interface Platform {
  os: OS
}

export const OS_DISPLAY: Partial<Record<OS, string>> = {
  mac: 'Mac',
  windows: 'Windows',
  linux: 'Linux',
  ios: 'iOS',
  android: 'Android'
}

function detectOS(ua: string, touchPoints: number): OS {
  const isIpad = /macintosh/i.test(ua) && touchPoints > 1

  const rules: Array<[OS, boolean]> = [
    ['android', /android/i.test(ua)],
    ['ios', /iphone|ipad|ipod/i.test(ua) || isIpad],
    ['mac', /macintosh|mac os x/i.test(ua)],
    ['windows', /windows/i.test(ua)],
    ['linux', /linux/i.test(ua)]
  ]

  return rules.find(([, matches]) => matches)?.[0] ?? 'other'
}

function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return { os: 'other' }
  return { os: detectOS(navigator.userAgent, navigator.maxTouchPoints ?? 0) }
}

export const platform = detectPlatform()
