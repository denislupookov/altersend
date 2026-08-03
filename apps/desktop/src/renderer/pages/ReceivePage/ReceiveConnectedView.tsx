import { Button, DownloadRow, ReceivedTextRow, RowGroup, rowKey } from '@altersend/components'
import { DownloadIcon, PlayIcon } from '@altersend/components/icons'
import { useTranslation } from '@altersend/locales'
import { bridgeApi } from '../../api/bridgeApi'
import { useToast } from '../../components/Toast'
import { isAskEveryTime } from '../../lifecycle/downloadLocationStorage'
import {
  clearSession,
  formatTransferRate,
  getDownloadRowLabels,
  getPrimaryDownloadLabel,
  getOfferKey,
  useCopiedFlag,
  useReceiveActions,
  useReceiveDownloads
} from '@altersend/domain'

function toSafeFileName(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? ''
  return base.replace(/\0/g, '').trim() || 'file'
}

function openSavedFile(filePath: string): void {
  bridgeApi
    .openFile(filePath)
    .then((err) => {
      if (err) console.error('ReceiveConnectedView: failed to open', filePath, err)
    })
    .catch((err) => console.error('ReceiveConnectedView: failed to open', filePath, err))
}

export function ReceiveConnectedView() {
  const { t } = useTranslation(['receive', 'common', 'errors'])
  const toast = useToast()
  const { copiedId, flashCopied } = useCopiedFlag()
  const downloads = useReceiveDownloads()
  const actions = useReceiveActions(downloads)

  const copyText = (id: string, content: string) => {
    void navigator.clipboard.writeText(content)
    flashCopied(id)
  }

  const downloadWithDialog = async () => {
    const isSingleLooseFile =
      downloads.pendingOffers.length === 1 &&
      downloads.rows.length === 1 &&
      downloads.rows[0].kind === 'file'

    if (isSingleLooseFile) {
      const selected = await bridgeApi.pickSaveFile(toSafeFileName(downloads.pendingOffers[0].name))
      if (!selected?.path) return

      await actions.replaceWith(downloads.pendingOffers[0], selected.path)
      return
    }

    const selectedDirectory = await bridgeApi.pickDirectory()
    if (!selectedDirectory) return

    await actions.downloadInto(selectedDirectory)
  }

  const downloadAll = async () => {
    if (downloads.pendingOffers.length === 0 || downloads.isDownloading) return

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

      await actions.downloadInto(folder)
    } catch (error) {
      console.error('ReceiveConnectedView: download failed', error)
      toast.show({ title: t('errors:transfer.downloadFailed'), variant: 'error' })
    }
  }

  return (
    <div className='flex h-full min-h-0 w-full flex-1 flex-col'>
      <div className='flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto pr-1'>
        {downloads.rows.length > 0 ? (
          <RowGroup title={t('common:files.files')}>
            {downloads.rows.map((row, index) => (
              <DownloadRow
                key={rowKey(row)}
                row={row}
                states={downloads.states}
                rates={downloads.rates}
                rateLabelFor={(rate) => formatTransferRate(rate, t)}
                labelsFor={(display) => getDownloadRowLabels(t, display)}
                transferActive={downloads.isDownloading}
                isFirst={index === 0}
                compact
                onResume={actions.resumeFile}
                onPause={actions.pauseFile}
                onOpen={(_offer, savedTo) => openSavedFile(savedTo)}
                onPauseFolder={actions.pauseFolder}
                onResumeFolder={actions.resumeFolder}
              />
            ))}
          </RowGroup>
        ) : null}

        {downloads.textOffers.length > 0 ? (
          <RowGroup title={t('common:files.text')}>
            {downloads.textOffers.map((offer, index) => (
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
          </RowGroup>
        ) : null}
      </div>

      <div className='mt-4 flex shrink-0 items-center justify-end gap-4'>
        <div className='flex shrink-0 items-center gap-2'>
          <Button onClick={clearSession} size='sm' variant='secondary'>
            {t('common:actions.endSession')}
          </Button>
          {downloads.primaryAction ? (
            <Button
              disabled={downloads.primaryAction === 'downloading'}
              icon={
                downloads.primaryAction === 'resume-all' ? (
                  <PlayIcon size={14} />
                ) : (
                  <DownloadIcon size={14} />
                )
              }
              loading={downloads.primaryAction === 'downloading'}
              onClick={() =>
                (downloads.primaryAction === 'resume-all'
                  ? actions.resumeAll()
                  : downloadAll()
                ).catch(console.error)
              }
              size='sm'
              variant={downloads.primaryAction === 'downloading' ? 'secondary' : 'primary'}
            >
              {getPrimaryDownloadLabel(t, downloads.primaryAction, {
                percent: downloads.totals.percent,
                totalBytes: downloads.totals.totalBytes
              })}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
