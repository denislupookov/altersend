import * as Linking from 'expo-linking'
import { router } from 'expo-router'
import {
  canJoinFromDeepLink,
  extractJoinCode,
  isPairUrl,
  joinSession,
  webAppUrl
} from '@altersend/domain'

let started = false
let subscription: { remove(): void } | null = null
let routerReady = false
let pendingPairCode: string | null = null

export function startDeepLinkHandler(): () => void {
  if (started) return teardown
  started = true

  Linking.getInitialURL()
    .then((url) => {
      if (url) handleUrl(url)
    })
    .catch(() => {})

  subscription = Linking.addEventListener('url', ({ url }) => handleUrl(url))

  return teardown
}

export function markRouterReady(): void {
  if (routerReady) return
  routerReady = true

  const code = pendingPairCode
  pendingPairCode = null
  if (code) openPairing(code)
}

const ALLOWED_SCHEMES = ['altersend://', 'com.altersend.mobile://']
const RECEIVE_LINK_PREFIX = `${webAppUrl}/r`

function isAllowedUrl(url: string): boolean {
  return ALLOWED_SCHEMES.some((s) => url.startsWith(s)) || url.startsWith(RECEIVE_LINK_PREFIX)
}

function handleUrl(url: string): void {
  if (!isAllowedUrl(url)) return
  const code = extractJoinCode(url)
  if (!code) return

  if (isPairUrl(url)) {
    openPairing(code)
    return
  }

  if (!canJoinFromDeepLink(code)) {
    console.warn('deepLinkHandler: ignoring incoming URL — session already active')
    return
  }

  joinSession(code).catch((err) => {
    console.warn('deepLinkHandler: joinSession failed', err)
  })
}

function openPairing(code: string): void {
  if (!routerReady) {
    pendingPairCode = code
    return
  }

  try {
    router.navigate({ pathname: '/devices', params: { pairCode: code } })
  } catch (err) {
    console.warn('deepLinkHandler: pair navigate failed', err)
  }
}

function teardown(): void {
  if (!started) return
  started = false
  routerReady = false
  pendingPairCode = null
  if (subscription) {
    subscription.remove()
    subscription = null
  }
}
