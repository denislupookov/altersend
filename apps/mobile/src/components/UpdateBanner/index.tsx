import { useTheme } from '@altersend/components'
import { useTranslation } from '@altersend/locales'
import { ArrowUp, X } from 'lucide-react-native'
import { Linking, Platform, Pressable, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useUpdateCheck } from '../../hooks/useUpdateCheck'
import { Text } from '@/src/components/ThemedText'

const STORE_URL =
  Platform.OS === 'ios'
    ? 'https://apps.apple.com/us/app/altersend-file-transfer/id6772496271'
    : 'https://play.google.com/store/apps/details?id=com.altersend.mobile'

export function UpdateBanner() {
  const { t } = useTranslation(['common'])
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()
  const { needsUpdate, dismiss } = useUpdateCheck()

  if (!needsUpdate) return null

  return (
    <View pointerEvents='box-none' style={[styles.container, { top: insets.top + 16 }]}>
      <View
        style={[
          styles.banner,
          {
            backgroundColor: theme.colors.colorSurfaceSecondary,
            borderColor: theme.colors.colorBorderPrimary,
            shadowColor: theme.colors.colorScrim
          }
        ]}
      >
        <View style={[styles.iconWrap, { backgroundColor: theme.colors.colorInfoSubtle }]}>
          <ArrowUp size={14} color={theme.colors.colorInfo} />
        </View>

        <Text style={[styles.label, { color: theme.colors.colorTextPrimary }]} numberOfLines={1}>
          {t('common:update.available')}
        </Text>

        <Pressable
          onPress={() => {
            dismiss()
            void Linking.openURL(STORE_URL).catch(() => {})
          }}
          hitSlop={8}
        >
          <Text style={[styles.updateBtn, { color: theme.colors.colorInfo }]}>
            {t('common:update.update')}
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole='button'
          accessibilityLabel={t('common:actions.dismiss')}
          onPress={dismiss}
          hitSlop={8}
        >
          <X size={16} color={theme.colors.colorTextSecondary} />
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8
  },
  iconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center'
  },
  label: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600'
  },
  updateBtn: {
    fontSize: 14,
    fontWeight: '600'
  }
})
