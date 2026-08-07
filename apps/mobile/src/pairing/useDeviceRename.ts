import { useEffect, useRef, useState } from 'react'
import type { DeviceRenameTarget } from '@altersend/domain'
import { useTranslation } from '@altersend/locales'
import { useToast } from '@/src/components/Toast'

export const SHEET_TRANSITION_MS = 250

type RenameFn = (peerKey: string, displayName: string) => Promise<boolean>

export function useDeviceRename(rename: RenameFn) {
  const { t } = useTranslation(['settings'])
  const toast = useToast()
  const [target, setTarget] = useState<DeviceRenameTarget | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  const openRename = (next: DeviceRenameTarget): void => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setTarget(next), SHEET_TRANSITION_MS)
  }

  const renameDevice = async (name: string): Promise<boolean> => {
    if (!target) return false

    const renamed = await rename(target.peerKey, name)
    toast.show({
      title: t(renamed ? 'settings:pairing.deviceRenamed' : 'settings:pairing.renameFailed'),
      tone: renamed ? 'success' : 'error'
    })
    return renamed
  }

  return {
    openRename,
    renameSheet: {
      open: target !== null,
      initialName: target?.name ?? '',
      onClose: () => setTarget(null),
      onRename: renameDevice
    }
  }
}
