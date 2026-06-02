import { useEffect } from 'react'
import { router } from 'expo-router'
import { useShareIntent } from 'expo-share-intent'
import {
  clearSession,
  continueShare,
  replaceSelectedFiles,
  useTransferStore,
  type SelectedFile
} from '@altersend/domain'

function toFilePath(path: string): string {
  return path.startsWith('file://') ? path.slice('file://'.length) : path
}

export function ShareIntentHandler() {
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent()

  useEffect(() => {
    if (!hasShareIntent || !shareIntent.files?.length) return

    const files: SelectedFile[] = shareIntent.files.map((f) => ({
      name: f.fileName ?? f.path.split('/').pop() ?? 'file',
      path: toFilePath(f.path),
      size: f.size ?? undefined
    }))

    resetShareIntent()

    void (async () => {
      if (useTransferStore.getState().role !== null) await clearSession()
      if (router.canDismiss()) router.dismissAll()
      router.navigate('/send')
      replaceSelectedFiles(files)
      await continueShare(files)
    })()
  }, [hasShareIntent, shareIntent, resetShareIntent])

  return null
}
