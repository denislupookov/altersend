import type { Translate } from '../i18n'
import type { RelayMode, RelayTestState } from './useRelaySettings'

export interface RelayModeLabel {
  label: string
  caption: string
}

export interface RelaySettingsLabels {
  groupLabel: string
  modes: Record<RelayMode, RelayModeLabel>
  selfhostTitle: string
  selfhostDescription: string
  placeholder: string
  apply: string
  clear: string
  fallbackTitle: string
  fallbackStay: RelayModeLabel
  fallbackAltersend: RelayModeLabel
  setupGuide: string
  commitFailed: string
}

export function relaySettingsLabels(t: Translate): RelaySettingsLabels {
  const mode = (name: RelayMode): RelayModeLabel => ({
    label: t(`settings:relay.mode.${name}.label`),
    caption: t(`settings:relay.mode.${name}.caption`)
  })

  return {
    groupLabel: t('settings:rows.connection'),
    modes: {
      altersend: mode('altersend'),
      custom: mode('custom'),
      off: mode('off')
    },
    selfhostTitle: t('settings:relay.selfhost.label'),
    selfhostDescription: t('settings:relay.selfhost.description'),
    placeholder: t('settings:relay.selfhost.placeholder'),
    apply: t('settings:relay.selfhost.apply'),
    clear: t('settings:relay.selfhost.clear'),
    fallbackTitle: t('settings:relay.selfhost.fallback.title'),
    fallbackStay: {
      label: t('settings:relay.selfhost.fallback.stay.label'),
      caption: t('settings:relay.selfhost.fallback.stay.caption')
    },
    fallbackAltersend: {
      label: t('settings:relay.selfhost.fallback.altersend.label'),
      caption: t('settings:relay.selfhost.fallback.altersend.caption')
    },
    setupGuide: t('settings:relay.selfhost.setupGuide'),
    commitFailed: t('settings:relay.selfhost.failed')
  }
}

export function relayErrorText(t: Translate, error: string | null): string | undefined {
  if (!error) return undefined
  return t(`settings:relay.selfhost.${error}`)
}

export function relayTestText(
  t: Translate,
  testState: RelayTestState,
  testMs: number | null
): string | undefined {
  if (testState !== 'ok') return undefined
  return t('settings:relay.selfhost.testOk', { ms: testMs ?? 0 })
}
