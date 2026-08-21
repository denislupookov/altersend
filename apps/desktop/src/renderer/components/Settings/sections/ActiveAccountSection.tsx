import { useState } from 'react'
import { AccountCodeCard, Button, LinkRow, Spinner } from '@altersend/components'
import { ChevronRightIcon } from '@altersend/components/icons'

import { useTranslation } from '@altersend/locales'
import { formatAccountCode, subscriptionSummary, useCopiedFlag } from '@altersend/domain'
import type { AccountModel } from '@altersend/domain'
import { ConfirmDialog } from '../../ConfirmDialog'
import { useToast } from '../../Toast'
import { SectionShell } from './SectionShell'

const COPY_ID = 'account-code'

export function ActiveAccountSection({ model }: { model: AccountModel }) {
  const { t, i18n } = useTranslation(['settings', 'common', 'send'])
  const { copiedId, flashCopied } = useCopiedFlag()
  const toast = useToast()
  const [confirmLogOut, setConfirmLogOut] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)

  const account = model.account
  const errorText = model.errorKey && t(model.errorKey)

  if (!account) {
    return (
      <SectionShell title={t('settings:account.title')}>
        <div className='mt-2 flex items-center gap-3'>
          <Spinner size={18} />
        </div>
      </SectionShell>
    )
  }

  const copyCode = async (): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(formatAccountCode(account.code))
    } catch {
      return false
    }

    flashCopied(COPY_ID)
    toast.show({ title: t('send:connection.copiedToast') })

    return true
  }

  const billingDate = (value: string) =>
    new Date(value).toLocaleDateString(i18n.resolvedLanguage ?? i18n.language, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })

  const { canManage, canCancel, cancelling, endsAt } = model.subscription
  const canOpen = canManage || canCancel

  const openSubscription = () => {
    if (canManage) {
      model.subscription.manage()
      return
    }
    setConfirmCancel(true)
  }

  const planSummary = subscriptionSummary(
    { cancelling, endsAt, validUntil: account.validUntil, canOpen },
    t,
    billingDate
  )

  const footer = (
    <div className='flex items-center justify-end gap-2'>
      <Button
        size='sm'
        variant='danger'
        disabled={model.busy}
        onClick={() => setConfirmLogOut(true)}
      >
        {t('settings:account.logOut')}
      </Button>
    </div>
  )

  return (
    <SectionShell title={t('settings:account.title')} footer={footer}>
      <div className='mt-1 overflow-hidden rounded-2xl border border-border-primary bg-background-subtle'>
        <AccountCodeCard
          attached
          hidden
          inline
          code={account.code}
          label={t('settings:account.yourCode')}
          copyLabel={t('common:actions.copy')}
          copiedLabel={t('settings:account.copied')}
          revealLabel={t('settings:account.reveal')}
          hideLabel={t('settings:account.hide')}
          copied={copiedId === COPY_ID}
          onCopy={copyCode}
        />

        <div className='h-px bg-border-primary' />

        <LinkRow
          isLast
          label={t('settings:account.subscriptionRow')}
          trailing={
            <div className='flex items-center gap-2'>
              <span className='text-[14px] text-text-muted'>{planSummary}</span>
              {canOpen ? <ChevronRightIcon size={14} /> : null}
            </div>
          }
          onPress={canOpen ? openSubscription : undefined}
        />
      </div>

      {errorText ? <p className='m-0 mt-4 text-[12px] text-text-danger'>{errorText}</p> : null}

      <ConfirmDialog
        destructive
        open={confirmLogOut}
        title={t('settings:account.logOutTitle')}
        message={t('settings:account.logOutBody', { code: formatAccountCode(account.code) })}
        confirmLabel={t('settings:account.copyAndLogOut')}
        cancelLabel={t('common:actions.cancel')}
        onConfirm={() => {
          setConfirmLogOut(false)
          copyCode().then((copied) => {
            if (copied) model.subscription.logOut()
            else toast.show({ title: t('settings:account.copyFailed'), variant: 'error' })
          })
        }}
        onCancel={() => setConfirmLogOut(false)}
      />

      <ConfirmDialog
        destructive
        open={confirmCancel}
        title={t('settings:account.cancelTitle')}
        message={t('settings:account.cancelBody')}
        confirmLabel={t('settings:account.cancelConfirm')}
        cancelLabel={t('common:actions.cancel')}
        onConfirm={() => {
          setConfirmCancel(false)
          model.subscription.cancel()
        }}
        onCancel={() => setConfirmCancel(false)}
      />
    </SectionShell>
  )
}
