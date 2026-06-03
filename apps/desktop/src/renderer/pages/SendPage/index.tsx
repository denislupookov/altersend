import { Button } from '@altersend/components'
import {
  clearSenderFlow,
  continueShare,
  getSendPageCopy,
  getSendStep,
  isShareStep,
  useTransferStore
} from '@altersend/domain'
import { useTranslation } from '@altersend/locales'
import { TransferActionGroup, TransferCardFrame } from '../../components/TransferPrimitives'
import { PreparingView } from './PreparingView'
import { SelectFilesView } from './SelectFilesView'
import { ShareView } from './ShareView'

export default function SendPage() {
  const { t } = useTranslation('send')
  const selectedFiles = useTransferStore((s) => s.selectedFiles)
  const draftPhase = useTransferStore((s) => s.draftPhase)
  const connectionState = useTransferStore((s) => s.connectionState)

  const step = getSendStep({ draftPhase, isPeerConnected: connectionState === 'peer-connected' })
  const copy = getSendPageCopy(step, t)
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
            End session
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
          Clear
        </Button>
        <Button onClick={() => void continueShare(selectedFiles)} size='sm' variant='primary'>
          Send {selectedFiles.length} file{selectedFiles.length === 1 ? '' : 's'}
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
