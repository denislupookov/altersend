import {
  Badge,
  Button,
  DownloadRow,
  ReceivedTextRow,
  RowGroup,
  rowKey,
  ToggleSwitch,
  useTheme
} from '@altersend/components'
import { ArrowLeftIcon, CheckIcon, DownloadIcon, PlayIcon } from '@altersend/components/icons'
import {
  formatTransferRate,
  getDownloadRowLabels,
  getPrimaryDownloadLabel,
  useCopiedFlag
} from '@altersend/domain'
import { useEffect, useState } from 'react'
import { useTranslation } from '@altersend/locales'
import {
  BLOCK_WIDTH,
  Card,
  CardFooter,
  CardStatusRow,
  ScreenIntro,
  SendBackModal
} from '../../components'
import type { TextOffer } from '../../transfer/peerProtocol'
import type { TransferFile } from '../../types'
import { getHintLabel, getMetaLabel, getStatusLabel, getTitleLabel } from './downloadView'
import { useIsCompact } from '../../useIsCompact'
import { useDownloadSummary } from './useDownloadSummary'

export interface DownloadScreenProps {
  files: TransferFile[]
  texts: TextOffer[]
  error?: string
  inApp: boolean
  forceZip: boolean
  onForceZipChange: (value: boolean) => void
  onDownload: (ids: string[]) => void
  onDownloadAll: () => void
  onReset: () => void
}

const noop = () => {}

export function DownloadScreen({
  files,
  texts,
  error,
  inApp,
  forceZip,
  onForceZipChange,
  onDownload,
  onDownloadAll,
  onReset
}: DownloadScreenProps) {
  const { t } = useTranslation(['web', 'receive', 'common', 'errors'])
  const { theme } = useTheme()
  const { copiedId, flashCopied } = useCopiedFlag()
  const summary = useDownloadSummary(files, texts)
  const [promptDismissed, setPromptDismissed] = useState(false)
  const [promptReady, setPromptReady] = useState(false)
  const isPhone = useIsCompact()
  const hint = summary.count > 0 ? getHintLabel(t, summary) : null
  const showZipToggle = !isPhone && summary.count > 1 && summary.primaryAction === 'download-all'

  useEffect(() => {
    if (isPhone || !summary.allDownloaded) {
      setPromptReady(false)
      return
    }
    const timer = setTimeout(() => setPromptReady(true), 1000)
    return () => clearTimeout(timer)
  }, [isPhone, summary.allDownloaded])

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
      rates={summary.rates}
      rateLabelFor={(rate) => formatTransferRate(rate, t)}
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

  const footerInfo = () => {
    if (showZipToggle) {
      return (
        <ToggleSwitch
          checked={forceZip}
          onChange={onForceZipChange}
          disabled={summary.isDownloading}
          label={t('web:download.asZip')}
        />
      )
    }
    if (hint) return <span className='text-sm text-text-muted'>{hint}</span>
    return null
  }

  return (
    <>
      <ScreenIntro
        title={t('web:download.title', { files: getTitleLabel(t, summary) })}
        description={t('web:download.description')}
      />

      {inApp && (
        <div
          className={`${isPhone ? BLOCK_WIDTH : 'w-full max-w-[520px]'} mb-4 rounded-xl bg-warning-subtle px-4 py-3 text-sm leading-relaxed text-warning`}
        >
          {t('web:download.inAppWarning')}
        </div>
      )}

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

        <CardFooter align={showZipToggle || hint ? 'between' : 'end'}>
          {footerInfo()}

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
              onClick={onDownloadAll}
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
        <div className={isPhone ? `mt-2 ${BLOCK_WIDTH}` : 'mt-4 flex justify-center'}>
          <Button
            variant={isPhone ? 'secondary' : 'ghost'}
            size={isPhone ? 'lg' : 'sm'}
            width={isPhone ? 'full' : 'auto'}
            icon={<ArrowLeftIcon size={16} />}
            onClick={onReset}
          >
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
