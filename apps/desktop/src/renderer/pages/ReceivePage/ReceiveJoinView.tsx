import { useState, type ChangeEvent } from 'react'
import { Button, Input } from '@altersend/components'
import { ChevronRightIcon, QrCodeIcon } from '@altersend/components/icons'
import {
  getDisplayError,
  getTransferErrorCode,
  isValidJoinCode,
  joinSession,
  TRANSFER_ERROR_CODES,
  type TransferErrorCode,
  useTransferStore
} from '@altersend/domain'
import { useTranslation } from '@altersend/locales'
import { WebcamScanView } from './WebcamScanView'

export function ReceiveJoinView() {
  const { t } = useTranslation(['receive', 'common', 'errors'])
  const [joinKey, setJoinKey] = useState('')
  const [showValidation, setShowValidation] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [localErrorCode, setLocalErrorCode] = useState<TransferErrorCode | null>(null)
  const [mode, setMode] = useState<'paste' | 'scan'>('paste')
  const storeErrorCode = useTransferStore((s) => s.errorCode)
  const displayStoreError = getDisplayError(t, storeErrorCode, {
    invalidTopicKey: 'receive:errors.invalidKey'
  })

  if (mode === 'scan') {
    return <WebcamScanView onCancel={() => setMode('paste')} />
  }

  const trimmedJoinKey = joinKey.trim()
  const isValidJoinKey = isValidJoinCode(trimmedJoinKey)
  const joinKeyError =
    showValidation && trimmedJoinKey.length > 0 && !isValidJoinKey
      ? t('receive:errors.invalidKey')
      : (getDisplayError(t, localErrorCode, { invalidTopicKey: 'receive:errors.invalidKey' }) ??
        displayStoreError ??
        undefined)

  const join = async () => {
    setShowValidation(true)
    if (!isValidJoinKey) return
    try {
      setIsJoining(true)
      setLocalErrorCode(null)
      await joinSession(trimmedJoinKey)
    } catch (error) {
      setIsJoining(false)
      setLocalErrorCode(getTransferErrorCode(error, TRANSFER_ERROR_CODES.joinFailed))
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
            {t('receive:actions.scanOrImportQr')}
          </span>
          <span className='block text-[12px] leading-snug text-text-muted'>
            {t('receive:actions.scanOrImportQrHintDesktop')}
          </span>
        </span>
        <span className='shrink-0 text-text-muted transition-transform group-hover:translate-x-0.5'>
          <ChevronRightIcon size={16} />
        </span>
      </button>

      <div className='py-0.5 text-center text-[12px] text-text-muted'>
        {t('receive:form.orPasteCode')}
      </div>

      <div className='flex flex-col gap-3.5'>
        <Input
          autoCapitalize='none'
          autoComplete='off'
          disabled={isJoining}
          error={joinKeyError}
          secure
          label={t('receive:form.codeLabel')}
          mono
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            setJoinKey(e.currentTarget.value)
            if (showValidation) setShowValidation(false)
            if (localErrorCode) setLocalErrorCode(null)
          }}
          placeholder={t('receive:form.codePlaceholder')}
          spellCheck={false}
          type='text'
          value={joinKey}
        />

        <div>
          <Button disabled={isJoining} onClick={() => void join()} size='sm' variant='primary'>
            {isJoining ? t('common:actions.connecting') : t('common:actions.connect')}
          </Button>
        </div>
      </div>
    </div>
  )
}
