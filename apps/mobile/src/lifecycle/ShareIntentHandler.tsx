import { useEffect } from 'react'
import { router } from 'expo-router'
import { useShareIntent } from 'expo-share-intent'
import { replaceSelectedFiles, continueShare, type SelectedFile } from '@altersend/domain'

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

    replaceSelectedFiles(files)
    router.navigate('/send')
    void continueShare(files)
    resetShareIntent()
  }, [hasShareIntent, shareIntent, resetShareIntent])

  return null
}
