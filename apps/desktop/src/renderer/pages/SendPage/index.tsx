import { Button } from '@altersend/components'
import { useTranslation } from '@altersend/locales'
import {
  clearSenderFlow,
  continueShare,
  getSendPageCopy,
  getSendStep,
  isShareStep,
  useTransferStore
} from '@altersend/domain'
import { TransferActionGroup, TransferCardFrame } from '../../components'
import { PreparingView } from './PreparingView'
import { SelectFilesView } from './SelectFilesView'
import { ShareView } from './ShareView'

export default function SendPage() {
  const { t } = useTranslation(['send', 'common'])
  const selectedFiles = useTransferStore((s) => s.selectedFiles)
  const draftPhase = useTransferStore((s) => s.draftPhase)
  const connectionState = useTransferStore((s) => s.connectionState)

  const step = getSendStep({ draftPhase, isPeerConnected: connectionState === 'peer-connected' })
  const copy = getSendPageCopy(t, step)
  const hasSelectedFiles = selectedFiles.length > 0

  function renderView() {
    if (step === 'preparing') {
      return <PreparingView />
    }

    if (isShareStep(step)) {
      return <ShareView />
    }

    return <SelectFilesView />
  }

  function renderFooter() {
    if (step === 'preparing') {
      return null
    }

    if (isShareStep(step)) {
      return (
        <TransferActionGroup>
          <Button onClick={clearSenderFlow} size='sm' variant='secondary'>
            {t('common:actions.endSession')}
          </Button>
        </TransferActionGroup>
      )
    }

    if (!hasSelectedFiles) {
      return null
    }

    return (
      <TransferActionGroup>
        <Button onClick={clearSenderFlow} size='sm' variant='ghost'>
          {t('common:actions.clear')}
        </Button>
        <Button onClick={() => void continueShare(selectedFiles)} size='sm' variant='primary'>
          {t('send:actions.sendFiles', { count: selectedFiles.length })}
        </Button>
      </TransferActionGroup>
    )
  }

  return (
    <TransferCardFrame description={copy.description} footer={renderFooter()} title={copy.title}>
      <div className='h-full overflow-y-auto'>{renderView()}</div>
    </TransferCardFrame>
  )
}
