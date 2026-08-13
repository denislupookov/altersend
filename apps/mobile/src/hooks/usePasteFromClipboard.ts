import * as Clipboard from 'expo-clipboard'
import { selectionTap } from '@/src/haptics'

export function usePasteFromClipboard(onText: (text: string) => void) {
  return () => {
    Clipboard.getStringAsync()
      .then((text) => {
        if (!text) return
        onText(text)
        selectionTap()
      })
      .catch((err) => console.warn('clipboard read failed', err))
  }
}
