import { formatFileSize } from '../format'
import type { Translate } from '../i18n'
import type { PrimaryDownloadAction } from '../receive/downloadModel'
import type { ReceiveRelayAllowance } from './useReceiveRelayAllowance'

export interface RelayPrimaryAction {
  label: string
  disabled: boolean
}

export function relayPrimaryAction(
  t: Translate,
  action: PrimaryDownloadAction,
  allowance: ReceiveRelayAllowance
): RelayPrimaryAction | null {
  if (!allowance.limited || action !== 'download-all') return null
  if (allowance.freePendingOffers.length === 0) {
    return { label: t('receive:actions.downloadAll'), disabled: true }
  }
  return {
    disabled: false,
    label: t('receive:relayLimit.downloadSome', {
      files: t('common:files.count', { count: allowance.freePendingOffers.length }),
      size: formatFileSize(allowance.freePendingBytes)
    })
  }
}
