import { AccountCodeCard, Button, SuccessBurst, useTheme } from '@altersend/components'
import { CheckIcon } from '@altersend/components/icons'
import { useTranslation } from '@altersend/locales'
import { formatAccountCode, useCopiedFlag } from '@altersend/domain'
import { SectionShell } from '../SectionShell'
import type { AccountPhaseProps } from './types'

const COPY_ID = 'account-code'
const BURST_SIZE = 72

export function PurchaseSuccess({ model }: AccountPhaseProps) {
  const { t } = useTranslation(['settings', 'common'])
  const { copiedId, flashCopied } = useCopiedFlag()
  const { theme } = useTheme()
  const c = theme.colors

  if (!model.account) return null

  const code = model.account.code

  const copyCode = () => {
    if (!code) return
    navigator.clipboard
      .writeText(formatAccountCode(code))
      .then(() => flashCopied(COPY_ID))
      .catch((err) => console.warn('[account] clipboard write failed', err))
  }

  const footer = (
    <div className='flex items-center justify-end'>
      <Button size='sm' variant='primary' onClick={model.acknowledge}>
        {t('settings:account.done')}
      </Button>
    </div>
  )

  return (
    <SectionShell footer={footer}>
      <div className='flex flex-col items-center'>
        <SuccessBurst
          size={BURST_SIZE}
          markColor={c.colorSuccess}
          tones={[c.colorAccent, c.colorInfo, c.colorSuccess, c.colorWarning]}
          icon={<CheckIcon size={32} color={c.colorBackground} />}
        />
        <h2 className='m-0 -mt-6 text-center text-[28px] font-bold leading-tight tracking-[-0.5px] text-text-primary'>
          {t('settings:account.successTitle')}
        </h2>
      </div>

      <div className='mt-7'>
        <AccountCodeCard
          code={model.account.code}
          label={t('settings:account.yourCode')}
          copyLabel={t('common:actions.copy')}
          copiedLabel={t('settings:account.copied')}
          copied={copiedId === COPY_ID}
          onCopy={copyCode}
        />
      </div>

      <p className='m-0 mt-4 text-center text-[14px] leading-[20px] text-text-secondary'>
        {t('settings:account.saveWarning')}
      </p>
    </SectionShell>
  )
}
