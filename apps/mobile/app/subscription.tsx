import { useEffect, useRef, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { AccountCodeCard, Button, LinkRow, Spinner, useTheme } from '@altersend/components'
import { LogOutIcon } from '@altersend/components/icons'
import { useTranslation } from '@altersend/locales'
import { formatAccountCode } from '@altersend/domain'
import { useRouter } from 'expo-router'
import { ConfirmDialog, Layout } from '@/src/components'
import { useToast } from '@/src/components/Toast'
import { useAccountModel } from '@/src/account'
import { selectionTap } from '@/src/account/haptics'
import { useCopyAccountCode } from '@/src/account/useCopyAccountCode'

export default function SubscriptionScreen() {
  const { t } = useTranslation(['settings', 'common', 'send'])
  const { theme } = useTheme()
  const c = theme.colors
  const toast = useToast()
  const router = useRouter()
  const model = useAccountModel()
  const { copied, copyCode } = useCopyAccountCode(model.account?.code)
  const [confirmLogOut, setConfirmLogOut] = useState(false)
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

  return (
    <Layout hasNativeHeader footer={footer}>
      <AccountCodeCard
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

      <View style={styles.planCard}>
        <LinkRow
          standalone
          isLast
          label={t('settings:account.planPro')}
          subtitle={
            account.validUntil
              ? t('settings:account.activeUntil', { date: account.validUntil.slice(0, 10) })
              : undefined
          }
          trailing={
            <Button
              size='sm'
              variant='ghost'
              loading={model.busy}
              onClick={model.subscription.manage}
            >
              {t('settings:account.manage')}
            </Button>
          }
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
          copyCode()
          model.subscription.logOut()
        }}
        onCancel={() => setConfirmLogOut(false)}
      />
    </Layout>
  )
}

const styles = StyleSheet.create({
  loading: { alignItems: 'center', paddingTop: 32 },
  planCard: { marginTop: 14 },
  footer: { gap: 10 }
})
