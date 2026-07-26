import { useEffect, useRef, useState } from 'react'
import { isValidJoinCode } from '@altersend/domain'
import { useTranslation } from '@altersend/locales'
import { connect, connectErrorCode, type ConnectStage, type Connection } from './transfer'
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
  stage: ConnectStage | null
  error: string
  isAwaitingCode: boolean
  setCode: (value: string) => void
  start: () => void
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
  const [stage, setStage] = useState<ConnectStage | null>(null)
  const [error, setError] = useState('')

  const connectionRef = useRef<Connection | null>(null)
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
    return cause instanceof Error ? cause.message : String(cause)
  }

  const closeConnection = () => {
    connectionRef.current?.close()
    connectionRef.current = null
    queue.current = []
  }

  const handlePeerClosed = () => {
    queue.current = []
    draining.current = false
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
    setPhase('connecting')
    setError('')
    putFiles([])
    setTexts([])

    connect(trimmed, { onStatus: setStage, onClosed: handlePeerClosed })
      .then((connection) => {
        connectionRef.current = connection
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
        setPhase('idle')
        setError(describeError(cause))
      })
  }

  const reset = () => {
    closeConnection()
    scrubUrl()
    setPhase('idle')
    setCodeState('')
    putFiles([])
    setTexts([])
    setStage(null)
    setError('')
  }

  const downloadOne = async (offer: FileOffer): Promise<void> => {
    const connection = connectionRef.current
    if (!connection) return
    patchFile(offer.id, { status: 'downloading' })
    try {
      await connection.download(offer, {
        onProgress: (received) => patchFile(offer.id, { received }),
        onDone: (_name, size) => patchFile(offer.id, { status: 'completed', received: size })
      })
    } catch (cause) {
      patchFile(offer.id, { status: 'failed' })
      throw cause
    }
  }

  const drainQueue = async (): Promise<void> => {
    while (queue.current.length > 0) {
      const id = queue.current.shift()
      if (!id) continue
      const offer = connectionRef.current?.offers.find((o) => o.id === id)
      if (!offer) continue
      const status = statusOf(id)
      if (status === 'completed' || status === 'paused') continue
      try {
        await downloadOne(offer)
      } catch (cause) {
        setError(describeError(cause))
      }
    }
  }

  const download = (offerIds: string[]) => {
    const connection = connectionRef.current
    if (!connection) return

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
    drainQueue().finally(() => {
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

  return {
    code,
    phase,
    files,
    texts,
    stage,
    error,
    isAwaitingCode,
    setCode,
    start: () => runConnect(code),
    download,
    downloadAll,
    paste,
    reset
  }
}
