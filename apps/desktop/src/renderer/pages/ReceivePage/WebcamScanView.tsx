import { useEffect, useRef, useState } from 'react'
import QrScanner from 'qr-scanner'
import { Button } from '@altersend/components'
import { extractJoinCode, joinSession } from '@altersend/domain'
import { bridgeApi } from '../../api/bridgeApi'
import { Select } from '../../components/Select'

interface WebcamScanViewProps {
  onCancel: () => void
}

type ScanState = 'starting' | 'scanning' | 'connecting' | 'denied' | 'no-camera' | 'failed'

const CAMERA_ERROR_STATES: Record<string, ScanState> = {
  NotAllowedError: 'denied',
  SecurityError: 'denied',
  NotFoundError: 'no-camera',
  OverconstrainedError: 'no-camera'
}

export function WebcamScanView({ onCancel }: WebcamScanViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const scannerRef = useRef<QrScanner | null>(null)
  const handledRef = useRef(false)
  const [state, setState] = useState<ScanState>('starting')
  const [cameras, setCameras] = useState<QrScanner.Camera[]>([])
  const [activeCamera, setActiveCamera] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [retryNonce, setRetryNonce] = useState(0)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const controller = new AbortController()
    const { signal } = controller
    handledRef.current = false

    const onResult = async (result: QrScanner.ScanResult) => {
      if (handledRef.current) return
      const joinCode = extractJoinCode(result.data)
      if (!joinCode) return

      handledRef.current = true
      void scannerRef.current?.stop()
      setState('connecting')

      try {
        await joinSession(joinCode)
      } catch (error) {
        if (signal.aborted) return
        handledRef.current = false
        setErrorMessage(error instanceof Error ? error.message : 'Could not join the session.')
        setState('scanning')
        void scannerRef.current?.start()
      }
    }

    const scanner = new QrScanner(video, (result) => void onResult(result), {
      preferredCamera: 'environment',
      highlightScanRegion: false,
      highlightCodeOutline: false,
      maxScansPerSecond: 8,
      returnDetailedScanResult: true
    })
    scannerRef.current = scanner

    const start = async () => {
      try {
        if (!(await bridgeApi.requestCameraAccess())) {
          signal.throwIfAborted()
          setState('denied')
          return
        }
        if (!(await QrScanner.hasCamera())) {
          signal.throwIfAborted()
          setState('no-camera')
          return
        }

        await scanner.start()
        signal.throwIfAborted()

        setState('scanning')
        const list = await QrScanner.listCameras(true)

        signal.throwIfAborted()
        setCameras(list)

        const stream = video.srcObject
        const activeId =
          stream instanceof MediaStream
            ? stream.getVideoTracks()[0]?.getSettings().deviceId
            : undefined
        if (activeId) setActiveCamera(activeId)
      } catch (error) {
        if (signal.aborted) return
        const mapped = error instanceof Error ? CAMERA_ERROR_STATES[error.name] : undefined
        if (mapped) {
          setState(mapped)
        } else {
          setErrorMessage(error instanceof Error ? error.message : 'Camera unavailable.')
          setState('failed')
        }
      }
    }
    void start()

    return () => {
      controller.abort()
      void scanner.stop()
      scanner.destroy()
      scannerRef.current = null
    }
  }, [retryNonce])

  const retry = () => {
    setErrorMessage(null)
    setState('starting')
    setRetryNonce((n) => n + 1)
  }

  const switchCamera = async (id: string) => {
    const previous = activeCamera
    setActiveCamera(id)
    try {
      await scannerRef.current?.setCamera(id)
    } catch {
      setActiveCamera(previous)
    }
  }

  const blockedMessages: Partial<Record<ScanState, { title: string; hint: string }>> = {
    denied: {
      title: 'Camera access blocked',
      hint: 'Allow camera access for AlterSend in your system settings, then try again. You can also paste the code instead.'
    },
    'no-camera': {
      title: 'No camera found',
      hint: 'Connect a webcam to scan, or paste the connection code instead.'
    },
    failed: {
      title: 'Camera unavailable',
      hint: errorMessage ?? 'The camera could not be started. Paste the connection code instead.'
    }
  }
  const blocked = blockedMessages[state] ?? null

  return (
    <div className='flex h-full w-full min-w-0 flex-col overflow-y-auto pr-1'>
      {blocked ? (
        <div className='mx-auto w-full max-w-[400px] rounded-[16px] border border-border-primary bg-background-subtle p-5'>
          <span className='block text-[15px] font-semibold text-text-primary'>{blocked.title}</span>
          <p className='m-0 mt-1.5 text-[13px] leading-relaxed text-text-muted'>{blocked.hint}</p>
          <div className='mt-4 flex items-center gap-2.5'>
            <Button onClick={retry} size='sm' variant='primary'>
              Try again
            </Button>
            <Button onClick={onCancel} size='sm' variant='secondary'>
              Paste code instead
            </Button>
          </div>
        </div>
      ) : (
        <div className='flex w-full flex-col gap-5 sm:flex-row sm:items-start'>
          <div className='relative aspect-square w-full max-w-[380px] shrink-0 overflow-hidden rounded-[16px] border border-border-primary bg-scrim'>
            <video ref={videoRef} className='h-full w-full object-cover' muted playsInline />

            {state === 'scanning' ? (
              <div className='pointer-events-none absolute inset-0 flex items-center justify-center'>
                <div
                  className='relative aspect-square w-[80%]'
                  style={{
                    boxShadow:
                      '0 0 0 9999px color-mix(in oklab, var(--as-color-scrim) 30%, transparent)'
                  }}
                >
                  <span className='absolute left-0 top-0 h-7 w-7 rounded-tl-[12px] border-l-[3px] border-t-[3px] border-text-primary' />
                  <span className='absolute right-0 top-0 h-7 w-7 rounded-tr-[12px] border-r-[3px] border-t-[3px] border-text-primary' />
                  <span className='absolute bottom-0 left-0 h-7 w-7 rounded-bl-[12px] border-b-[3px] border-l-[3px] border-text-primary' />
                  <span className='absolute bottom-0 right-0 h-7 w-7 rounded-br-[12px] border-b-[3px] border-r-[3px] border-text-primary' />
                </div>
              </div>
            ) : null}

            {state === 'starting' || state === 'connecting' ? (
              <div className='absolute inset-0 flex flex-col items-center justify-center gap-2 bg-scrim/55 text-center'>
                <span className='text-[14px] font-medium text-on-accent'>
                  {state === 'connecting' ? 'Connecting…' : 'Starting camera…'}
                </span>
                {state === 'connecting' ? (
                  <span className='text-[12px] text-on-accent/75'>
                    Joining the sender’s session.
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className='flex min-w-0 flex-1 flex-col gap-4'>
            <p className='m-0 text-[13px] leading-relaxed text-text-muted'>
              Point the sender’s QR code at the webcam — AlterSend connects automatically.
            </p>

            {errorMessage ? (
              <p className='m-0 text-[12px] leading-relaxed text-danger'>{errorMessage}</p>
            ) : null}

            {cameras.length > 1 ? (
              <div className='flex flex-col gap-1.5'>
                <span className='text-[12px] font-medium text-text-secondary'>Camera</span>
                <Select
                  aria-label='Camera'
                  value={activeCamera ?? ''}
                  onChange={(value) => void switchCamera(value)}
                  options={cameras.map((cam) => ({ value: cam.id, label: cam.label || 'Camera' }))}
                />
              </div>
            ) : null}

            <div className='flex'>
              <Button onClick={onCancel} size='sm' variant='secondary'>
                Paste code instead
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
