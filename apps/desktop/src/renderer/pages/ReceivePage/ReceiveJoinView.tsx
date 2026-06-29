import { useState, type ChangeEvent } from 'react'
import { Button, Input, LinkRow, useTheme } from '@altersend/components'
import { ClipboardIcon, QrCodeIcon } from '@altersend/components/icons'
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
import { bridgeApi } from '../../api/bridgeApi'
import { WebcamScanView } from './WebcamScanView'

export function ReceiveJoinView() {
  const { t } = useTranslation(['receive', 'common', 'errors'])
  const { theme } = useTheme()
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

  const pasteCode = async () => {
    const text = await bridgeApi.clipboardReadText()
    if (!text) return
    setJoinKey(text)
    if (showValidation) setShowValidation(false)
    if (localErrorCode) setLocalErrorCode(null)
  }

  return (
    <div className='flex w-full flex-col gap-4'>
      <LinkRow
        disabled={isJoining}
        icon={<QrCodeIcon size={18} color={theme.colors.colorInfo} />}
        iconBackground={theme.colors.colorInfoSubtle}
        label={t('receive:actions.scanOrImportQr')}
        onPress={() => setMode('scan')}
        standalone
        subtitle={t('receive:actions.scanOrImportQrHintDesktop')}
      />

      <div className='py-0.5 text-center text-[12px] text-text-muted'>
        {t('receive:form.orPasteCode')}
      </div>

      <div className='flex flex-col gap-3.5'>
        <Input
          autoCapitalize='none'
          autoComplete='off'
          disabled={isJoining}
          error={joinKeyError}
          label={t('receive:form.codeLabel')}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            setJoinKey(e.currentTarget.value)
            if (showValidation) setShowValidation(false)
            if (localErrorCode) setLocalErrorCode(null)
          }}
          placeholder={t('receive:form.codePlaceholder')}
          spellCheck={false}
          trailing={
            <Button
              variant='ghost'
              size='sm'
              iconOnly
              aria-label={t('common:actions.paste')}
              disabled={isJoining}
              onClick={() => {
                pasteCode().catch(() => {})
              }}
              icon={<ClipboardIcon size={16} />}
            />
          }
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
