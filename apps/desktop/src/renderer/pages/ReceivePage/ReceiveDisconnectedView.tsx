import { Button, LinkRow } from '@altersend/components'
import { clearSession, formatFileSize, getOfferKey, useTransferStore } from '@altersend/domain'
import { useTranslation } from '@altersend/locales'
import { TransferActionGroup } from '../../components'

export function ReceiveDisconnectedView() {
  const { t } = useTranslation(['receive', 'common'])
  const incomingFileOffers = useTransferStore((s) => s.incomingFileOffers)
  const downloadStates = useTransferStore((s) => s.receiveDownloadStates)
  const completedCount = incomingFileOffers.filter(
    (f) => downloadStates[getOfferKey(f)]?.status === 'completed'
  ).length
  const total = incomingFileOffers.length

  return (
    <div className='flex h-full min-h-0 w-full flex-col gap-4'>
      {total > 0 ? (
        <div className='flex min-h-0 flex-1 flex-col overflow-hidden rounded-[12px] border border-border-primary'>
          <div className='flex shrink-0 items-center justify-between border-b border-border-primary pl-[14px] pr-3 py-3'>
            <p className='m-0 text-[14px] font-semibold text-text-primary'>
              {t('common:files.files')}
            </p>
            <p className='m-0 text-[13px] text-text-muted'>
              {t('receive:summary.receivedProgress', { completed: completedCount, count: total })}
            </p>
          </div>

          <div className='min-h-0 flex-1 overflow-y-auto'>
            {incomingFileOffers.map((file) => {
              const state = downloadStates[getOfferKey(file)]
              const isComplete = state?.status === 'completed'
              if (file.kind !== 'file') return null
              return (
                <LinkRow
                  key={getOfferKey(file)}
                  file
                  bare
                  label={file.name}
                  description={
                    isComplete ? formatFileSize(file.size) : t('receive:errors.didntArrive')
                  }
                  disabled={!isComplete}
                />
              )
            })}
          </div>

          <div className='flex shrink-0 items-center justify-end gap-2.5 border-t border-border-primary px-6 py-4'>
            <Button onClick={clearSession} size='sm' variant='primary'>
              {t('common:actions.done')}
            </Button>
          </div>
        </div>
      ) : (
        <TransferActionGroup>
          <Button onClick={clearSession} size='sm' variant='primary'>
            {t('common:actions.done')}
          </Button>
        </TransferActionGroup>
      )}
    </div>
  )
}
