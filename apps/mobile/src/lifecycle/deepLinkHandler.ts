import * as Linking from 'expo-linking'
import { router } from 'expo-router'
import { canJoinFromDeepLink, extractJoinCode, isPairUrl, joinSession } from '@altersend/domain'

let started = false
let subscription: { remove(): void } | null = null

export function startDeepLinkHandler(): () => void {
  if (started) return teardown
  started = true

  void Linking.getInitialURL().then((url) => {
    if (url) handleUrl(url)
  })

  subscription = Linking.addEventListener('url', ({ url }) => handleUrl(url))

  return teardown
}

const ALLOWED_SCHEMES = ['altersend://', 'com.altersend.mobile://']

function handleUrl(url: string): void {
  if (!ALLOWED_SCHEMES.some((s) => url.startsWith(s))) return
  const code = extractJoinCode(url)
  if (!code) return

  if (isPairUrl(url)) {
    try {
      router.navigate({ pathname: '/devices', params: { pairCode: code } })
    } catch (err) {
      console.warn('deepLinkHandler: pair navigate failed', err)
    }
    return
  }

  if (!canJoinFromDeepLink(code)) {
    console.warn('deepLinkHandler: ignoring incoming URL — session already active')
    return
  }

  try {
    router.navigate('/receive')
  } catch (err) {
    console.warn('deepLinkHandler: navigate failed', err)
  }
  void joinSession(code).catch((err) => {
    console.warn('deepLinkHandler: joinSession failed', err)
  })
}

function teardown(): void {
  if (!started) return
  started = false
  if (subscription) {
    subscription.remove()
    subscription = null
  }
}
