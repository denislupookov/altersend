import type { ReactNode } from 'react'
import { DownloadRow, ReceivedTextRow, RowGroup, rowKey } from '@altersend/components'
import { useTranslation } from '@altersend/locales'
import {
  formatTransferRate,
  getDownloadRowLabels,
  getOfferKey,
  useCopiedFlag,
  useReceiveActions,
  useReceiveDownloads
} from '@altersend/domain'
import { TransferActionGroup } from '../../components'
import { bridgeApi } from '../../api/bridgeApi'

function openSavedFile(filePath: string): void {
  bridgeApi
    .openFile(filePath)
    .then((err) => {
      if (err) console.error('ReceiveFileList: failed to open', filePath, err)
    })
    .catch((err) => console.error('ReceiveFileList: failed to open', filePath, err))
}

interface ReceiveFileListProps {
  pendingLabel?: string
  hideFilesTitle?: boolean
  footer?: ReactNode
}

export function ReceiveFileList({ pendingLabel, hideFilesTitle, footer }: ReceiveFileListProps) {
  const { t } = useTranslation(['receive', 'common', 'errors'])
  const { copiedId, flashCopied } = useCopiedFlag()
  const downloads = useReceiveDownloads()
  const actions = useReceiveActions(downloads)

  const copyText = (id: string, content: string) => {
    navigator.clipboard.writeText(content).catch((err: unknown) => {
      console.error('ReceiveFileList: copy failed', err)
    })
    flashCopied(id)
  }

  return (
    <div className='flex h-full min-h-0 w-full flex-1 flex-col'>
      <div className='flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto pr-1'>
        {downloads.rows.length > 0 ? (
          <RowGroup title={hideFilesTitle ? undefined : t('common:files.files')}>
            {downloads.rows.map((row, index) => (
              <DownloadRow
                key={rowKey(row)}
                row={row}
                states={downloads.states}
                rates={downloads.rates}
                rateLabelFor={(rate) => formatTransferRate(rate, t)}
                labelsFor={(display) => getDownloadRowLabels(t, display, pendingLabel)}
                transferActive={downloads.isDownloading}
                inert={pendingLabel !== undefined}
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
                onOpenLink={(url) =>
                  bridgeApi.openExternalUrl(url).catch((err: unknown) => {
                    console.error('ReceiveFileList: open link failed', err)
                  })
                }
              />
            ))}
          </RowGroup>
        ) : null}
      </div>

      {footer ? (
        <div className='mt-4 shrink-0'>
          <TransferActionGroup>{footer}</TransferActionGroup>
        </div>
      ) : null}
    </div>
  )
}
