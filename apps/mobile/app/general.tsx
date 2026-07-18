import { StyleSheet, View } from 'react-native'
import { useCallback, useState } from 'react'
import { useFocusEffect } from 'expo-router'
import { ToggleSwitch, useTheme } from '@altersend/components'
import { useTranslation } from '@altersend/locales'
import { Layout } from '@/src/components'
import {
  isCrashReportingEnabled,
  setCrashReportingEnabled
} from '@/src/lifecycle/crashReportingStorage'
import {
  MEDIA_DESTINATION_KEYS,
  isSaveMediaToPhotos,
  setSaveMediaToPhotos
} from '@/src/lifecycle/downloadPreferenceStorage'
import { closeSentry, initSentry } from '@/src/sentry'

export default function GeneralScreen() {
  const { t } = useTranslation(['settings'])
  const { theme } = useTheme()
  const c = theme.colors
  const [mediaToPhotos, setMediaToPhotos] = useState(isSaveMediaToPhotos)
  const [crashReporting, setCrashReporting] = useState(isCrashReportingEnabled)

  useFocusEffect(
    useCallback(() => {
      setMediaToPhotos(isSaveMediaToPhotos())
      setCrashReporting(isCrashReportingEnabled())
    }, [])
  )

  const handleMediaToggle = (value: boolean) => {
    setMediaToPhotos(value)
    if (!setSaveMediaToPhotos(value)) setMediaToPhotos(!value)
  }

  const handleCrashReportingToggle = (value: boolean) => {
    setCrashReporting(value)
    setCrashReportingEnabled(value)
    if (value) initSentry()
    else closeSentry()
  }

  const cardStyle = {
    backgroundColor: c.colorBackgroundSubtle,
    borderColor: c.colorBorderPrimary
  }

  return (
    <Layout title={t('settings:sections.general')} description='' hasNativeHeader>
      <View style={styles.container}>
        <View style={[styles.card, cardStyle]}>
          <ToggleSwitch
            checked={mediaToPhotos}
            onChange={handleMediaToggle}
            label={t(MEDIA_DESTINATION_KEYS.label)}
            description={t(MEDIA_DESTINATION_KEYS.description)}
          />
        </View>
        <View style={[styles.card, cardStyle]}>
          <ToggleSwitch
            checked={crashReporting}
            onChange={handleCrashReportingToggle}
            label={t('settings:crashReports.label')}
            description={t('settings:crashReports.description')}
          />
        </View>
      </View>
    </Layout>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 10
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    paddingHorizontal: 16,
    paddingVertical: 13
  }
})
