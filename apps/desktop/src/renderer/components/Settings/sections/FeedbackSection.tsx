import { useState } from 'react'
import { Button, FeedbackTypeSelector } from '@altersend/components'
import { SendIcon } from '@altersend/components/icons'
import type { FeedbackType } from '@altersend/components'
import { submitFeedback } from '@altersend/domain'
import { useTranslation } from '@altersend/locales'
import { SectionShell } from './SectionShell'

export function FeedbackSection({ version }: { version: string }) {
  const { t } = useTranslation(['feedback', 'common'])
  const [reportType, setReportType] = useState<FeedbackType>('bug')
  const [reportMessage, setReportMessage] = useState('')
  const [reportState, setReportState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  const sendReport = async () => {
    setReportState('sending')
    const sent = await submitFeedback({
      webhookUrl: import.meta.env.VITE_DISCORD_WEBHOOK_URL,
      title: t(`feedback:types.${reportType}`),
      message: reportMessage.trim(),
      version,
      platform: t('common:labels.desktop'),
      labels: { version: t('common:labels.version'), platform: t('common:labels.platform') }
    })
    setReportState(sent ? 'sent' : 'error')
  }

  return (
    <SectionShell title={t('feedback:title')}>
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
            className='w-full resize-none rounded-lg border border-border-primary bg-background-subtle px-3 py-3 font-sans text-[13px] text-text-primary placeholder:text-text-muted focus:border-border-strong focus:outline-none disabled:opacity-50'
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
          <div className='mt-3 flex justify-end'>
            <Button
              variant='primary'
              size='sm'
              icon={<SendIcon size={14} />}
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
    </SectionShell>
  )
}
