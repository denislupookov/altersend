import type { AccountModel } from '@altersend/domain'

export interface AccountPhaseProps {
  model: AccountModel
  errorText: string | null
  onDismiss: () => void
}
