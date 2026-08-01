const NAMED_IN_APP =
  /FBAN|FBAV|Instagram|Line\/|Twitter|Snapchat|TikTok|musical_ly|MicroMessenger|KAKAOTALK|WhatsApp/i
const ANDROID_WEBVIEW = /; wv\)/
const IOS = /iPhone|iPad|iPod/
const IOS_THIRD_PARTY = /CriOS|FxiOS|EdgiOS|OPiOS|GSA|DuckDuckGo/i
const REAL_SAFARI = /Version\/\d/

function hasInjectedWebViewGlobal(): boolean {
  if (typeof window === 'undefined') return false
  return typeof (window as { TelegramWebviewProxy?: unknown }).TelegramWebviewProxy !== 'undefined'
}

export function isInAppBrowser(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''

  if (hasInjectedWebViewGlobal()) return true
  if (NAMED_IN_APP.test(ua) || ANDROID_WEBVIEW.test(ua)) return true

  const isUnbrandedIosWebView = IOS.test(ua) && !IOS_THIRD_PARTY.test(ua) && !REAL_SAFARI.test(ua)
  return isUnbrandedIosWebView
}

function isTouchDevice(): boolean {
  return typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches
}

export function shouldZip(fileCount: number, forceZip: boolean): boolean {
  return fileCount > 1 && (isTouchDevice() || forceZip)
}
