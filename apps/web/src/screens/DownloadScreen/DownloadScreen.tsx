import {
  Badge,
  Button,
  DownloadRow,
  ReceivedTextRow,
  RowGroup,
  rowKey,
  useTheme
} from '@altersend/components'
import { ArrowLeftIcon, CheckIcon, DownloadIcon, PlayIcon } from '@altersend/components/icons'
import { getDownloadRowLabels, getPrimaryDownloadLabel, useCopiedFlag } from '@altersend/domain'
import { useEffect, useState } from 'react'
import { useTranslation } from '@altersend/locales'
import { Card, CardFooter, CardStatusRow, ScreenIntro, SendBackModal } from '../../components'
import type { TextOffer } from '../../transfer/peerProtocol'
import type { TransferFile } from '../../types'
import { getHintLabel, getMetaLabel, getStatusLabel, getTitleLabel } from './downloadView'
import { useIsCompact } from '../../useIsCompact'
import { useDownloadSummary } from './useDownloadSummary'

export interface DownloadScreenProps {
  files: TransferFile[]
  texts: TextOffer[]
  error?: string
  onDownload: (ids: string[]) => void
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
  onDownloadAll,
  onResumeAll,
  onReset
}: DownloadScreenProps) {
  const { t } = useTranslation(['web', 'receive', 'common', 'errors'])
  const { theme } = useTheme()
  const { copiedId, flashCopied } = useCopiedFlag()
  const summary = useDownloadSummary(files, texts)
  const [promptDismissed, setPromptDismissed] = useState(false)
  const [promptReady, setPromptReady] = useState(false)
  const isPhone = useIsCompact()

  useEffect(() => {
    if (!summary.allDownloaded) {
      setPromptReady(false)
      return
    }
    const timer = setTimeout(() => setPromptReady(true), 1000)
    return () => clearTimeout(timer)
  }, [summary.allDownloaded])

  const copyText = (offer: TextOffer) => {
    navigator.clipboard
      .writeText(offer.content)
      .then(() => flashCopied(offer.id))
      .catch((err) => console.warn('Failed to copy text', err))
  }

  const renderRow = (row: (typeof summary.rows)[number], index: number) => (
    <DownloadRow
      key={rowKey(row)}
      row={row}
      states={summary.states}
      labelsFor={(display) => getDownloadRowLabels(t, display)}
      transferActive={summary.isDownloading}
      isFirst={index === 0}
      compact
      standalone={isPhone}
      onResume={(offer) => onDownload([offer.id])}
      onOpen={noop}
      onResumeFolder={(offers) => onDownload(offers.map((offer) => offer.id))}
    />
  )

  return (
    <>
      <ScreenIntro
        title={t('web:download.title', { files: getTitleLabel(t, summary) })}
        description={t('web:download.description')}
      />

      <Card bare={isPhone}>
        <CardStatusRow
          status={
            <Badge
              pill
              tone='success'
              dot={!summary.allDownloaded}
              icon={
                summary.allDownloaded ? (
                  <CheckIcon size={14} color={theme.colors.colorSuccess} />
                ) : undefined
              }
            >
              {getStatusLabel(t, summary)}
            </Badge>
          }
          meta={
            <span className='text-[16px] tabular-nums text-text-muted sm:text-[15px]'>
              {getMetaLabel(t, summary)}
            </span>
          }
        />

        {summary.rows.length > 0 &&
          (isPhone ? (
            <div className='mt-4 flex flex-col gap-2'>{summary.rows.map(renderRow)}</div>
          ) : (
            <RowGroup title={t('common:files.files')}>
              <div className='max-h-[min(46vh,380px)] overflow-y-auto'>
                {summary.rows.map(renderRow)}
              </div>
            </RowGroup>
          ))}

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
              size={isPhone ? 'lg' : 'sm'}
              width={isPhone ? 'full' : 'auto'}
              variant={summary.primaryAction === 'downloading' ? 'secondary' : 'primary'}
            >
              {getPrimaryDownloadLabel(t, summary.primaryAction, {
                percent: summary.totals.percent,
                totalBytes: summary.totals.totalBytes
              })}
            </Button>
          ) : (
            <Button
              size={isPhone ? 'lg' : 'sm'}
              width={isPhone ? 'full' : 'auto'}
              variant='primary'
              onClick={onReset}
            >
              {t('common:actions.done')}
            </Button>
          )}
        </CardFooter>
      </Card>

      {!summary.allDownloaded && (
        <div className='mt-6 flex w-full justify-start sm:w-auto sm:justify-center'>
          <Button variant='ghost' size='sm' icon={<ArrowLeftIcon size={16} />} onClick={onReset}>
            {t('web:download.enterAnother')}
          </Button>
        </div>
      )}

      <SendBackModal
        open={promptReady && !promptDismissed}
        onClose={() => setPromptDismissed(true)}
      />
    </>
  )
}
