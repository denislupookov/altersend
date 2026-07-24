import { useEffect, useState } from 'react'
import { MAX_DISPLAY_NAME_LEN } from '@altersend/core'
import { reportError } from '../transfer/binding'

export interface DeviceRenameTarget {
  peerKey: string
  name: string
}

export function isRenameSubmittable(value: string, initialName: string): boolean {
  const trimmed = value.trim()
  return (
    trimmed.length > 0 && trimmed.length <= MAX_DISPLAY_NAME_LEN && trimmed !== initialName.trim()
  )
}

interface UseDeviceRenameFormArgs {
  open: boolean
  initialName: string
  onRename: (name: string) => Promise<boolean>
  onClose: () => void
}

export function useDeviceRenameForm({
  open,
  initialName,
  onRename,
  onClose
}: UseDeviceRenameFormArgs) {
  const [value, setValue] = useState(initialName)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setValue(initialName)
    setIsSaving(false)
  }, [open, initialName])

  const canSave = isRenameSubmittable(value, initialName)

  const save = (): void => {
    if (!canSave || isSaving) return
    setIsSaving(true)
    onRename(value.trim())
      .then((renamed) => {
        if (renamed) onClose()
        else setIsSaving(false)
      })
      .catch((error) => {
        reportError('renameDevice', error)
        setIsSaving(false)
      })
  }

  return { value, setValue, canSave, isSaving, maxLength: MAX_DISPLAY_NAME_LEN, save }
}
