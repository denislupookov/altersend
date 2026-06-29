import { StyleSheet, View } from 'react-native'
import { Button, useTheme } from '@altersend/components'
import { useTranslation } from '@altersend/locales'
import SyncDevicesSvg from '../../../../../assets/sync_devices.svg'
import { Text } from '@/src/components/ThemedText'
import { BottomSheet } from '../BottomSheet'

interface PairDeviceSheetProps {
  open: boolean
  onPair: () => void
  onClose: () => void
}

export function PairDeviceSheet({ open, onPair, onClose }: PairDeviceSheetProps) {
  const { t } = useTranslation(['settings'])
  const { theme } = useTheme()
  const c = theme.colors

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={t('settings:pairPrompt.title')}
      sheetStyle={styles.sheet}
    >
      <View style={styles.content}>
        <SyncDevicesSvg width={240} height={170} />
        <Text style={[styles.heading, { color: c.colorTextPrimary }]}>
          {t('settings:pairPrompt.heading')}
        </Text>
        <Text style={[styles.body, { color: c.colorTextMuted }]}>
          {t('settings:pairPrompt.body')}
        </Text>
      </View>
      <View style={styles.actions}>
        <Button variant='primary' width='full' size='lg' onClick={onPair}>
          {t('settings:pairPrompt.pairButton')}
        </Button>
        <Button variant='secondary' width='full' size='lg' onClick={onClose}>
          {t('settings:pairPrompt.skip')}
        </Button>
      </View>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  sheet: { paddingBottom: 48, gap: 24 },
  content: { alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingTop: 36 },
  heading: { fontSize: 20, fontWeight: '700', textAlign: 'center', marginTop: 40 },
  body: { fontSize: 14, lineHeight: 20, textAlign: 'center' },
  actions: { gap: 10, paddingHorizontal: 20 }
})
