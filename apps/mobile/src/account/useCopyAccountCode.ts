import * as Clipboard from 'expo-clipboard'
import { formatAccountCode, useCopiedFlag } from '@altersend/domain'
import { lightTap } from '@/src/haptics'

const COPY_ID = 'account-code'

export function useCopyAccountCode(code: string | undefined, onCopied?: () => void) {
  const { copiedId, flashCopied } = useCopiedFlag()

  const copyCode = async (): Promise<boolean> => {
    if (!code) return false

    try {
      await Clipboard.setStringAsync(formatAccountCode(code))
    } catch (err) {
      console.warn('[account] clipboard write failed', err)
      return false
    }

    flashCopied(COPY_ID)
    onCopied?.()
    lightTap()

    return true
  }

  return { copied: copiedId === COPY_ID, copyCode }
}
