import { useState } from 'react'
import { Button, FeedbackTypeSelector } from '@altersend/components'
import type { FeedbackType } from '@altersend/components'
import { ArrowLeftIcon, CloseIcon } from '@altersend/components/icons'
import { useTranslation } from '@altersend/locales'

const DISCORD_EMBED_COLOR = 0x5865f2

interface FeedbackPanelProps {
  version: string
  onBack: () => void
  onClose: () => void
}

export function FeedbackPanel({ version, onBack, onClose }: FeedbackPanelProps) {
  const { t } = useTranslation(['feedback', 'common'])
  const [reportType, setReportType] = useState<FeedbackType>('bug')
  const [reportMessage, setReportMessage] = useState('')
  const [reportState, setReportState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  const sendReport = async () => {
    const url = import.meta.env.VITE_DISCORD_WEBHOOK_URL

    if (!url || url.includes('PLACEHOLDER')) return
    setReportState('sending')

    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [
            {
              title: t(`feedback:types.${reportType}`),
              description: reportMessage.trim(),
              color: DISCORD_EMBED_COLOR,
              fields: [
                { name: t('common:labels.version'), value: `v${version}`, inline: true },
                {
                  name: t('common:labels.platform'),
                  value: t('common:labels.desktop'),
                  inline: true
                }
              ],
              timestamp: new Date().toISOString()
            }
          ]
        })
      })
      setReportState('sent')
    } catch {
      setReportState('error')
    }
  }

  return (
    <>
      <div className='flex shrink-0 items-center justify-between border-b border-border-primary px-3 py-3'>
        <Button variant='ghost' size='sm' icon={<ArrowLeftIcon size={13} />} onClick={onBack}>
          {t('feedback:title')}
        </Button>
        <button
          type='button'
          onClick={onClose}
          className='inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-[8px] border-none bg-transparent p-0 text-text-primary transition-colors hover:bg-surface-secondary'
          style={{ appearance: 'none' }}
        >
          <CloseIcon size={14} />
        </button>
      </div>

      <div className='flex-1 overflow-y-auto p-4'>
        {reportState === 'sent' ? (
          <p className='py-8 text-center text-[14px] text-text-secondary'>
            {t('feedback:states.sent')}
          </p>
        ) : (
          <>
            <div className='mb-3'>
              <FeedbackTypeSelector
                value={reportType}
                onChange={setReportType}
                labels={{
                  bug: t('feedback:types.bug'),
                  feature: t('feedback:types.feature'),
                  general: t('feedback:types.general')
                }}
                disabled={reportState === 'sending'}
              />
            </div>
            <textarea
              className='w-full resize-none rounded-lg border border-border-primary bg-surface-secondary px-3 py-3 font-sans text-[13px] text-text-primary placeholder:text-text-muted focus:border-border-strong focus:outline-none disabled:opacity-50'
              rows={5}
              placeholder={
                reportType === 'bug'
                  ? t('feedback:placeholders.desktopBug')
                  : reportType === 'feature'
                    ? t('feedback:placeholders.desktopFeature')
                    : t('feedback:placeholders.general')
              }
              value={reportMessage}
              disabled={reportState === 'sending'}
              onChange={(e) => {
                setReportMessage(e.target.value)
                if (reportState === 'error') setReportState('idle')
              }}
            />
            {reportState === 'error' && (
              <p className='mt-1.5 text-[11px] text-danger'>{t('feedback:states.failed')}</p>
            )}
            <div className='mt-3'>
              <Button
                variant='primary'
                size='sm'
                width='full'
                disabled={!reportMessage.trim() || reportState === 'sending'}
                onClick={() => void sendReport()}
              >
                {reportState === 'sending'
                  ? t('feedback:actions.sending')
                  : t('feedback:actions.send')}
              </Button>
            </div>
          </>
        )}
      </div>
    </>
  )
}
