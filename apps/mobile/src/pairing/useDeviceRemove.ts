import { useEffect, useRef, useState } from 'react'
import type { DeviceRenameTarget } from '@altersend/domain'
import { useTranslation } from '@altersend/locales'
import { useToast } from '@/src/components/Toast'
import type { ConfirmDialogProps } from '@/src/components/ConfirmDialog'
import { SHEET_TRANSITION_MS } from './useDeviceRename'

type ForgetFn = (peerKey: string) => Promise<boolean>

export function useDeviceRemove(forget: ForgetFn) {
  const { t } = useTranslation(['settings', 'common'])
  const toast = useToast()
  const [target, setTarget] = useState<DeviceRenameTarget | null>(null)
  const [open, setOpen] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  const confirmRemove = (next: DeviceRenameTarget): void => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      setTarget(next)
      setOpen(true)
    }, SHEET_TRANSITION_MS)
  }

  const removeDevice = (): void => {
    if (!target) return
    const peerKey = target.peerKey
    setOpen(false)
    forget(peerKey)
      .then((removed) =>
        toast.show({
          title: t(removed ? 'settings:pairing.deviceRemoved' : 'settings:pairing.removeFailed'),
          tone: removed ? 'success' : 'error'
        })
      )
      .catch((error) => {
        console.warn('useDeviceRemove: forgetPeer failed', error)
        toast.show({ title: t('settings:pairing.removeFailed'), tone: 'error' })
      })
  }

  const removeDialog: ConfirmDialogProps = {
    open,
    title: t('settings:pairing.removeConfirmTitle', { name: target?.name ?? '' }),
    message: t('settings:pairing.removeConfirmMessage'),
    confirmLabel: t('settings:pairing.removeDevice'),
    cancelLabel: t('common:actions.cancel'),
    destructive: true,
    onConfirm: removeDevice,
    onCancel: () => setOpen(false)
  }

  return { confirmRemove, removeDialog }
}
