import type { ReactNode } from 'react'
import type { InputProps } from '../Input'
import type {
  CustomRelayInput,
  RelayMode,
  RelaySettingsError,
  RelaySettingsLabels,
  RelayTestState
} from '@altersend/domain'

export interface RelaySettingsFormState {
  selected: RelayMode
  applied: CustomRelayInput | null
  fallback: boolean
  code: string
  busy: boolean
  error: RelaySettingsError | null
  testState: RelayTestState
  selectMode(mode: RelayMode): void
  setFallback(value: boolean): void
  setCode(value: string): void
  submit(): void
  clear(): void
}

export interface RelaySettingsCardProps {
  form: RelaySettingsFormState
  labels: RelaySettingsLabels
  errorText?: string
  successText?: string
  pasteAction?: ReactNode
  onOpenSetupGuide?(): void
  autoCapitalize?: InputProps['autoCapitalize']
  autoComplete?: InputProps['autoComplete']
  spellCheck?: InputProps['spellCheck']
  iconSize?: number
}
