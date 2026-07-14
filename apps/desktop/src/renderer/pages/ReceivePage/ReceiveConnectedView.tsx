import { Fragment, useMemo, useState } from 'react'
import { Button, LinkRow, ReceivedTextRow, useTheme } from '@altersend/components'
import { ChevronRightIcon, DownloadIcon, FolderIcon } from '@altersend/components/icons'
import { useTranslation } from '@altersend/locales'
import { bridgeApi } from '../../api/bridgeApi'
import { useToast } from '../../components/Toast'
import { isAskEveryTime } from '../../lifecycle/downloadLocationStorage'
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
  useCopiedFlag,
  useTransferStore
} from '@altersend/domain'
import type { IncomingFileOffer } from '@altersend/core'

type FileOffer = Extract<IncomingFileOffer, { kind: 'file' }>
type TextOffer = Extract<IncomingFileOffer, { kind: 'text' }>
type DownloadRow = ReturnType<typeof getDownloadRowDisplay>

function toSafeFileName(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? ''
  return base.replace(/\0/g, '').trim() || 'file'
}

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
  const toast = useToast()
  const incomingFileOffers = useTransferStore((s) => s.incomingFileOffers)
  const downloadStates = useTransferStore((s) => s.receiveDownloadStates)
  const peerCount = useTransferStore((s) => s.peerCount)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const { copiedId, flashCopied } = useCopiedFlag()

  const textOffers = useMemo(
    () => incomingFileOffers.filter((offer): offer is TextOffer => offer.kind === 'text'),
    [incomingFileOffers]
  )
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

  const copyText = (id: string, content: string) => {
    void navigator.clipboard.writeText(content)
    flashCopied(id)
  }

  const fileOffers = incomingFileOffers.filter((f): f is FileOffer => f.kind === 'file')
  const hasDownloadableFiles = fileOffers.length > 0
  const isDownloading = totals.activeCount > 0
  const allFilesDownloaded = hasDownloadableFiles && totals.completedCount === fileOffers.length

  const downloadWithDialog = async () => {
    const isSingleLooseFile = rows.length === 1 && rows[0].kind === 'file'

    if (isSingleLooseFile) {
      const selected = await bridgeApi.pickSaveFile(toSafeFileName(fileOffers[0].name))
      if (!selected?.path) return

      await downloadFiles([createSingleDownloadRequest(fileOffers[0], selected.path)])
      return
    }

    const selectedDirectory = await bridgeApi.pickDirectory()
    if (!selectedDirectory) return

    await downloadFiles(createDirectoryDownloadRequests(fileOffers, selectedDirectory))
  }

  const downloadAll = async () => {
    if (fileOffers.length === 0 || isDownloading) return

    try {
      if (isAskEveryTime()) {
        await downloadWithDialog()
        return
      }

      const folder = await bridgeApi.getDownloadFolder()
      if (!folder) {
        await downloadWithDialog()
        return
      }

      await downloadFiles(createDirectoryDownloadRequests(fileOffers, folder))
    } catch (error) {
      console.error('ReceiveConnectedView: download failed', error)
      toast.show({ title: t('errors:transfer.downloadFailed'), variant: 'error' })
    }
  }

  return (
    <div className='flex h-full min-h-0 w-full flex-1 flex-col'>
      <div className='flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto pr-1'>
        {rows.length > 0 ? (
          <div>
            <p className='m-0 mb-2 text-[13px] font-medium text-text-muted'>
              {t('common:files.files')}
            </p>
            <div className='overflow-hidden rounded-[10px] border border-border-primary bg-background-subtle'>
              {rows.map((row, index) => {
                if (row.kind === 'file') return renderFileRow(row.offer, index === 0)

                const folder = getFolderRowDisplay(row.offers, downloadStates)
                const isExpanded = expandedFolders.has(row.name)
                return (
                  <Fragment key={`folder:${row.name}`}>
                    <LinkRow
                      icon={<FolderIcon size={16} />}
                      bare
                      compact
                      isFirst={index === 0}
                      label={row.name}
                      size={row.totalSize}
                      description={folder.description}
                      status={statusFor(folder)}
                      progressPercent={folder.progressPercent}
                      onPress={() => toggleFolder(row.name)}
                      trailing={
                        <span
                          className={`inline-flex transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                        >
                          <ChevronRightIcon size={14} color={theme.colors.colorTextMuted} />
                        </span>
                      }
                    />
                    {isExpanded ? (
                      <div className='pl-10'>{row.offers.map((offer) => renderFileRow(offer))}</div>
                    ) : null}
                  </Fragment>
                )
              })}
            </div>
          </div>
        ) : null}

        {textOffers.length > 0 ? (
          <div>
            <p className='m-0 mb-2 text-[13px] font-medium text-text-muted'>
              {t('common:files.text')}
            </p>
            <div className='overflow-hidden rounded-[10px] border border-border-primary bg-background-subtle'>
              {textOffers.map((offer, index) => (
                <ReceivedTextRow
                  key={getOfferKey(offer)}
                  content={offer.content}
                  isFirst={index === 0}
                  copied={copiedId === offer.id}
                  subtitleLabel={t('common:files.text')}
                  copyLabel={t('common:actions.copyText')}
                  copiedLabel={t('common:actions.copied')}
                  showMoreLabel={t('common:actions.showMore')}
                  showLessLabel={t('common:actions.showLess')}
                  onCopy={() => copyText(offer.id, offer.content)}
                  onOpenLink={(url) => void bridgeApi.openExternalUrl(url)}
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className='mt-4 flex shrink-0 items-center justify-end gap-4'>
        <div className='flex shrink-0 items-center gap-2'>
          <Button onClick={clearSession} size='sm' variant='secondary'>
            {t('common:actions.endSession')}
          </Button>
          {hasDownloadableFiles && peerCount > 0 && !allFilesDownloaded ? (
            <Button
              disabled={isDownloading}
              icon={<DownloadIcon size={14} />}
              onClick={() => downloadAll().catch(console.error)}
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
