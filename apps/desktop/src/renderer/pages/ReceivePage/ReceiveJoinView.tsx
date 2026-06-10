import { useState, type ChangeEvent } from 'react'
import { Button, Input } from '@altersend/components'
import { ChevronRightIcon, QrCodeIcon } from '@altersend/components/icons'
import { isValidJoinCode, joinSession, useTransferStore } from '@altersend/domain'
import { WebcamScanView } from './WebcamScanView'

export function ReceiveJoinView() {
  const [joinKey, setJoinKey] = useState('')
  const [showValidation, setShowValidation] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [mode, setMode] = useState<'paste' | 'scan'>('paste')
  const storeError = useTransferStore((s) => s.errorMessage)

  if (mode === 'scan') {
    return <WebcamScanView onCancel={() => setMode('paste')} />
  }

  const trimmedJoinKey = joinKey.trim()
  const isValidJoinKey = isValidJoinCode(trimmedJoinKey)
  const joinKeyError =
    showValidation && trimmedJoinKey.length > 0 && !isValidJoinKey
      ? 'Enter a valid 64-character hex key.'
      : (localError ?? storeError ?? undefined)

  const join = async () => {
    setShowValidation(true)
    if (!isValidJoinKey) return
    try {
      setIsJoining(true)
      setLocalError(null)
      await joinSession(trimmedJoinKey)
    } catch (error) {
      setIsJoining(false)
      setLocalError(error instanceof Error ? error.message : 'Could not join the session.')
    }
  }

  return (
    <div className='flex w-full flex-col gap-4'>
      <button
        className='group flex w-full items-center gap-3 rounded-[12px] border border-border-primary bg-background-subtle p-3 text-left transition-colors hover:border-border-strong hover:bg-surface-hover disabled:opacity-50'
        disabled={isJoining}
        onClick={() => setMode('scan')}
        type='button'
      >
        <span className='flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-info/15 text-info'>
          <QrCodeIcon size={18} />
        </span>
        <span className='min-w-0 flex-1'>
          <span className='block text-[13.5px] font-semibold text-text-primary'>
            Scan or import QR
          </span>
          <span className='block text-[12px] leading-snug text-text-muted'>
            Use the webcam, or import a saved QR image
          </span>
        </span>
        <span className='shrink-0 text-text-muted transition-transform group-hover:translate-x-0.5'>
          <ChevronRightIcon size={16} />
        </span>
      </button>

      <div className='py-0.5 text-center text-[12px] text-text-muted'>or paste code</div>

      <div className='flex flex-col gap-3.5'>
        <Input
          autoCapitalize='none'
          autoComplete='off'
          disabled={isJoining}
          error={joinKeyError}
          secure
          label='Connection code'
          mono
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            setJoinKey(e.currentTarget.value)
            if (showValidation) setShowValidation(false)
            if (localError) setLocalError(null)
          }}
          placeholder='Paste 64-char code…'
          spellCheck={false}
          type='text'
          value={joinKey}
        />

        <div>
          <Button disabled={isJoining} onClick={() => void join()} size='sm' variant='primary'>
            {isJoining ? 'Connecting…' : 'Connect'}
          </Button>
        </div>
      </div>
    </div>
  )
}
