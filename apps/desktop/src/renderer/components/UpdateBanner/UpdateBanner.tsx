import { useState } from 'react'
import { Button } from '@altersend/components'
import { useTranslation } from '@altersend/locales'
import { bridgeApi } from '../../api/bridgeApi'
import { Modal } from '../Modal'
import updateSvg from '../../../../../../assets/update.svg'

export function UpdateBanner({ ready }: { ready: boolean }) {
  const { t } = useTranslation(['common'])
  const [dismissed, setDismissed] = useState(false)
  const [restartFailed, setRestartFailed] = useState(false)

  const restart = async () => {
    setRestartFailed(false)
    try {
      await bridgeApi.appRestart()
    } catch (err) {
      console.error('Failed to restart for update', err)
      setRestartFailed(true)
    }
  }

  return (
    <Modal open={ready && !dismissed} width={420} onClose={() => setDismissed(true)}>
      <div className='flex flex-col items-center px-6 pb-1 pt-6 text-center'>
        <img src={updateSvg} alt='' aria-hidden className='mb-4 w-[168px]' />
        <h2 className='m-0 text-[20px] font-bold text-text-primary'>{t('common:update.ready')}</h2>
        <p className='m-0 mt-2 max-w-[320px] text-[14px] leading-relaxed text-text-muted'>
          {t('common:update.description')}
        </p>
        {restartFailed && (
          <p className='m-0 mt-3 text-[13px] text-danger'>{t('common:update.restartFailed')}</p>
        )}
      </div>

      <div className='flex flex-col gap-2 px-6 pb-6 pt-5'>
        <Button variant='primary' size='md' width='full' onClick={() => void restart()}>
          {t('common:update.restart')}
        </Button>
        <Button variant='ghost' size='md' width='full' onClick={() => setDismissed(true)}>
          {t('common:update.notNow')}
        </Button>
      </div>
    </Modal>
  )
}
