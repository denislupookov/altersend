import { useState } from 'react'
import { AccountCodeCard, Button, SuccessBurst, useTheme } from '@altersend/components'
import { CheckIcon } from '@altersend/components/icons'
import { useTranslation } from '@altersend/locales'
import {
  ACCOUNT_CODE_FILE_NAME,
  accountCodeFile,
  formatAccountCode,
  useCopiedFlag
} from '@altersend/domain'
import { bridgeApi } from '../../../../api/bridgeApi'
import { ConfirmDialog } from '../../../ConfirmDialog'
import { SectionShell } from '../SectionShell'
import type { AccountPhaseProps } from './types'

const COPY_ID = 'account-code'
const SAVE_ID = 'account-code-file'
const BURST_SIZE = 72

export function PurchaseSuccess({ model }: AccountPhaseProps) {
  const { t, i18n } = useTranslation(['settings', 'common'])
  const { copiedId, flashCopied } = useCopiedFlag()
  const [confirmDone, setConfirmDone] = useState(false)
  const { theme } = useTheme()
  const c = theme.colors

  if (!model.account) return null

  const code = model.account.code

  const saveCode = () => {
    if (!model.account) return

    const contents = accountCodeFile(
      model.account.code,
      new Date().toLocaleDateString(i18n.resolvedLanguage ?? i18n.language),
      {
        title: t('settings:account.codeFileTitle'),
        codeLabel: t('settings:account.codeFileCode'),
        savedLabel: t('settings:account.codeFileSaved'),
        warning: t('settings:account.codeFileWarning')
      }
    )

    bridgeApi
      .saveAccountCode(contents, ACCOUNT_CODE_FILE_NAME)
      .then((saved) => {
        if (saved) flashCopied(SAVE_ID)
      })
      .catch((err) => console.warn('[account] saving the code failed', err))
  }

  const copyCode = () => {
    if (!code) return
    navigator.clipboard
      .writeText(formatAccountCode(code))
      .then(() => flashCopied(COPY_ID))
      .catch((err) => console.warn('[account] clipboard write failed', err))
  }

  const footer = (
    <div className='flex items-center justify-end'>
      <Button size='sm' variant='primary' onClick={() => setConfirmDone(true)}>
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

      <p className='m-0 mx-auto mt-3 max-w-[420px] text-center text-[14px] leading-[20px] text-text-secondary'>
        {t('settings:account.saveWarning')}
      </p>

      <div className='mt-6'>
        <AccountCodeCard
          code={model.account.code}
          label={t('settings:account.yourCode')}
          copyLabel={t('common:actions.copy')}
          copiedLabel={t('settings:account.copied')}
          saveLabel={t('settings:account.saveCode')}
          savedLabel={t('settings:account.codeFileSaved')}
          copied={copiedId === COPY_ID}
          saved={copiedId === SAVE_ID}
          onCopy={copyCode}
          onSave={saveCode}
        />
      </div>

      <ConfirmDialog
        open={confirmDone}
        title={t('settings:account.savedCodeTitle')}
        message={t('settings:account.savedCodeBody')}
        confirmLabel={t('settings:account.savedCodeConfirm')}
        cancelLabel={t('common:actions.cancel')}
        onConfirm={model.acknowledge}
        onCancel={() => setConfirmDone(false)}
      />
    </SectionShell>
  )
}
