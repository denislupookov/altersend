import { useState } from 'react'
import type { SetRelayConfigInput, TestCustomRelayReply } from '@altersend/core'
import {
  formatCustomRelayString,
  parseCustomRelayString,
  type CustomRelayInput
} from './customRelay'

export type RelayMode = 'off' | 'altersend' | 'custom'

export const RELAY_MODES: RelayMode[] = ['altersend', 'custom', 'off']

export type RelaySettingsError = 'invalid' | 'failed' | 'unreachable'

export type RelayTestState = 'idle' | 'testing' | 'ok' | 'failed'

export interface RelayStoragePort {
  isEnabled(): boolean
  setEnabled(value: boolean): void
  readCustom(): CustomRelayInput | null
  writeCustom(value: CustomRelayInput | null): void
  readFallback(): boolean
  writeFallback(value: boolean): void
}

export function deriveRelayMode(enabled: boolean, custom: CustomRelayInput | null): RelayMode {
  if (!enabled) return 'off'
  return custom ? 'custom' : 'altersend'
}

interface UseRelaySettingsArgs {
  storage: RelayStoragePort
  send(input: SetRelayConfigInput): Promise<unknown>
  testConnection(): Promise<TestCustomRelayReply>
}

export function useRelaySettings({ storage, send, testConnection }: UseRelaySettingsArgs) {
  const [applied, setApplied] = useState<CustomRelayInput | null>(storage.readCustom)
  const [selected, setSelected] = useState<RelayMode>(() =>
    deriveRelayMode(storage.isEnabled(), applied)
  )
  const [fallback, setFallbackState] = useState<boolean>(storage.readFallback)
  const [code, setCodeState] = useState(() => (applied ? formatCustomRelayString(applied) : ''))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<RelaySettingsError | null>(null)
  const [testState, setTestState] = useState<RelayTestState>('idle')
  const [testMs, setTestMs] = useState<number | null>(null)

  function clearFeedback() {
    setError(null)
    setTestState('idle')
    setTestMs(null)
  }

  function relayConfig(enabled: boolean, relay: CustomRelayInput | null): SetRelayConfigInput {
    return { enabled, customRelay: relay, customRelayFallback: fallback }
  }

  function apply(input: SetRelayConfigInput, onApplied: () => void, onFailed: () => void) {
    setError(null)
    setBusy(true)
    send(input)
      .then(() => {
        storage.setEnabled(input.enabled)
        onApplied()
      })
      .catch(() => {
        onFailed()
        setError('failed')
      })
      .finally(() => setBusy(false))
  }

  function applyMode(mode: RelayMode, input: SetRelayConfigInput, onApplied: () => void) {
    const previous = selected
    setSelected(mode)
    apply(input, onApplied, () => setSelected(previous))
  }

  function rememberRelay(relay: CustomRelayInput | null) {
    storage.writeCustom(relay)
    setApplied(relay)
  }

  function runTest() {
    setTestState('testing')
    setTestMs(null)
    testConnection()
      .then(({ ok, ms }) => {
        setTestState(ok ? 'ok' : 'failed')
        setTestMs(ok ? (ms ?? null) : null)
        if (!ok) setError('unreachable')
      })
      .catch(() => {
        setTestState('failed')
        setError('unreachable')
      })
  }

  function setCode(next: string) {
    setCodeState(next)
    clearFeedback()
  }

  function submit() {
    if (busy || testState === 'testing') return

    const relay = parseCustomRelayString(code)
    if (!relay) {
      setError('invalid')
      return
    }

    applyMode('custom', relayConfig(true, relay), () => {
      rememberRelay(relay)
      runTest()
    })
  }

  function clear() {
    if (busy || !applied) return

    setCodeState('')
    clearFeedback()
    applyMode('custom', relayConfig(true, null), () => rememberRelay(null))
  }

  function selectMode(mode: RelayMode) {
    if (busy || mode === selected) return
    clearFeedback()

    if (mode === 'off') {
      applyMode('off', relayConfig(false, applied), () => {})
      return
    }

    if (mode === 'altersend') {
      applyMode('altersend', relayConfig(true, null), () => {
        rememberRelay(null)
        setCodeState('')
      })
      return
    }

    if (applied) {
      applyMode('custom', relayConfig(true, applied), () => {})
      return
    }

    setSelected('custom')
  }

  function setFallback(next: boolean) {
    if (busy || next === fallback) return

    const previous = fallback
    setFallbackState(next)

    if (!applied || selected === 'off') {
      storage.writeFallback(next)
      return
    }

    apply(
      { enabled: true, customRelay: applied, customRelayFallback: next },
      () => storage.writeFallback(next),
      () => setFallbackState(previous)
    )
  }

  return {
    selected,
    applied,
    fallback,
    code,
    busy,
    error,
    testState,
    testMs,
    selectMode,
    setFallback,
    setCode,
    submit,
    clear
  }
}
