import { useEffect, useState } from 'react'
import { Button, Input } from '@altersend/components'
import { ClipboardIcon } from '@altersend/components/icons'
import { useTranslation } from '@altersend/locales'
import { bridgeApi } from '../../api/bridgeApi'
import { Modal } from '../Modal'

interface PairingJoinModalProps {
  open: boolean
  isLoading: boolean
  onClose: () => void
  onJoin: (input: string) => Promise<boolean>
}

export function PairingJoinModal({ open, isLoading, onClose, onJoin }: PairingJoinModalProps) {
  const { t } = useTranslation(['settings', 'common'])
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!open) {
      setValue('')
      setError(false)
    }
  }, [open])

  const handlePaste = async () => {
    const text = await bridgeApi.clipboardReadText()
    setValue(text)
    setError(false)
  }

  const handleJoin = async () => {
    setError(false)
    const ok = await onJoin(value)
    if (!ok) setError(true)
  }

  return (
    <Modal open={open} title={t('settings:pairing.enterCode')} width={636} onClose={onClose}>
      <div className='px-4 pb-2'>
        <Input
          label={t('settings:pairing.codeLabel')}
          placeholder={t('settings:pairing.codePlaceholder')}
          value={value}
          disabled={isLoading}
          error={error ? t('settings:pairing.codeError') : undefined}
          trailing={
            <Button
              variant='ghost'
              size='sm'
              iconOnly
              aria-label={t('common:actions.paste')}
              onClick={() => {
                handlePaste().catch(() => {})
              }}
              icon={<ClipboardIcon size={16} />}
            />
          }
          onChange={(e: { target: { value: string } }) => {
            setValue(e.target.value)
            setError(false)
          }}
          onKeyDown={(e: { key: string }) => {
            if (e.key === 'Enter') handleJoin().catch(() => {})
          }}
        />
      </div>

      <div className='flex items-center justify-end gap-2 px-4 pb-4 pt-3'>
        <Button variant='secondary' size='sm' onClick={onClose}>
          {t('settings:pairing.discard')}
        </Button>
        <Button
          variant='primary'
          size='sm'
          disabled={!value.trim()}
          loading={isLoading}
          onClick={() => {
            handleJoin().catch(() => {})
          }}
        >
          {isLoading ? t('settings:pairing.pairingInProgress') : t('settings:pairing.joinButton')}
        </Button>
      </div>
    </Modal>
  )
}
