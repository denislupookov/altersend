import { StyleSheet, View } from 'react-native'
import * as Clipboard from 'expo-clipboard'
import { AccountCodeCard, Button, SuccessBurst, useTheme } from '@altersend/components'
import { CheckIcon } from '@altersend/components/icons'
import { useTranslation } from '@altersend/locales'
import { formatAccountCode, useCopiedFlag } from '@altersend/domain'
import { Layout } from '@/src/components'
import { Text } from '@/src/components/ThemedText'
import { DismissRow } from './DismissRow'
import type { AccountPhaseProps } from './types'

const COPY_ID = 'account-code'
const BURST_SIZE = 84

export function PurchaseSuccess({ model, onDismiss }: AccountPhaseProps) {
  const { t } = useTranslation(['settings', 'common'])
  const { copiedId, flashCopied } = useCopiedFlag()
  const { theme } = useTheme()
  const c = theme.colors

  if (!model.account) return null

  const code = model.account.code

  const copyCode = () => {
    if (!code) return
    Clipboard.setStringAsync(formatAccountCode(code))
      .then(() => flashCopied(COPY_ID))
      .catch((err) => console.warn('[account] clipboard write failed', err))
  }

  const footer = (
    <View style={styles.footer}>
      <Button size='lg' width='full' onClick={model.acknowledge}>
        {t('settings:account.done')}
      </Button>
    </View>
  )

  return (
    <Layout compactTop footer={footer}>
      <DismissRow onDismiss={onDismiss} />

      <View style={styles.celebration}>
        <SuccessBurst
          size={BURST_SIZE}
          markColor={c.colorSuccess}
          tones={[c.colorAccent, c.colorInfo, c.colorSuccess, c.colorWarning]}
          icon={<CheckIcon size={38} color={c.colorBackground} />}
        />
        <Text style={[styles.title, { color: c.colorTextPrimary }]}>
          {t('settings:account.successTitle')}
        </Text>
      </View>

      <View style={styles.card}>
        <AccountCodeCard
          code={model.account.code}
          label={t('settings:account.yourCode')}
          copyLabel={t('common:actions.copy')}
          copiedLabel={t('settings:account.copied')}
          copied={copiedId === COPY_ID}
          onCopy={copyCode}
        />
      </View>

      <Text style={[styles.warning, { color: c.colorTextSecondary }]}>
        {t('settings:account.saveWarning')}
      </Text>
    </Layout>
  )
}

const styles = StyleSheet.create({
  footer: { gap: 10 },
  celebration: { alignItems: 'center', marginTop: 8 },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginTop: -28,
    textAlign: 'center'
  },
  card: { marginTop: 28 },
  warning: { fontSize: 14, lineHeight: 20, marginTop: 16, textAlign: 'center' }
})
