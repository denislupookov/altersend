import { useState } from 'react'
import { Button, useTheme } from '@altersend/components'
import { useTranslation } from '@altersend/locales'
import { Linking, Platform, StyleSheet, View } from 'react-native'
import { useUpdateCheck } from '../../hooks/useUpdateCheck'
import { BottomSheet } from '../BottomSheet'
import { Text } from '@/src/components/ThemedText'
import UpdateSvg from '../../../../../assets/update.svg'

const STORE_URL =
  Platform.OS === 'ios'
    ? 'https://apps.apple.com/us/app/altersend-file-transfer/id6772496271'
    : 'https://play.google.com/store/apps/details?id=com.altersend.mobile'

export function UpdateBanner() {
  const { t } = useTranslation(['common'])
  const { theme } = useTheme()
  const c = theme.colors
  const { needsUpdate, dismiss } = useUpdateCheck()
  const [dismissed, setDismissed] = useState(false)

  const handleDismiss = () => {
    setDismissed(true)
    dismiss()
  }

  const handleUpdate = () => {
    handleDismiss()
    void Linking.openURL(STORE_URL).catch((err) => {
      console.warn('UpdateBanner: failed to open store URL', err)
    })
  }

  return (
    <BottomSheet open={needsUpdate && !dismissed} onClose={handleDismiss}>
      <View style={styles.content}>
        <UpdateSvg width={188} height={163} style={styles.image} />

        <Text style={[styles.title, { color: c.colorTextPrimary }]}>
          {t('common:update.available')}
        </Text>
        <Text style={[styles.description, { color: c.colorTextMuted }]}>
          {t('common:update.description')}
        </Text>

        <View style={styles.actions}>
          <Button onClick={handleUpdate} variant='primary' size='lg' width='full'>
            {t('common:update.updateNow')}
          </Button>
          <Button onClick={handleDismiss} variant='ghost' size='lg' width='full'>
            {t('common:update.notNow')}
          </Button>
        </View>
      </View>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 8
  },
  image: {
    marginBottom: 8
  },
  title: {
    fontSize: 19,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 10
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 320,
    marginBottom: 8
  },
  actions: {
    width: '100%',
    gap: 8,
    marginTop: 4
  }
})
