import { useEffect, useRef, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { AccountCodeCard, Button, MenuItem, Spinner, useTheme } from '@altersend/components'
import { LogOutIcon } from '@altersend/components/icons'
import { useTranslation } from '@altersend/locales'
import { formatAccountCode, subscriptionSummary } from '@altersend/domain'
import { useRouter } from 'expo-router'
import { ConfirmDialog, Layout } from '@/src/components'
import { useToast } from '@/src/components/Toast'
import { useAccountModel } from '@/src/account'
import { selectionTap } from '@/src/haptics'
import { useCopyAccountCode } from '@/src/account/useCopyAccountCode'

export default function SubscriptionScreen() {
  const { t, i18n } = useTranslation(['settings', 'common', 'send'])
  const { theme } = useTheme()
  const c = theme.colors
  const toast = useToast()
  const router = useRouter()
  const model = useAccountModel()
  const { copied, copyCode } = useCopyAccountCode(model.account?.code, () =>
    toast.show({ title: t('send:connection.copiedToast') })
  )
  const [confirmLogOut, setConfirmLogOut] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const wasActive = useRef(false)

  const { errorKey, clearError, phase, account } = model

  useEffect(() => {
    if (!errorKey) return
    toast.show({ title: t(errorKey), tone: 'error' })
    clearError()
  }, [errorKey, clearError, toast, t])

  useEffect(() => {
    if (phase === 'active') {
      wasActive.current = true
      return
    }
    if (wasActive.current) router.back()
  }, [phase, router])

  if (!account) {
    return (
      <Layout hasNativeHeader>
        <View style={styles.loading}>
          <Spinner size={18} color={c.colorTextMuted} />
        </View>
      </Layout>
    )
  }

  const footer = (
    <View style={styles.footer}>
      <Button
        size='lg'
        variant='danger'
        width='full'
        icon={<LogOutIcon size={16} />}
        disabled={model.busy}
        onClick={() => setConfirmLogOut(true)}
      >
        {t('settings:account.logOut')}
      </Button>
    </View>
  )

  const billingDate = (value: string) =>
    new Date(value).toLocaleDateString(i18n.resolvedLanguage ?? i18n.language, {
      month: 'short',
      day: 'numeric'
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

  return (
    <Layout hasNativeHeader footer={footer}>
      <View
        style={[
          styles.group,
          { borderColor: c.colorBorderPrimary, backgroundColor: c.colorBackgroundSubtle }
        ]}
      >
        <AccountCodeCard
          attached
          hidden
          code={account.code}
          label={t('settings:account.yourCode')}
          copyLabel={t('common:actions.copy')}
          copiedLabel={t('settings:account.copied')}
          revealLabel={t('settings:account.reveal')}
          hideLabel={t('settings:account.hide')}
          copied={copied}
          onCopy={copyCode}
          onToggleReveal={selectionTap}
        />

        <View style={[styles.divider, { backgroundColor: c.colorBorderPrimary }]} />

        <MenuItem
          isLast
          label={t('settings:account.subscriptionRow')}
          value={planSummary ?? undefined}
          chevron={canOpen}
          disabled={model.busy}
          onPress={canOpen ? openSubscription : undefined}
        />
      </View>

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
            else toast.show({ title: t('settings:account.copyFailed'), tone: 'error' })
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
    </Layout>
  )
}

const styles = StyleSheet.create({
  group: { borderWidth: 1, borderRadius: 16, overflow: 'hidden' },
  divider: { height: StyleSheet.hairlineWidth },
  loading: { alignItems: 'center', paddingTop: 32 },
  footer: { gap: 10 }
})
