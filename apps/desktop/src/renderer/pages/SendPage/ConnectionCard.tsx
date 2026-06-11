import { buildJoinUrl } from '@altersend/domain'
import { QrCodeIcon } from '@altersend/components/icons'
import { useTranslation } from '@altersend/locales'
import { QRCode } from '../../components/QRCode'
import { TopicCopyButton } from './TopicCopyButton'

interface ConnectionCardProps {
  topic: string
  hasActivity: boolean
  isKeyCopied: boolean
  onCopy: () => void
  onOpenQR: () => void
}

export function ConnectionCard({
  topic,
  hasActivity,
  isKeyCopied,
  onCopy,
  onOpenQR
}: ConnectionCardProps) {
  return (
    <section className='overflow-hidden rounded-[10px] border border-border-primary bg-background-subtle'>
      {hasActivity ? (
        <ConnectedKey topic={topic} isKeyCopied={isKeyCopied} onCopy={onCopy} onOpenQR={onOpenQR} />
      ) : (
        <WaitingForPeers topic={topic} isKeyCopied={isKeyCopied} onCopy={onCopy} />
      )}
    </section>
  )
}

interface WaitingForPeersProps {
  topic: string
  isKeyCopied: boolean
  onCopy: () => void
}

function WaitingForPeers({ topic, isKeyCopied, onCopy }: WaitingForPeersProps) {
  const { t } = useTranslation(['send'])

  return (
    <div className='flex flex-col gap-5 px-5 py-5'>
      <TopicCopyButton
        topic={topic}
        copied={isKeyCopied}
        onCopy={onCopy}
        placeholder={t('send:connection.placeholder')}
      />

      <div className='flex items-center gap-3'>
        <span className='h-px flex-1 bg-border-primary' />
        <span className='text-[11px] text-text-muted'>{t('send:connection.orScan')}</span>
        <span className='h-px flex-1 bg-border-primary' />
      </div>

      <div className='flex flex-col items-center gap-3'>
        {topic ? (
          <QRCode
            imageLabel={t('send:connection.qrCodeLabel')}
            loadingLabel={t('send:connection.generating')}
            size={180}
            value={buildJoinUrl(topic)}
          />
        ) : (
          <div
            className='flex items-center justify-center rounded-lg bg-surface-primary text-[12px] text-text-muted'
            style={{ width: 180, height: 180 }}
          >
            {t('send:connection.generating')}
          </div>
        )}
        <div className='flex items-center gap-2'>
          <div className='relative flex h-3.5 w-3.5 shrink-0 items-center justify-center'>
            <span
              className='absolute h-3.5 w-3.5 animate-ping rounded-full border border-border-strong'
              style={{ opacity: 0.4, animationDuration: '2.5s' }}
            />
            <div className='relative h-1.5 w-1.5 rounded-full bg-text-muted' />
          </div>
          <span className='text-[12px] text-text-muted'>
            {t('send:connection.waitingForConnection')}
          </span>
        </div>
      </div>
    </div>
  )
}

interface ConnectedKeyProps {
  topic: string
  isKeyCopied: boolean
  onCopy: () => void
  onOpenQR: () => void
}

function ConnectedKey({ topic, isKeyCopied, onCopy, onOpenQR }: ConnectedKeyProps) {
  const { t } = useTranslation(['send'])

  return (
    <div className='flex items-center gap-2 px-5 py-5'>
      <TopicCopyButton topic={topic} copied={isKeyCopied} onCopy={onCopy} placeholder='—' />
      {topic ? (
        <button
          aria-label={t('send:connection.showQrLabel')}
          className='flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[8px] border border-border-primary bg-surface-primary text-text-muted transition-colors hover:bg-surface-secondary hover:text-text-primary'
          onClick={onOpenQR}
          type='button'
        >
          <QrCodeIcon size={14} label={t('send:connection.showQrLabel')} />
        </button>
      ) : null}
    </div>
  )
}
