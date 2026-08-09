import { useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import { AccountCodeCard, Button, SuccessBurst, useTheme } from '@altersend/components'
import { CheckIcon } from '@altersend/components/icons'
import { useTranslation } from '@altersend/locales'
import { Layout } from '@/src/components'
import { Text } from '@/src/components/ThemedText'
import { DismissRow } from './DismissRow'
import { successTap } from './haptics'
import { useCopyAccountCode } from './useCopyAccountCode'
import type { AccountPhaseProps } from './types'

const BURST_SIZE = 84

export function PurchaseSuccess({ model, onDismiss }: AccountPhaseProps) {
  const { t } = useTranslation(['settings', 'common'])
  const { theme } = useTheme()
  const c = theme.colors
  const { copied, copyCode } = useCopyAccountCode(model.account?.code)

  useEffect(() => successTap(), [])

  if (!model.account) return null

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

      <Text style={[styles.warning, { color: c.colorTextSecondary }]}>
        {t('settings:account.saveWarning')}
      </Text>

      <View style={styles.card}>
        <AccountCodeCard
          code={model.account.code}
          label={t('settings:account.yourCode')}
          copyLabel={t('common:actions.copy')}
          copiedLabel={t('settings:account.copied')}
          copied={copied}
          onCopy={copyCode}
        />
      </View>
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
  card: { marginTop: 24 },
  warning: { fontSize: 14, lineHeight: 20, marginTop: 12, textAlign: 'center' }
})
