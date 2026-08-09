import { useRouter } from 'expo-router'
import { Button, Host } from '@expo/ui/swift-ui'
import { buttonStyle, controlSize, font, padding } from '@expo/ui/swift-ui/modifiers'
import { ThemeType, useTheme } from '@altersend/components'
import { useTranslation } from '@altersend/locales'

export function UpgradeButton() {
  const { t } = useTranslation(['settings'])
  const { themeType } = useTheme()
  const router = useRouter()

  return (
    <Host
      matchContents
      colorScheme={themeType === ThemeType.Light ? 'light' : 'dark'}
      style={{ backgroundColor: 'transparent' }}
    >
      <Button
        label={t('settings:account.upgrade')}
        modifiers={[
          buttonStyle('plain'),
          controlSize('small'),
          font({ textStyle: 'subheadline' }),
          padding({ horizontal: 4, vertical: 2 })
        ]}
        onPress={() => router.push('/account')}
      />
    </Host>
  )
}
