import { useCallback, useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { LOCALE_OPTIONS, useTranslation, type LocalePreference } from '@altersend/locales'
import { loadPeers, useSubscriptionStore, useTransferStore } from '@altersend/domain'
import {
  AppearancePicker,
  MenuGroup,
  MenuItem,
  SYSTEM_THEME_PREFERENCE,
  ThemeType,
  useTheme
} from '@altersend/components'
import {
  GlobeIcon,
  InfoIcon,
  MailIcon,
  SlidersHorizontalIcon,
  SmartphoneIcon,
  UserIcon,
  WaypointsIcon
} from '@altersend/components/icons'
import { Layout } from '@/src/components'
import {
  getLocalePreferenceSnapshot,
  getSavedLocalePreference,
  subscribeLocalePreference
} from '@/src/lifecycle/localePreferenceStorage'

export default function SettingsScreen() {
  const { t } = useTranslation(['settings', 'common'])
  const { theme, themePreference, setThemePreference } = useTheme()
  const c = theme.colors
  const router = useRouter()
  const [localePreference, setLocalePreference] = useState<LocalePreference>(
    getLocalePreferenceSnapshot
  )
  const peers = useTransferStore((s) => s.peers)
  const isPro = useSubscriptionStore((s) => s.active)

  useEffect(() => {
    void loadPeers()
  }, [])

  useEffect(() => subscribeLocalePreference(setLocalePreference), [])

  useFocusEffect(
    useCallback(() => {
      let active = true
      void getSavedLocalePreference()
        .then((preference) => {
          if (active) setLocalePreference(preference)
        })
        .catch((error) => {
          console.warn('Failed to load locale preference:', error)
        })
      return () => {
        active = false
      }
    }, [])
  )

  const languageLabel =
    LOCALE_OPTIONS.find((option) => option.preference === localePreference)?.nativeName ??
    t('common:labels.systemDefault')

  const appearanceLabels = {
    [ThemeType.Light]: t('settings:appearance.light'),
    [ThemeType.Dark]: t('settings:appearance.dark'),
    [SYSTEM_THEME_PREFERENCE]: t('settings:appearance.system')
  }

  return (
    <Layout hasNativeHeader>
      <View style={styles.container}>
        {isPro ? (
          <MenuGroup>
            <MenuItem
              isLast
              label={t('settings:account.title')}
              icon={<UserIcon size={19} color={c.colorTextSecondary} />}
              onPress={() => router.push('/subscription')}
            />
          </MenuGroup>
        ) : null}

        <MenuGroup title={t('settings:sections.general')}>
          <MenuItem
            label={t('settings:pairing.pairedDevices')}
            value={peers.length === 0 ? undefined : String(peers.length)}
            icon={<SmartphoneIcon size={19} color={c.colorTextSecondary} />}
            onPress={() => router.push('/devices')}
          />
          <MenuItem
            label={t('settings:sections.general')}
            icon={<SlidersHorizontalIcon size={19} color={c.colorTextSecondary} />}
            onPress={() => router.push('/general')}
          />
          <MenuItem
            label={t('common:labels.language')}
            value={languageLabel}
            icon={<GlobeIcon size={19} color={c.colorTextSecondary} />}
            onPress={() => router.push('/language')}
          />
          <MenuItem
            isLast
            label={t('settings:rows.connection')}
            icon={<WaypointsIcon size={19} color={c.colorTextSecondary} />}
            onPress={() => router.push('/connection')}
          />
        </MenuGroup>

        <MenuGroup title={t('settings:sections.support')}>
          <MenuItem
            label={t('settings:rows.feedback')}
            icon={<MailIcon size={19} color={c.colorTextSecondary} />}
            onPress={() => router.push('/report')}
          />
          <MenuItem
            isLast
            label={t('settings:sections.about')}
            icon={<InfoIcon size={19} color={c.colorTextSecondary} />}
            onPress={() => router.push('/about')}
          />
        </MenuGroup>

        <AppearancePicker
          value={themePreference}
          labels={appearanceLabels}
          onChange={setThemePreference}
          title={t('settings:appearance.title')}
        />
      </View>
    </Layout>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 22
  }
})
