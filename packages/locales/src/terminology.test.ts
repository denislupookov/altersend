import { describe, expect, it } from 'vitest'
import { RESOURCES, SUPPORTED_LOCALES, type SupportedLocaleCode } from './index'

type JsonRecord = Record<string, unknown>
type StringEntry = { path: string; value: string }

function collectStringEntries(value: unknown, prefix = ''): StringEntry[] {
  if (typeof value === 'string') return prefix ? [{ path: prefix, value }] : []
  if (!value || typeof value !== 'object' || Array.isArray(value)) return []

  return Object.entries(value as JsonRecord).flatMap(([key, child]) =>
    collectStringEntries(child, prefix ? `${prefix}.${key}` : key)
  )
}

function getString(
  locale: SupportedLocaleCode,
  namespace: keyof (typeof RESOURCES)['en-US'],
  path: string
) {
  return path.split('.').reduce<unknown>((value, key) => {
    if (!value || typeof value !== 'object') return undefined
    return (value as JsonRecord)[key]
  }, RESOURCES[locale][namespace]) as string | undefined
}

const translatedLocales = SUPPORTED_LOCALES.filter(
  (locale) => locale.code !== 'en-US' && locale.code !== 'en-GB'
)

describe('localized terminology', () => {
  it('uses media playback wording instead of game-play labels', () => {
    const gamePlayLabels: Partial<Record<SupportedLocaleCode, RegExp[]>> = {
      'de-DE': [/^Spielen$/],
      'es-419': [/^Jugar$/],
      'es-ES': [/^Jugar$/],
      'it-IT': [/^Gioca$/],
      'zh-CN': [/^玩$/],
      'zh-TW': [/^玩$/]
    }

    for (const locale of translatedLocales) {
      const playLabel = getString(locale.code, 'receive', 'actions.play')
      for (const pattern of gamePlayLabels[locale.code] ?? []) {
        expect(playLabel, locale.code).not.toMatch(pattern)
      }
    }
  })

  it('does not expose literal peer wording in send status labels', () => {
    const literalPeerTerms: Partial<Record<SupportedLocaleCode, RegExp[]>> = {
      'de-DE': [/Gleichgesinnte/i, /\bPeer\b/i],
      'es-419': [/compañero/i, /\bpar\b/i],
      'es-ES': [/compañero/i, /\bpar\b/i],
      'fr-FR': [/\bpair\b/i, /peer-to-peer/i],
      'it-IT': [/\bpeer\b/i],
      'ja-JP': [/ピア/],
      'ko-KR': [/동료/, /피어/],
      'zh-CN': [/同伴/, /对等/],
      'zh-TW': [/同伴/, /對等/]
    }
    const statusPaths = ['status.waitingForPeer', 'status.peerConnected']

    for (const locale of translatedLocales) {
      const values = statusPaths.map((path) => getString(locale.code, 'send', path) ?? '')
      for (const pattern of literalPeerTerms[locale.code] ?? []) {
        expect(values, locale.code).not.toEqual(
          expect.arrayContaining([expect.stringMatching(pattern)])
        )
      }
    }
  })

  it('does not expose implementation bridge, renderer, or worker terms in localized error UI', () => {
    const implementationTerms: Partial<Record<SupportedLocaleCode, RegExp[]>> = {
      'de-DE': [/Elektronen/i, /\bRenderer\b/i, /\bBridge\b/i, /Transfer-Worker/i],
      'es-419': [/electr[oó]nico/i, /renderizador/i, /puente de escritorio/i, /trabajador/i],
      'es-ES': [/electr[oó]nico/i, /renderizador/i, /puente de escritorio/i, /trabajador/i],
      'fr-FR': [/électronique/i, /travailleur de transfert/i],
      'it-IT': [/elettronico/i, /\brenderer\b/i, /\bbridge\b/i],
      'ja-JP': [/Electron/, /ブリッジ/, /レンダラー/, /ワーカー/],
      'ko-KR': [/전자 브리지/, /렌더러/, /브리지/, /작업자/],
      'pt-BR': [/\bponte\b/i],
      'zh-CN': [/电子桥/, /渲染器/, /桌面桥/, /Transfer Worker/],
      'zh-TW': [/電子橋/, /渲染器/, /桌面橋/, /Transfer Worker/]
    }

    for (const locale of translatedLocales) {
      const errors = collectStringEntries(RESOURCES[locale.code].errors).map((entry) => entry.value)
      for (const pattern of implementationTerms[locale.code] ?? []) {
        expect(errors, `${locale.code}: ${pattern}`).not.toEqual(
          expect.arrayContaining([expect.stringMatching(pattern)])
        )
      }
    }
  })

  it('uses close/dismiss wording for CJK dismiss actions', () => {
    expect(RESOURCES['zh-CN'].common.actions.dismiss).not.toBe('解雇')
    expect(RESOURCES['zh-TW'].common.actions.dismiss).not.toBe('解僱')
  })

  it('keeps Korean product grammar natural in visible copy', () => {
    const koreanVisibleCopy = Object.values(RESOURCES['ko-KR']).flatMap((namespace) =>
      collectStringEntries(namespace).map((entry) => entry.value)
    )

    expect(koreanVisibleCopy).not.toEqual(
      expect.arrayContaining([expect.stringContaining('은(는)')])
    )
    expect(koreanVisibleCopy).not.toEqual(
      expect.arrayContaining([expect.stringContaining('다시 시작 AlterSend')])
    )
  })

  it('does not leave broken placeholder artifacts in translated catalogs', () => {
    for (const locale of translatedLocales) {
      const values = Object.values(RESOURCES[locale.code]).flatMap((namespace) =>
        collectStringEntries(namespace).map((entry) => entry.value)
      )

      expect(values, locale.code).not.toEqual(
        expect.arrayContaining([expect.stringMatching(/PLACEholder|Placeholder/)])
      )
    }
  })
})
