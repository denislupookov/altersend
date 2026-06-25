import { useMemo } from 'react'
import { Button, LinkRow } from '@altersend/components'
import { DownloadIcon } from '@altersend/components/icons'
import { useTranslation } from '@altersend/locales'
import { bridgeApi } from '../../api/bridgeApi'
import {
  clearSession,
  createDirectoryDownloadRequests,
  createSingleDownloadRequest,
  downloadFiles,
  getDownloadRowDisplay,
  getDownloadTotals,
  getOfferKey,
  useTransferStore
} from '@altersend/domain'

type DownloadRow = ReturnType<typeof getDownloadRowDisplay>

function getDownloadStatusLabel(t: ReturnType<typeof useTranslation>['t'], row: DownloadRow) {
  switch (row.status.kind) {
    case 'saved':
      return t('receive:status.saved')
    case 'failed':
      return t('errors:transfer.downloadFailed')
    case 'progress':
      return t('receive:status.percent', { percent: row.percent })
    case 'ready':
      return t('receive:status.ready')
  }
}

export function ReceiveConnectedView() {
  const { t } = useTranslation(['receive', 'common', 'errors'])
  const incomingFileOffers = useTransferStore((s) => s.incomingFileOffers)
  const downloadStates = useTransferStore((s) => s.receiveDownloadStates)
  const peerCount = useTransferStore((s) => s.peerCount)

  const hasIncomingFiles = incomingFileOffers.length > 0
  const totals = useMemo(
    () => getDownloadTotals(incomingFileOffers, downloadStates),
    [downloadStates, incomingFileOffers]
  )

  const isDownloading = totals.activeCount > 0
  const allCompleted = hasIncomingFiles && totals.completedCount === incomingFileOffers.length

  const downloadAll = async () => {
    if (incomingFileOffers.length === 0 || isDownloading) return

    if (incomingFileOffers.length === 1) {
      const selected = await bridgeApi.pickSaveFile(incomingFileOffers[0].name)
      if (!selected?.path) return

      try {
        await downloadFiles([createSingleDownloadRequest(incomingFileOffers[0], selected.path)])
      } catch (error) {
        console.error('ReceiveConnectedView: single-file download failed', error)
      }
      return
    }

    const selectedDirectory = await bridgeApi.pickDirectory()
    if (!selectedDirectory?.path) return

    try {
      await downloadFiles(
        createDirectoryDownloadRequests(incomingFileOffers, selectedDirectory.path)
      )
    } catch (error) {
      console.error('ReceiveConnectedView: directory download failed', error)
    }
  }

  return (
    <div className='flex h-full min-h-0 w-full flex-1 flex-col'>
      <div className='min-h-0 flex-1 overflow-y-auto pr-1'>
        <div className='overflow-hidden rounded-[10px] border border-border-primary bg-background-subtle'>
          {incomingFileOffers.map((file) => {
            const row = getDownloadRowDisplay(file, downloadStates[getOfferKey(file)])
            return (
              <LinkRow
                key={getOfferKey(file)}
                file
                bare
                compact
                label={file.name}
                size={file.size}
                description={row.description}
                status={{ label: getDownloadStatusLabel(t, row), tone: row.status.tone }}
                progressPercent={row.progressPercent}
              />
            )
          })}
        </div>
      </div>

      <div className='mt-4 flex shrink-0 items-center justify-end gap-4'>
        <div className='flex shrink-0 items-center gap-2'>
          <Button onClick={clearSession} size='sm' variant='secondary'>
            {t('common:actions.endSession')}
          </Button>
          {peerCount > 0 && hasIncomingFiles && !allCompleted ? (
            <Button
              disabled={isDownloading}
              icon={<DownloadIcon size={14} />}
              onClick={() => void downloadAll()}
              size='sm'
              variant='primary'
            >
              {isDownloading
                ? t('receive:actions.downloadingPercent', { percent: totals.percent })
                : t('receive:actions.downloadAll')}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
