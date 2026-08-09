import * as Clipboard from 'expo-clipboard'
import { formatAccountCode, useCopiedFlag } from '@altersend/domain'
import { impactTap } from './haptics'

const COPY_ID = 'account-code'

export function useCopyAccountCode(code: string | undefined, onCopied?: () => void) {
  const { copiedId, flashCopied } = useCopiedFlag()

  const copyCode = () => {
    if (!code) return

    Clipboard.setStringAsync(formatAccountCode(code))
      .then(() => {
        flashCopied(COPY_ID)
        onCopied?.()
        return impactTap()
      })
      .catch((err) => console.warn('[account] clipboard write failed', err))
  }

  return { copied: copiedId === COPY_ID, copyCode }
}
