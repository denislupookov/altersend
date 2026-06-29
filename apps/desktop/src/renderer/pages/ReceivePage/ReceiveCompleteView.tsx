import { useEffect } from 'react'
import { Button, LinkRow } from '@altersend/components'
import { CheckIcon, FolderIcon } from '@altersend/components/icons'
import { useTranslation } from '@altersend/locales'
import {
  clearSession,
  formatFileSize,
  getOfferKey,
  getParentDir,
  shortenHomePath,
  useTransferStore
} from '@altersend/domain'
import { bridgeApi } from '../../api/bridgeApi'

function openFileWithLogging(filePath: string): void {
  void bridgeApi.openFile(filePath).then((err) => {
    if (err) console.error('Failed to open file', filePath, err)
  })
}

export function ReceiveCompleteView() {
  const { t } = useTranslation(['receive', 'common'])
  const incomingFileOffers = useTransferStore((s) => s.incomingFileOffers)
  const downloadStates = useTransferStore((s) => s.receiveDownloadStates)

  useEffect(() => {
    void bridgeApi.worker.closePeers().catch((err) => {
      console.warn('ReceiveCompleteView: closePeers failed', err)
    })
  }, [])

  const totalBytes = incomingFileOffers.reduce(
    (sum, f) => sum + (f.kind === 'file' ? f.size : 0),
    0
  )
  const fileCount = incomingFileOffers.length

  const firstSavedTo = Object.values(downloadStates).find((s) => s.savedTo)?.savedTo
  const saveDir = firstSavedTo ? getParentDir(firstSavedTo) : null
  const displayDir = saveDir ? shortenHomePath(saveDir) : null

  const successSubtitle = [
    t('common:files.count', { count: fileCount }),
    formatFileSize(totalBytes),
    displayDir
      ? t('receive:summary.savedToLocation', { location: displayDir })
      : t('receive:summary.saved')
  ].join(' · ')

  return (
    <div className='flex h-full min-h-0 w-full flex-col gap-4'>
      <div className='flex shrink-0 items-center justify-between gap-4 rounded-[12px] border border-success/22 bg-success/8 px-4 py-3.5'>
        <div className='flex items-center gap-3'>
          <div className='flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-[8px] bg-success/28 text-success'>
            <CheckIcon size={16} />
          </div>
          <div>
            <p className='m-0 text-[14px] font-bold text-success'>
              {t('receive:page.completed.title', { count: fileCount })}
            </p>
            <p className='m-0 mt-0.5 text-[12px] leading-5 text-text-secondary'>
              {successSubtitle}
            </p>
          </div>
        </div>
        {saveDir ? (
          <Button
            icon={<FolderIcon size={13} />}
            onClick={() => void bridgeApi.showInFolder(saveDir)}
            size='sm'
            variant='secondary'
          >
            {t('receive:actions.showInFinder')}
          </Button>
        ) : null}
      </div>

      <div className='flex min-h-0 flex-1 flex-col overflow-hidden rounded-[12px] border border-border-primary bg-surface-primary'>
        <div className='flex shrink-0 items-center justify-between border-b border-border-primary pl-[14px] pr-3 py-3'>
          <p className='m-0 text-[14px] font-semibold text-text-primary'>
            {t('receive:panel.receivedFiles')}
          </p>
          <p className='m-0 text-[13px] text-text-muted'>
            {t('common:files.count', { count: fileCount })}
          </p>
        </div>

        <div className='min-h-0 flex-1 overflow-y-auto'>
          {incomingFileOffers.map((file) => {
            if (file.kind !== 'file') return null
            const state = downloadStates[getOfferKey(file)]
            const savedTo = state?.savedTo
            const shortPath = savedTo ? shortenHomePath(getParentDir(savedTo)) : null
            const description = [shortPath, formatFileSize(file.size)].filter(Boolean).join(' · ')

            return (
              <LinkRow
                key={getOfferKey(file)}
                file
                bare
                compact
                label={file.name}
                description={description}
                trailing={
                  savedTo ? (
                    <Button
                      onClick={() => openFileWithLogging(savedTo)}
                      size='sm'
                      variant='secondary'
                    >
                      {t('receive:actions.open')}
                    </Button>
                  ) : undefined
                }
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
    </div>
  )
}
