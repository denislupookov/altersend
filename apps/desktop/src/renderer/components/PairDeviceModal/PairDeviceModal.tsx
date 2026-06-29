import { Button } from '@altersend/components'
import { useTranslation } from '@altersend/locales'
import syncDevicesSvg from '../../../../../../assets/sync_devices.svg'
import { Modal } from '../Modal'

interface PairDeviceModalProps {
  open: boolean
  onPair: () => void
  onSkip: () => void
}

export function PairDeviceModal({ open, onPair, onSkip }: PairDeviceModalProps) {
  const { t } = useTranslation(['settings'])

  return (
    <Modal open={open} title={t('settings:pairPrompt.title')} width={560} onClose={onSkip}>
      <div className='flex flex-col items-center px-6 pb-2 pt-9 text-center'>
        <img src={syncDevicesSvg} alt='' aria-hidden className='mb-12 w-[240px] opacity-90' />
        <h2 className='m-0 text-[20px] font-bold leading-snug text-text-primary'>
          {t('settings:pairPrompt.heading')}
        </h2>
        <p className='m-0 mt-2 max-w-[420px] text-[14px] leading-relaxed text-text-muted'>
          {t('settings:pairPrompt.body')}
        </p>
      </div>

      <div className='flex items-center justify-end gap-2 px-4 pb-4 pt-4'>
        <Button variant='secondary' size='sm' onClick={onSkip}>
          {t('settings:pairPrompt.skip')}
        </Button>
        <Button variant='primary' size='sm' onClick={onPair}>
          {t('settings:pairPrompt.pairButton')}
        </Button>
      </div>
    </Modal>
  )
}
