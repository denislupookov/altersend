import { useCallback, useRef, useState } from 'react'
import { reportError } from './binding'
import { hasActiveSession, receiveExternalFiles } from './externalFiles'
import type { SelectedFile } from '../send/draftTypes'

export interface ExternalFileHandoff {
  offer: (files: SelectedFile[]) => void
  pending: boolean
  confirm: () => void
  cancel: () => void
}

export function useExternalFileHandoff(onAccepted: () => void): ExternalFileHandoff {
  const [pending, setPending] = useState<SelectedFile[] | null>(null)
  const onAcceptedRef = useRef(onAccepted)
  onAcceptedRef.current = onAccepted

  const accept = useCallback((files: SelectedFile[]) => {
    onAcceptedRef.current()
    receiveExternalFiles(files, { force: true }).catch((error) =>
      reportError('receiveExternalFiles', error)
    )
  }, [])

  const offer = useCallback(
    (files: SelectedFile[]) => {
      if (files.length === 0) return
      if (hasActiveSession()) setPending(files)
      else accept(files)
    },
    [accept]
  )

  return {
    offer,
    pending: pending !== null,
    confirm: () => {
      if (!pending) return
      setPending(null)
      accept(pending)
    },
    cancel: () => setPending(null)
  }
}
