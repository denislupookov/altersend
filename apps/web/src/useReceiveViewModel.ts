import { useEffect, useRef, useState } from 'react'
import { isValidJoinCode } from '@altersend/domain'
import { useTranslation } from '@altersend/locales'
import { connect, connectErrorCode, type Connection } from './transfer'
import { shouldZip, isInAppBrowser, ZipDownload } from './transfer/storage'
import type { FileOffer, TextOffer } from './transfer/peerProtocol'
import type { ConnectionPhase, TransferFile } from './types'

function readCodeFromUrl(): string | null {
  const fromHash = window.location.hash.replace(/^#/, '').trim()
  return fromHash ? fromHash : null
}

function scrubUrl(): void {
  window.history.replaceState(null, '', window.location.pathname)
}

export interface ReceiveViewModel {
  code: string
  phase: ConnectionPhase
  files: TransferFile[]
  texts: TextOffer[]
  error: string
  isAwaitingCode: boolean
  tooLarge: boolean
  inApp: boolean
  forceZip: boolean
  setForceZip: (value: boolean) => void
  setCode: (value: string) => void
  start: () => void
  cancel: () => void
  download: (offerIds: string[]) => void
  downloadAll: () => void
  paste: () => void
  reset: () => void
}

export function useReceiveViewModel(): ReceiveViewModel {
  const { t } = useTranslation(['web'])

  const [code, setCodeState] = useState('')
  const [phase, setPhase] = useState<ConnectionPhase>('idle')
  const [files, setFiles] = useState<TransferFile[]>([])
  const [texts, setTexts] = useState<TextOffer[]>([])
  const [error, setError] = useState('')
  const [maxTransferBytes, setMaxTransferBytes] = useState<number | null>(null)
  const [forceZip, setForceZip] = useState(true)

  const connectionRef = useRef<Connection | null>(null)
  const connectAbort = useRef<AbortController | null>(null)
  const filesRef = useRef<TransferFile[]>([])
  const queue = useRef<string[]>([])
  const draining = useRef(false)
  const autoStarted = useRef(false)

  const putFiles = (next: TransferFile[]) => {
    filesRef.current = next
    setFiles(next)
  }
  const patchFile = (id: string, patch: Partial<TransferFile>) =>
    putFiles(filesRef.current.map((f) => (f.offer.id === id ? { ...f, ...patch } : f)))
  const statusOf = (id: string) => filesRef.current.find((f) => f.offer.id === id)?.status

  const describeError = (cause: unknown): string => {
    const errorCode = connectErrorCode(cause)
    if (errorCode) return t(`web:errors.${errorCode}`)
    console.warn('Connect failed:', cause)
    return t('web:errors.connectionFailed')
  }

  const closeConnection = () => {
    connectionRef.current?.close()
    connectionRef.current = null
    queue.current = []
  }

  const handlePeerClosed = () => {
    queue.current = []
    if (filesRef.current.length === 0) return
    putFiles(
      filesRef.current.map((f) => (f.status === 'downloading' ? { ...f, status: 'failed' } : f))
    )
    setPhase('disconnected')
  }

  const runConnect = (codeToUse: string) => {
    const trimmed = codeToUse.trim()
    if (!isValidJoinCode(trimmed)) {
      setError(t('web:join.invalidCode'))
      return
    }

    const alreadySaved = new Map(
      filesRef.current.filter((f) => f.status === 'completed').map((f) => [f.offer.id, f])
    )

    closeConnection()
    scrubUrl()
    const controller = new AbortController()
    connectAbort.current = controller
    setPhase('connecting')
    setError('')
    putFiles([])
    setTexts([])

    connect(
      trimmed,
      {
        onClosed: handlePeerClosed,
        onLimit: (bytes) => {
          if (!controller.signal.aborted) setMaxTransferBytes(bytes)
        }
      },
      controller.signal
    )
      .then((connection) => {
        if (controller.signal.aborted) {
          connection.close()
          return
        }
        connectionRef.current = connection
        setMaxTransferBytes(connection.maxTransferBytes ?? null)
        putFiles(
          connection.offers.map((offer) => {
            const saved = alreadySaved.get(offer.id)
            return saved ? { ...saved, offer } : { offer, received: 0, status: 'idle' }
          })
        )
        setTexts(connection.texts)
        setPhase('connected')
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return
        setPhase('idle')
        setError(describeError(cause))
      })
  }

  const cancelConnect = () => {
    connectAbort.current?.abort()
    connectAbort.current = null
    closeConnection()
    scrubUrl()
    setError('')
    setPhase('idle')
  }

  const reset = () => {
    closeConnection()
    scrubUrl()
    setPhase('idle')
    setCodeState('')
    putFiles([])
    setTexts([])
    setError('')
  }

  const downloadOne = async (offer: FileOffer, toOpfs: boolean): Promise<File | null> => {
    const connection = connectionRef.current
    if (!connection) return null
    patchFile(offer.id, { status: 'downloading' })
    let received: File | null = null
    try {
      await connection.download(
        offer,
        {
          onProgress: (bytes) => patchFile(offer.id, { received: bytes }),
          onDone: (_name, size, file) => {
            patchFile(offer.id, { status: 'completed', received: size })
            received = file
          }
        },
        toOpfs
      )
    } catch (cause) {
      patchFile(offer.id, { status: 'failed' })
      throw cause
    }
    return received
  }

  const drainQueue = async (zip: boolean): Promise<void> => {
    let zipDl: ZipDownload | null = null
    if (zip) {
      const count = connectionRef.current?.offers.length ?? 0
      zipDl = await ZipDownload.open(`altersend-${count}-files.zip`)
    }
    while (queue.current.length > 0) {
      const id = queue.current.shift()
      if (!id) continue
      const offer = connectionRef.current?.offers.find((o) => o.id === id)
      if (!offer) continue
      const status = statusOf(id)
      if (status === 'completed' || status === 'paused') continue
      try {
        const file = await downloadOne(offer, zip)
        if (zipDl && file) await zipDl.addFile(offer.name, file)
      } catch (cause) {
        setError(describeError(cause))
        if (zipDl) {
          await zipDl.abort(cause)
          return
        }
      }
    }
    if (zipDl) await zipDl.finish()
  }

  const download = (offerIds: string[]) => {
    const connection = connectionRef.current
    if (!connection) return
    const total = connection.offers.reduce((sum, o) => sum + (o.size || 0), 0)
    const limit = connection.maxTransferBytes
    if (limit != null && total > limit) return

    for (const offer of connection.offers) {
      if (!offerIds.includes(offer.id)) continue
      if (queue.current.includes(offer.id)) continue

      const status = statusOf(offer.id)
      if (status === 'completed' || status === 'downloading') continue
      if (status === 'paused' || status === 'failed') patchFile(offer.id, { status: 'idle' })
      queue.current.push(offer.id)
    }
    if (draining.current || queue.current.length === 0) return

    draining.current = true
    drainQueue(shouldZip(offerIds.length, forceZip))
      .catch((cause) => setError(describeError(cause)))
      .finally(() => {
        draining.current = false
      })
  }

  const downloadAll = () => download(connectionRef.current?.offers.map((offer) => offer.id) ?? [])

  const setCode = (value: string) => {
    setCodeState(value)
    setError('')
  }

  const paste = () => {
    navigator.clipboard
      .readText()
      .then((text) => {
        if (text) setCode(text.trim())
      })
      .catch((cause: unknown) => console.warn('Clipboard read failed', cause))
  }

  const runConnectRef = useRef(runConnect)
  runConnectRef.current = runConnect

  useEffect(() => {
    if (autoStarted.current) return
    autoStarted.current = true
    const urlCode = readCodeFromUrl()
    if (!urlCode) return
    setCodeState(urlCode)
    if (isValidJoinCode(urlCode)) runConnectRef.current(urlCode)
  }, [])

  useEffect(() => () => closeConnection(), [])

  const isAwaitingCode =
    phase !== 'connecting' && phase !== 'disconnected' && files.length === 0 && texts.length === 0

  const offeredBytes = files.reduce((sum, f) => sum + (f.offer.size || 0), 0)
  const tooLarge = files.length > 0 && maxTransferBytes != null && offeredBytes > maxTransferBytes

  return {
    code,
    phase,
    files,
    texts,
    error,
    isAwaitingCode,
    tooLarge,
    inApp: isInAppBrowser(),
    forceZip,
    setForceZip,
    setCode,
    start: () => runConnect(code),
    cancel: cancelConnect,
    download,
    downloadAll,
    paste,
    reset
  }
}
