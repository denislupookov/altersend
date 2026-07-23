import {
  Button,
  DownloadRow,
  ReceivedTextRow,
  RowGroup,
  rowKey,
  useTheme
} from '@altersend/components'
import { ArrowLeftIcon, CheckIcon, DownloadIcon, PlayIcon } from '@altersend/components/icons'
import { getDownloadRowLabels, getPrimaryDownloadLabel, useCopiedFlag } from '@altersend/domain'
import { useTranslation } from '@altersend/locales'
import { Card, CardFooter, CardStatusRow, ScreenIntro, StatusPill } from '../../components'
import type { TextOffer } from '../../transfer/peerProtocol'
import type { TransferFile } from '../../types'
import { getHintLabel, getMetaLabel, getStatusLabel, getTitleLabel } from './downloadView'
import { useDownloadSummary } from './useDownloadSummary'

export interface DownloadScreenProps {
  files: TransferFile[]
  texts: TextOffer[]
  error?: string
  onDownload: (ids: string[]) => void
  onPause: (ids: string[]) => void
  onDownloadAll: () => void
  onResumeAll: () => void
  onReset: () => void
}

const noop = () => {}

export function DownloadScreen({
  files,
  texts,
  error,
  onDownload,
  onPause,
  onDownloadAll,
  onResumeAll,
  onReset
}: DownloadScreenProps) {
  const { t } = useTranslation(['web', 'receive', 'common', 'errors'])
  const { theme } = useTheme()
  const { copiedId, flashCopied } = useCopiedFlag()
  const summary = useDownloadSummary(files, texts)

  const copyText = (offer: TextOffer) => {
    navigator.clipboard
      .writeText(offer.content)
      .then(() => flashCopied(offer.id))
      .catch((err) => console.warn('Failed to copy text', err))
  }

  return (
    <>
      <ScreenIntro
        title={t('web:download.title', { files: getTitleLabel(t, summary) })}
        description={t('web:download.description')}
      />

      <Card>
        <CardStatusRow
          status={
            <StatusPill
              tone='success'
              icon={
                summary.allDownloaded ? (
                  <CheckIcon size={14} color={theme.colors.colorSuccess} />
                ) : (
                  <span className='h-[7px] w-[7px] rounded-full bg-success' />
                )
              }
            >
              {getStatusLabel(t, summary)}
            </StatusPill>
          }
          meta={
            <span className='text-sm tabular-nums text-text-muted'>{getMetaLabel(t, summary)}</span>
          }
        />

        {summary.rows.length > 0 && (
          <RowGroup title={t('common:files.files')}>
            <div className='max-h-[min(46vh,380px)] overflow-y-auto'>
              {summary.rows.map((row, index) => (
                <DownloadRow
                  key={rowKey(row)}
                  row={row}
                  states={summary.states}
                  labelsFor={(display) => getDownloadRowLabels(t, display)}
                  transferActive={summary.isDownloading}
                  isFirst={index === 0}
                  compact
                  onResume={(offer) => onDownload([offer.id])}
                  onPause={(offer) => onPause([offer.id])}
                  onOpen={noop}
                  onPauseFolder={(offers) => onPause(offers.map((offer) => offer.id))}
                  onResumeFolder={(offers) => onDownload(offers.map((offer) => offer.id))}
                />
              ))}
            </div>
          </RowGroup>
        )}

        {texts.length > 0 && (
          <div className={summary.rows.length > 0 ? 'mt-5' : undefined}>
            <RowGroup title={t('common:files.text')}>
              {texts.map((offer, index) => (
                <ReceivedTextRow
                  key={offer.id}
                  content={offer.content}
                  isFirst={index === 0}
                  copied={copiedId === offer.id}
                  subtitleLabel={t('common:files.text')}
                  copyLabel={t('common:actions.copyText')}
                  copiedLabel={t('common:actions.copied')}
                  showMoreLabel={t('common:actions.showMore')}
                  showLessLabel={t('common:actions.showLess')}
                  onCopy={() => copyText(offer)}
                  onOpenLink={(url) => window.open(url, '_blank', 'noopener,noreferrer')}
                />
              ))}
            </RowGroup>
          </div>
        )}

        {error && <p className='mt-4 text-sm text-danger'>{error}</p>}

        <CardFooter>
          <span className='text-sm text-text-muted'>
            {summary.count > 0 ? getHintLabel(t, summary) : null}
          </span>

          {summary.primaryAction ? (
            <Button
              disabled={summary.primaryAction === 'downloading'}
              loading={summary.primaryAction === 'downloading'}
              icon={
                summary.primaryAction === 'resume-all' ? (
                  <PlayIcon size={14} />
                ) : (
                  <DownloadIcon size={14} />
                )
              }
              onClick={() =>
                summary.primaryAction === 'resume-all' ? onResumeAll() : onDownloadAll()
              }
              size='sm'
              variant={summary.primaryAction === 'downloading' ? 'secondary' : 'primary'}
            >
              {getPrimaryDownloadLabel(t, summary.primaryAction, {
                percent: summary.totals.percent,
                totalBytes: summary.totals.totalBytes
              })}
            </Button>
          ) : (
            <Button size='sm' variant='secondary' onClick={onReset}>
              {t('common:actions.done')}
            </Button>
          )}
        </CardFooter>
      </Card>

      <div className='mt-6'>
        <Button variant='ghost' size='sm' icon={<ArrowLeftIcon size={16} />} onClick={onReset}>
          {t('web:download.enterAnother')}
        </Button>
      </div>
    </>
  )
}
