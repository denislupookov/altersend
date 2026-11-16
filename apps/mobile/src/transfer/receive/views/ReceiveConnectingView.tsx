import React from 'react'
import { StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { ExternalLink, useTheme } from '@altersend/components'
import { useConnectingStatus } from '@altersend/domain'
import { Trans, useTranslation } from '@altersend/locales'
import { Text } from '@/src/components/ThemedText'
import ConnectingSvg from '../../../../../../assets/connecting.svg'
import { ReceiveStatusView } from './ReceiveStatusView'

export function ReceiveConnectingView() {
  const { t } = useTranslation(['receive'])
  const { theme } = useTheme()
  const router = useRouter()
  const { status, showProOffer } = useConnectingStatus(t)

  return (
    <ReceiveStatusView
      status={status}
      illustration={<ConnectingSvg width='100%' height='100%' />}
      aspectRatio={960 / 418.531}
      illustrationWidth='70%'
    >
      {showProOffer ? (
        <Text style={[styles.proOffer, { color: theme.colors.colorTextMuted }]}>
          <Trans
            ns='receive'
            i18nKey='page.relayBusy.proOffer'
            components={{
              pro: <ExternalLink inline onPress={() => router.push('/account')} />
            }}
          />
        </Text>
      ) : null}
    </ReceiveStatusView>
  )
}

const styles = StyleSheet.create({
  proOffer: {
    marginTop: 4,
    maxWidth: 340,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center'
  }
})
