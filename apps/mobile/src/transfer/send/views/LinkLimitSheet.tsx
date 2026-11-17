import { StyleSheet, View } from 'react-native'
import { useTheme } from '@altersend/components'
import { formatFileSize, WEB_LINK_MAX_LABEL } from '@altersend/domain'
import { useTranslation } from '@altersend/locales'
import { BottomSheet, SheetActions } from '@/src/components'
import { Text } from '@/src/components/ThemedText'

interface LinkLimitSheetProps {
  open: boolean
  totalSize: number
  onClose: () => void
  onGetPro: () => void
}

export function LinkLimitSheet({ open, totalSize, onClose, onGetPro }: LinkLimitSheetProps) {
  const { t } = useTranslation(['send', 'settings'])
  const { theme } = useTheme()

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={t('send:connection.linkLimitTitle', { limit: WEB_LINK_MAX_LABEL })}
      sheetStyle={styles.sheet}
    >
      <View style={styles.content}>
        <Text style={[styles.body, { color: theme.colors.colorTextSecondary }]}>
          {t('send:connection.linkLimitBody', { size: formatFileSize(totalSize) })}
        </Text>
        <SheetActions
          primaryLabel={t('settings:account.getPro')}
          onPrimary={onGetPro}
          onClose={onClose}
        />
      </View>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  sheet: { paddingBottom: 4, gap: 20 },
  content: { paddingHorizontal: 16, gap: 14 },
  body: { fontSize: 15, lineHeight: 21 }
})
