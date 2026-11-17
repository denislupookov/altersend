import { StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'
import { ExternalLink, useTheme } from '@altersend/components'
import { useTranslation } from '@altersend/locales'
import { BottomSheet, SheetActions } from '@/src/components'
import { Text } from '@/src/components/ThemedText'

interface TryDirectSheetProps {
  open: boolean
  onClose: () => void
  onTryAgain: () => void
}

export function TryDirectSheet({ open, onClose, onTryAgain }: TryDirectSheetProps) {
  const { t } = useTranslation(['receive', 'common'])
  const { theme } = useTheme()
  const c = theme.colors
  const router = useRouter()

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={t('receive:relayLimit.directTitle')}
      sheetStyle={styles.sheet}
    >
      <View style={styles.content}>
        <View style={styles.tips}>
          <Text style={[styles.tip, { color: c.colorTextSecondary }]}>
            {`1. ${t('receive:relayLimit.directSameWifi')}`}
          </Text>
          <Text style={[styles.tip, { color: c.colorTextSecondary }]}>
            {`2. ${t('receive:relayLimit.directVpn')}`}
          </Text>
        </View>
        <Text style={[styles.note, { color: c.colorTextMuted }]}>
          {t('receive:relayLimit.directFree')}
        </Text>
        <View style={styles.ownRelay}>
          <Text style={[styles.note, { color: c.colorTextMuted }]}>
            {t('receive:relayLimit.directOwnRelay')}
          </Text>
          <ExternalLink
            onPress={() => {
              onClose()
              router.push('/connection')
            }}
          >
            {t('receive:actions.openRelaySettings')}
          </ExternalLink>
        </View>
        <SheetActions
          primaryLabel={t('common:actions.tryAgain')}
          onPrimary={onTryAgain}
          onClose={onClose}
        />
      </View>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  sheet: { paddingBottom: 4, gap: 20 },
  content: { paddingHorizontal: 16, gap: 14 },
  tips: { gap: 6 },
  tip: { fontSize: 16, lineHeight: 22 },
  note: { fontSize: 14, lineHeight: 20 },
  ownRelay: { gap: 6, alignItems: 'flex-start' }
})
