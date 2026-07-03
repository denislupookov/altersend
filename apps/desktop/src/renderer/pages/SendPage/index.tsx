import { useState } from 'react'
import { Button, Tabs, TabsList, TabsTrigger } from '@altersend/components'
import { SendIcon } from '@altersend/components/icons'
import { useTranslation } from '@altersend/locales'
import {
  clearSenderFlow,
  continueShare,
  formatFileSize,
  formatItemsCount,
  getSendPageCopy,
  getSendStep,
  isShareStep,
  useTransferStore,
  type SendComposeMode
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
  const [mode, setMode] = useState<SendComposeMode>('files')

  const step = getSendStep({ draftPhase, isPeerConnected: connectionState === 'peer-connected' })
  const copy = getSendPageCopy(t, step)
  const hasSelectedFiles = selectedFiles.length > 0
  const showTabs = !isShareStep(step) && step !== 'preparing'

  function renderView() {
    if (isShareStep(step)) {
      return <ShareView />
    }

    return <SelectFilesView mode={showTabs ? mode : 'files'} />
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

    const fileItems = selectedFiles.filter((file) => file.kind !== 'text')
    const textItems = selectedFiles.filter((file) => file.kind === 'text')
    const totalSize = fileItems.reduce((sum, file) => sum + (file.size ?? 0), 0)
    const countLabel = formatItemsCount(fileItems.length, textItems.length, t)

    return (
      <div className='flex items-center justify-between gap-4'>
        <div className='flex items-baseline gap-2'>
          <span className='text-[14.5px] font-semibold text-text-primary'>{countLabel}</span>
          {totalSize > 0 ? (
            <span className='text-[13px] text-text-faint'>{formatFileSize(totalSize)}</span>
          ) : null}
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

  const headerTabs = showTabs ? (
    <Tabs size='sm' value={mode} onValueChange={(value) => setMode(value as SendComposeMode)}>
      <TabsList>
        <TabsTrigger value='files'>{t('common:files.files')}</TabsTrigger>
        <TabsTrigger value='text'>{t('common:files.text')}</TabsTrigger>
      </TabsList>
    </Tabs>
  ) : undefined

  return (
    <TransferCardFrame
      description={isShareStep(step) ? copy.description : ''}
      footer={renderFooter()}
      headerRight={headerTabs}
      title={copy.title}
    >
      <div className='h-full overflow-y-auto'>{renderView()}</div>
    </TransferCardFrame>
  )
}
