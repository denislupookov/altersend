import { Fragment, useMemo, useState } from 'react'
import { Button, LinkRow, useTheme } from '@altersend/components'
import { ChevronRightIcon, DownloadIcon, FolderIcon } from '@altersend/components/icons'
import { useTranslation } from '@altersend/locales'
import { bridgeApi } from '../../api/bridgeApi'
import {
  clearSession,
  createDirectoryDownloadRequests,
  createSingleDownloadRequest,
  downloadFiles,
  getDownloadRowDisplay,
  getDownloadTotals,
  getFolderRowDisplay,
  getOfferKey,
  groupReceiveRows,
  type ReceiveFolderRow,
  useTransferStore
} from '@altersend/domain'
import type { IncomingFileOffer } from '@altersend/core'

type FileOffer = Extract<IncomingFileOffer, { kind: 'file' }>
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
  const { theme } = useTheme()
  const incomingFileOffers = useTransferStore((s) => s.incomingFileOffers)
  const downloadStates = useTransferStore((s) => s.receiveDownloadStates)
  const peerCount = useTransferStore((s) => s.peerCount)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())

  const hasIncomingFiles = incomingFileOffers.length > 0
  const rows = useMemo(() => groupReceiveRows(incomingFileOffers), [incomingFileOffers])
  const totals = useMemo(
    () => getDownloadTotals(incomingFileOffers, downloadStates),
    [downloadStates, incomingFileOffers]
  )

  const toggleFolder = (name: string) =>
    setExpandedFolders((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })

  const statusFor = (row: DownloadRow) =>
    row.status.kind === 'ready'
      ? undefined
      : { label: getDownloadStatusLabel(t, row), tone: row.status.tone }

  const renderFileRow = (offer: FileOffer, isFirst = false) => {
    const row = getDownloadRowDisplay(offer, downloadStates[getOfferKey(offer)])
    return (
      <LinkRow
        key={getOfferKey(offer)}
        file
        bare
        compact
        isFirst={isFirst}
        label={offer.name}
        size={offer.size}
        description={row.description}
        status={statusFor(row)}
        progressPercent={row.progressPercent}
      />
    )
  }

  const renderFolderRow = (folderRow: ReceiveFolderRow, isFirst = false) => {
    const folder = getFolderRowDisplay(folderRow.offers, downloadStates)
    const isExpanded = expandedFolders.has(folderRow.name)
    return (
      <Fragment key={`folder:${folderRow.name}`}>
        <LinkRow
          icon={<FolderIcon size={16} />}
          bare
          compact
          isFirst={isFirst}
          label={folderRow.name}
          size={folderRow.totalSize}
          description={folder.description}
          status={statusFor(folder)}
          progressPercent={folder.progressPercent}
          onPress={() => toggleFolder(folderRow.name)}
          trailing={
            <span
              className={`inline-flex transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
            >
              <ChevronRightIcon size={14} color={theme.colors.colorTextMuted} />
            </span>
          }
        />
        {isExpanded ? (
          <div className='pl-10'>{folderRow.offers.map((offer) => renderFileRow(offer))}</div>
        ) : null}
      </Fragment>
    )
  }

  const isDownloading = totals.activeCount > 0
  const allCompleted = hasIncomingFiles && totals.completedCount === incomingFileOffers.length

  const textOffer = incomingFileOffers.find((f) => f.kind === 'text')
  const isTextTransfer = textOffer !== undefined

  const isUrl = useMemo(() => {
    if (textOffer?.kind !== 'text') return false
    try {
      const url = new URL(textOffer.content)
      return url.protocol === 'https:' || url.protocol === 'http:'
    } catch {
      return false
    }
  }, [textOffer])

  const downloadAll = async () => {
    const fileOffers = incomingFileOffers.filter((f) => f.kind === 'file')
    if (fileOffers.length === 0 || isDownloading) return

    const isSingleLooseFile = rows.length === 1 && rows[0].kind === 'file'

    if (isSingleLooseFile) {
      const selected = await bridgeApi.pickSaveFile(fileOffers[0].name)
      if (!selected?.path) return

      try {
        await downloadFiles([createSingleDownloadRequest(fileOffers[0], selected.path)])
      } catch (error) {
        console.error('ReceiveConnectedView: single-file download failed', error)
      }
      return
    }

    const selectedDirectory = await bridgeApi.pickDirectory()
    if (!selectedDirectory?.path) return

    try {
      await downloadFiles(createDirectoryDownloadRequests(fileOffers, selectedDirectory.path))
    } catch (error) {
      console.error('ReceiveConnectedView: directory download failed', error)
    }
  }

  return (
    <div className='flex h-full min-h-0 w-full flex-1 flex-col'>
      {isTextTransfer ? (
        <div className='flex-1 flex flex-col justify-center items-center'>
          <div className='p-4 bg-background-subtle rounded-lg border border-border-primary w-full break-words'>
            <p className='text-text-primary text-center select-text'>{textOffer.content}</p>
          </div>
        </div>
      ) : (
        <div className='min-h-0 flex-1 overflow-y-auto pr-1'>
          <div className='overflow-hidden rounded-[10px] border border-border-primary bg-background-subtle'>
            {rows.map((row, index) =>
              row.kind === 'file'
                ? renderFileRow(row.offer, index === 0)
                : renderFolderRow(row, index === 0)
            )}
          </div>
        </div>
      )}

      <div className='mt-4 flex shrink-0 items-center justify-end gap-4'>
        <div className='flex shrink-0 items-center gap-2'>
          <Button onClick={clearSession} size='sm' variant='secondary'>
            {t('common:actions.endSession')}
          </Button>
          {isTextTransfer ? (
            isUrl ? (
              <Button
                onClick={() => void bridgeApi.openExternalUrl(textOffer.content!)}
                size='sm'
                variant='primary'
              >
                {t('common:actions.openLink')}
              </Button>
            ) : (
              <Button
                onClick={() => void navigator.clipboard.writeText(textOffer.content!)}
                size='sm'
                variant='primary'
              >
                {t('common:actions.copyText')}
              </Button>
            )
          ) : peerCount > 0 && hasIncomingFiles && !allCompleted ? (
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
