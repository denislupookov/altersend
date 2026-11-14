import { useEffect, useState, type ReactNode } from 'react'
import { ExternalLink } from '@altersend/components'
import { useAccount, type AccountPhase } from '@altersend/domain'
import { useTranslation } from '@altersend/locales'
import { accountAdapter } from '../../lifecycle/account'
import {
  CheckoutWaitingStatus,
  CodeEntryField,
  PaywallComparison,
  PurchaseSuccessContent,
  SavedCodeDialog
} from '../Settings/sections/account'
import { OnboardingFooter, type FooterAction } from './OnboardingFooter'
import { PageHeading } from './PageHeading'

interface PaywallPageProps {
  index: number
  pageCount: number
  onBack: () => void
  onFinish: () => void
}

interface AccountPage {
  content: ReactNode
  primary: FooterAction
  secondary?: FooterAction
}

export function PaywallPage({ index, pageCount, onBack, onFinish }: PaywallPageProps) {
  const { t } = useTranslation(['settings', 'common'])
  const model = useAccount(accountAdapter)
  const [confirmDone, setConfirmDone] = useState(false)

  useEffect(() => {
    if (model.phase === 'active') onFinish()
  }, [model.phase, onFinish])

  if (model.phase === 'active') return null

  const errorText = model.errorKey && t(model.errorKey)

  const waiting: AccountPage = {
    content: <CheckoutWaitingStatus model={model} errorText={errorText} />,
    primary: {
      label: t('settings:account.checkAgain'),
      disabled: model.busy,
      onClick: model.retryUpgrade
    },
    secondary: {
      label: t('settings:account.cancel'),
      disabled: model.busy,
      onClick: model.cancelUpgrade
    }
  }

  const pages: Record<Exclude<AccountPhase, 'active'>, AccountPage> = {
    paywall: {
      content: (
        <>
          <PageHeading
            title={t('settings:account.paywallTitle')}
            description={t('settings:account.paywallLead')}
          />
          <PaywallComparison model={model} errorText={errorText} />
          <div className='pb-2'>
            <ExternalLink onPress={model.busy ? undefined : model.showEntry}>
              {t('settings:account.haveCodeLink')}
            </ExternalLink>
          </div>
        </>
      ),
      primary: {
        label: t('settings:account.getPro'),
        loading: model.busy,
        onClick: model.startUpgrade
      },
      secondary: { label: t('common:actions.back'), onClick: onBack }
    },
    entering: {
      content: (
        <>
          <PageHeading title={t('settings:account.enterCodeTitle')} />
          <div className='mt-6'>
            <CodeEntryField model={model} errorText={errorText} />
          </div>
        </>
      ),
      primary: {
        label: t('settings:account.activate'),
        loading: model.busy,
        disabled: !model.codeReady,
        onClick: model.activate
      },
      secondary: {
        label: t('common:actions.back'),
        disabled: model.busy,
        onClick: model.showPaywall
      }
    },
    approval: waiting,
    waiting,
    success: {
      content: (
        <>
          <PurchaseSuccessContent model={model} />
          <SavedCodeDialog
            open={confirmDone}
            onConfirm={model.acknowledge}
            onCancel={() => setConfirmDone(false)}
          />
        </>
      ),
      primary: { label: t('settings:account.done'), onClick: () => setConfirmDone(true) }
    }
  }

  const page = pages[model.phase]

  return (
    <>
      <div className='flex min-h-0 flex-1 flex-col overflow-y-auto px-8 pt-12'>{page.content}</div>
      <OnboardingFooter
        index={index}
        pageCount={pageCount}
        primary={page.primary}
        secondary={page.secondary}
      />
    </>
  )
}
