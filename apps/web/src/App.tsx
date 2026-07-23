import { useState, useEffect, useRef } from 'react'
import { isValidJoinCode } from '@altersend/domain'
import { useTranslation } from '@altersend/locales'
import {
  connect,
  connectErrorCode,
  type ConnectStage,
  type Connection
} from './transfer/webReceiver'
import type { FileOffer, TextOffer } from './transfer/peerProtocol'
import { BrandHeader, Footer, LanguageSelect } from './components'
import { ConnectingScreen, DownloadScreen, EnterCodeScreen } from './screens'
import type { ConnectionPhase, TransferFile } from './types'

function readCodeFromUrl(): string | null {
  const fromHash = window.location.hash.replace(/^#/, '').trim()
  return fromHash ? fromHash : null
}

function scrubUrl(): void {
  window.history.replaceState(null, '', window.location.pathname)
}

export default function App() {
  const { t } = useTranslation(['web'])
  const [code, setCode] = useState('')
  const [phase, setPhase] = useState<ConnectionPhase>('idle')
  const [files, setFiles] = useState<TransferFile[]>([])
  const [texts, setTexts] = useState<TextOffer[]>([])
  const [stage, setStage] = useState<ConnectStage | null>(null)
  const [error, setError] = useState('')

  const autoStarted = useRef(false)
  const connectionRef = useRef<Connection | null>(null)
  const filesRef = useRef<TransferFile[]>([])
  const queue = useRef<string[]>([])
  const draining = useRef(false)

  const describeError = (cause: unknown): string => {
    const errorCode = connectErrorCode(cause)
    if (errorCode) return t(`web:errors.${errorCode}`)
    return cause instanceof Error ? cause.message : String(cause)
  }

  const putFiles = (next: TransferFile[]) => {
    filesRef.current = next
    setFiles(next)
  }

  const patchFile = (id: string, patch: Partial<TransferFile>) =>
    putFiles(filesRef.current.map((f) => (f.offer.id === id ? { ...f, ...patch } : f)))

  const statusOf = (id: string) => filesRef.current.find((f) => f.offer.id === id)?.status

  const closeConnection = () => {
    connectionRef.current?.close()
    connectionRef.current = null
    queue.current = []
  }

  const runConnect = (codeToUse: string) => {
    const trimmed = codeToUse.trim()
    if (!isValidJoinCode(trimmed)) {
      setError(t('web:join.invalidCode'))
      return
    }

    closeConnection()
    scrubUrl()
    setPhase('connecting')
    setError('')
    putFiles([])
    setTexts([])

    connect(trimmed, { onStatus: setStage })
      .then((connection) => {
        connectionRef.current = connection
        putFiles(connection.offers.map((offer) => ({ offer, received: 0, status: 'idle' })))
        setTexts(connection.texts)
        setPhase('connected')
      })
      .catch((cause: unknown) => {
        setPhase('idle')
        setError(describeError(cause))
      })
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
      await downloadOne(offer)
    }
  }

  const enqueue = (offerIds: string[]) => {
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
    drainQueue()
      .catch((cause: unknown) => setError(describeError(cause)))
      .finally(() => {
        draining.current = false
      })
  }

  const downloadAll = () => enqueue(connectionRef.current?.offers.map((offer) => offer.id) ?? [])

  const pauseDownloads = (offerIds: string[]) => {
    for (const offerId of offerIds) {
      queue.current = queue.current.filter((id) => id !== offerId)
      connectionRef.current?.pause(offerId)
      patchFile(offerId, { status: 'paused' })
    }
  }

  const paste = () => {
    navigator.clipboard
      .readText()
      .then((text) => {
        if (!text) return
        setCode(text.trim())
        setError('')
      })
      .catch((cause: unknown) => console.warn('Clipboard read failed', cause))
  }

  const reset = () => {
    closeConnection()
    scrubUrl()
    setPhase('idle')
    setCode('')
    putFiles([])
    setTexts([])
    setStage(null)
    setError('')
  }

  const runConnectRef = useRef(runConnect)
  runConnectRef.current = runConnect

  useEffect(() => {
    if (autoStarted.current) return
    autoStarted.current = true
    const urlCode = readCodeFromUrl()
    if (!urlCode) return
    setCode(urlCode)
    if (isValidJoinCode(urlCode)) runConnectRef.current(urlCode)
  }, [])

  useEffect(() => () => closeConnection(), [])

  const renderScreen = () => {
    if (phase === 'connecting') return <ConnectingScreen stage={stage} />

    if (files.length > 0 || texts.length > 0) {
      return (
        <DownloadScreen
          files={files}
          texts={texts}
          error={error || undefined}
          onDownload={enqueue}
          onPause={pauseDownloads}
          onDownloadAll={downloadAll}
          onResumeAll={downloadAll}
          onReset={reset}
        />
      )
    }

    return (
      <EnterCodeScreen
        code={code}
        error={error || undefined}
        onChange={(value) => {
          setCode(value)
          if (error) setError('')
        }}
        onPaste={paste}
        onConnect={() => runConnect(code)}
      />
    )
  }

  return (
    <div className='relative flex min-h-screen w-full flex-col items-center bg-background px-6 pb-11 pt-13'>
      <div className='absolute right-6 top-6'>
        <LanguageSelect />
      </div>

      <BrandHeader />

      {renderScreen()}

      <Footer />
    </div>
  )
}
