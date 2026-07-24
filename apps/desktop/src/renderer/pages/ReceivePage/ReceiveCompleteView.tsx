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
import type { IncomingFileOffer } from '@altersend/core'

type FileOffer = Extract<IncomingFileOffer, { kind: 'file' }>

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

  const receivedFiles = incomingFileOffers.filter((f): f is FileOffer => f.kind === 'file')
  const totalBytes = receivedFiles.reduce((sum, f) => sum + f.size, 0)
  const fileCount = receivedFiles.length

  const firstSavedTo = Object.values(downloadStates).find((s) => s.savedTo)?.savedTo
  const saveDir = firstSavedTo ? getParentDir(firstSavedTo) : null
  const displayDir = saveDir ? shortenHomePath(saveDir) : null

  const successSubtitle = [
    formatFileSize(totalBytes),
    displayDir
      ? t('receive:summary.savedToLocation', { location: displayDir })
      : t('receive:summary.saved')
  ].join(' · ')

  return (
    <div className='flex h-full min-h-0 w-full flex-col gap-3.5'>
      <div className='flex shrink-0 items-center gap-2 px-0.5'>
        <span className='flex shrink-0 items-center text-success'>
          <CheckIcon size={17} />
        </span>
        <p className='m-0 shrink-0 text-[14px] font-semibold tracking-[-0.2px] text-text-primary'>
          {t('receive:page.completed.title', { count: fileCount })}
        </p>
        <p className='m-0 min-w-0 flex-1 truncate text-[13px] text-text-muted'>{successSubtitle}</p>
        {saveDir ? (
          <Button
            icon={<FolderIcon size={13} />}
            onClick={() =>
              bridgeApi.showInFolder(saveDir).catch((err) => {
                console.error('Failed to show in folder', saveDir, err)
              })
            }
            size='sm'
            variant='secondary'
          >
            {t('receive:actions.showInFinder')}
          </Button>
        ) : null}
      </div>

      <div className='flex min-h-0 flex-1 flex-col overflow-hidden'>
        <div className='min-h-0 flex-1 overflow-y-auto'>
          {receivedFiles.map((file, index) => {
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
                isFirst={index === 0}
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

        <div className='flex shrink-0 items-center justify-end gap-2.5 px-6 py-4'>
          <Button onClick={clearSession} size='sm' variant='primary'>
            {t('common:actions.done')}
          </Button>
        </div>
      </div>
    </div>
  )
}
