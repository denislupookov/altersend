import { useRouter } from 'expo-router'
import { Button, Host } from '@expo/ui'
import { useTranslation } from '@altersend/locales'

export function UpgradeButton() {
  const { t } = useTranslation(['settings'])
  const router = useRouter()

  return (
    <Host matchContents>
      <Button
        variant='filled'
        label={t('settings:account.upgrade')}
        onPress={() => router.push('/account')}
      />
    </Host>
  )
}
