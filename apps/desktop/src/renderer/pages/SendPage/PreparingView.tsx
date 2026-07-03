import { Button, WaitingState } from '@altersend/components'
import { SendIcon } from '@altersend/components/icons'
import { clearSenderFlow } from '@altersend/domain'
import { useTranslation } from '@altersend/locales'

export function PreparingView() {
  const { t } = useTranslation(['send', 'common'])

  return (
    <div className='flex h-full min-h-0 flex-col'>
      <div className='flex flex-1 flex-col items-center justify-center'>
        <WaitingState
          icon={<SendIcon size={30} />}
          title={t('send:page.preparing.title')}
          description={t('send:page.preparing.description')}
        />
      </div>

      <div className='flex justify-end pt-7'>
        <Button variant='secondary' size='sm' onClick={clearSenderFlow}>
          {t('common:actions.cancel')}
        </Button>
      </div>
    </div>
  )
}
