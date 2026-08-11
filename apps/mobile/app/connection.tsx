import { StyleSheet, View } from 'react-native'
import { useState } from 'react'
import { ToggleSwitch, useTheme } from '@altersend/components'
import { useTranslation } from '@altersend/locales'
import { Layout } from '@/src/components'
import { Text } from '@/src/components/ThemedText'
import { isRelayEnabled, setRelayEnabledStorage } from '@/src/lifecycle/relayStorage'
import { mobileApi } from '@/src/api/mobileApi'

export default function ConnectionScreen() {
  const { t } = useTranslation(['settings'])
  const { theme } = useTheme()
  const [relay, setRelay] = useState(isRelayEnabled)

  const handleRelayToggle = (value: boolean) => {
    setRelay(value)
    setRelayEnabledStorage(value)
    mobileApi.worker.setRelayConfig({ enabled: value }).catch(() => {
      setRelay(!value)
      setRelayEnabledStorage(!value)
    })
  }

  const cardStyle = {
    backgroundColor: theme.colors.colorBackgroundSubtle,
    borderColor: theme.colors.colorBorderPrimary
  }

  return (
    <Layout hasNativeHeader>
      <View style={[styles.card, styles.cardPad, cardStyle]}>
        <ToggleSwitch
          checked={relay}
          onChange={handleRelayToggle}
          label={t('settings:relay.label')}
        />
      </View>
      <View style={styles.info}>
        <Text style={[styles.infoLine, { color: theme.colors.colorTextMuted }]}>
          {t('settings:relay.description')}
        </Text>
      </View>
    </Layout>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden'
  },
  cardPad: {
    paddingHorizontal: 16,
    paddingVertical: 13
  },
  info: {
    marginTop: 16
  },
  infoLine: {
    fontSize: 13,
    lineHeight: 19
  }
})
