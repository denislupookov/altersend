import { useCallback, useEffect } from 'react'
import { router } from 'expo-router'
import { useShareIntent } from 'expo-share-intent'
import { useTranslation } from '@altersend/locales'
import {
  getLeaveSessionMessage,
  toSelectedFiles,
  useExternalFileHandoff,
  useTransferStore
} from '@altersend/domain'
import { ConfirmDialog } from '@/src/components'

export function ShareIntentHandler() {
  const { t } = useTranslation(['common'])
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent()
  const role = useTransferStore((s) => s.role)

  const openSend = useCallback(() => {
    if (router.canDismiss()) router.dismissAll()
    router.navigate('/send')
  }, [])

  const { offer, pending, confirm, cancel } = useExternalFileHandoff(openSend)

  useEffect(() => {
    if (!hasShareIntent || !shareIntent.files?.length) return

    const files = toSelectedFiles(
      shareIntent.files.map((file) => ({
        path: file.path,
        name: file.fileName,
        size: file.size
      }))
    )

    resetShareIntent()
    offer(files)
  }, [hasShareIntent, shareIntent, resetShareIntent, offer])

  return (
    <ConfirmDialog
      open={pending}
      title={t('common:actions.endSession')}
      message={getLeaveSessionMessage(t, role)}
      confirmLabel={t('common:actions.continue')}
      cancelLabel={t('common:actions.cancel')}
      onConfirm={confirm}
      onCancel={cancel}
    />
  )
}
