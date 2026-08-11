import { useCallback, useEffect } from 'react'
import { toSelectedFiles, useExternalFileHandoff } from '@altersend/domain'
import { bridgeApi, hasBridge } from '../api/bridgeApi'
import { captureException } from '../sentry'

export function useExternalFiles(onAccepted: () => void) {
  const handoff = useExternalFileHandoff(onAccepted)
  const { offer } = handoff

  const receive = useCallback((files: PickedFile[]) => offer(toSelectedFiles(files)), [offer])

  useEffect(() => {
    if (!hasBridge()) return

    const unsubscribe = bridgeApi.onExternalFiles(receive)

    bridgeApi
      .externalFilesReady()
      .then(receive)
      .catch((err) => captureException(err, 'externalFilesReady'))

    return unsubscribe
  }, [receive])

  return handoff
}
