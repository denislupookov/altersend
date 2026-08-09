import { useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { Button, useTheme, WaitingState } from '@altersend/components'
import { ArrowUpCircleIcon, GlobeIcon } from '@altersend/components/icons'
import { useTranslation } from '@altersend/locales'
import { Layout } from '@/src/components'
import { Text } from '@/src/components/ThemedText'
import { DismissRow } from './DismissRow'
import type { AccountPhaseProps } from './types'

const RECOVERY_DELAY_MS = 15000

export function CheckoutWaiting({ model, errorText, onDismiss }: AccountPhaseProps) {
  const { t } = useTranslation(['settings'])
  const { theme } = useTheme()

  const viaStore = Boolean(model.store)
  const [recoveryVisible, setRecoveryVisible] = useState(!viaStore)

  useEffect(() => {
    if (!viaStore) return
    const timer = setTimeout(() => setRecoveryVisible(true), RECOVERY_DELAY_MS)
    return () => clearTimeout(timer)
  }, [viaStore])

  const footer = recoveryVisible ? (
    <View style={styles.footer}>
      <Button
        size='lg'
        variant='secondary'
        width='full'
        disabled={model.busy}
        onClick={model.retryUpgrade}
      >
        {t('settings:account.checkAgain')}
      </Button>
      <Button
        size='sm'
        variant='ghost'
        width='full'
        disabled={model.busy}
        onClick={model.cancelUpgrade}
      >
        {t('settings:account.cancel')}
      </Button>
    </View>
  ) : undefined

  return (
    <Layout compactTop footer={footer}>
      <DismissRow onDismiss={onDismiss} />
      <View style={styles.centre}>
        <WaitingState
          icon={viaStore ? <ArrowUpCircleIcon size={30} /> : <GlobeIcon size={30} />}
          title={t(
            viaStore ? 'settings:account.waitingTitleStore' : 'settings:account.waitingTitle'
          )}
          description={t(
            viaStore ? 'settings:account.waitingBodyStore' : 'settings:account.waitingBody'
          )}
        />
        {errorText ? (
          <Text style={[styles.error, { color: theme.colors.colorDanger }]}>{errorText}</Text>
        ) : null}
      </View>
    </Layout>
  )
}

const styles = StyleSheet.create({
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  footer: { gap: 10 },
  error: { fontSize: 13, lineHeight: 18, marginTop: 12, textAlign: 'center' }
})
