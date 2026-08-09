import { useEffect, useRef, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import * as Clipboard from 'expo-clipboard'
import { AccountCodeCard, Button, LinkRow, Spinner, useTheme } from '@altersend/components'
import { LogOutIcon, TrashIcon } from '@altersend/components/icons'
import { useTranslation } from '@altersend/locales'
import { formatAccountCode, useCopiedFlag } from '@altersend/domain'
import { useRouter } from 'expo-router'
import { ConfirmDialog, Layout } from '@/src/components'
import { useToast } from '@/src/components/Toast'
import { useAccountModel } from '@/src/account'

const COPY_ID = 'account-code'

export default function SubscriptionScreen() {
  const { t } = useTranslation(['settings', 'common'])
  const { copiedId, flashCopied } = useCopiedFlag()
  const { theme } = useTheme()
  const c = theme.colors
  const toast = useToast()
  const router = useRouter()
  const model = useAccountModel()
  const [confirmDelete, setConfirmDelete] = useState(false)
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

  const copyCode = () => {
    Clipboard.setStringAsync(formatAccountCode(account.code))
      .then(() => flashCopied(COPY_ID))
      .catch((err) => console.warn('[account] clipboard write failed', err))
  }

  const footer = (
    <View style={styles.footer}>
      <Button
        size='lg'
        variant='secondary'
        width='full'
        icon={<LogOutIcon size={16} />}
        disabled={model.busy}
        onClick={model.subscription.logOut}
      >
        {t('settings:account.logOut')}
      </Button>
      <Button
        size='lg'
        variant='danger'
        width='full'
        icon={<TrashIcon size={16} />}
        disabled={model.busy}
        onClick={() => setConfirmDelete(true)}
      >
        {t('settings:account.deleteAccount')}
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
        copied={copiedId === COPY_ID}
        onCopy={copyCode}
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
        open={confirmDelete}
        title={t('settings:account.deleteTitle')}
        message={t('settings:account.deleteBody')}
        confirmLabel={t('settings:account.deleteAccount')}
        cancelLabel={t('common:actions.cancel')}
        onConfirm={() => {
          setConfirmDelete(false)
          model.subscription.destroy()
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </Layout>
  )
}

const styles = StyleSheet.create({
  loading: { alignItems: 'center', paddingTop: 32 },
  planCard: { marginTop: 14 },
  footer: { gap: 10 }
})
