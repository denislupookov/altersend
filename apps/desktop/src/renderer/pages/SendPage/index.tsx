import { Button } from '@altersend/components'
import { SendIcon } from '@altersend/components/icons'
import { useTranslation } from '@altersend/locales'
import {
  clearSenderFlow,
  continueShare,
  formatFileSize,
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

    const totalSize = selectedFiles.reduce((sum, file) => sum + (file.size ?? 0), 0)

    return (
      <div className='flex items-center justify-between gap-4'>
        <div className='flex items-baseline gap-2'>
          <span className='text-[14.5px] font-semibold text-text-primary'>
            {t('common:files.count', { count: selectedFiles.length })}
          </span>
          <span className='text-[13px] text-text-faint'>{formatFileSize(totalSize)}</span>
        </div>
        <TransferActionGroup>
          <Button onClick={clearSenderFlow} size='sm' variant='ghost'>
            {t('common:actions.clear')}
          </Button>
          <Button
            onClick={() => void continueShare(selectedFiles)}
            size='sm'
            variant='primary'
            icon={<SendIcon size={14} />}
          >
            {t('common:labels.send')}
          </Button>
        </TransferActionGroup>
      </div>
    )
  }

  if (step === 'preparing') {
    return <PreparingView />
  }

  return (
    <TransferCardFrame
      description={isShareStep(step) ? copy.description : ''}
      footer={renderFooter()}
      title={copy.title}
    >
      <div className='h-full overflow-y-auto'>{renderView()}</div>
    </TransferCardFrame>
  )
}
