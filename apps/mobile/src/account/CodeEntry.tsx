import { StyleSheet, View } from 'react-native'
import * as Clipboard from 'expo-clipboard'
import { Button, Input, useTheme } from '@altersend/components'
import { ClipboardIcon } from '@altersend/components/icons'
import { useTranslation } from '@altersend/locales'
import { ACCOUNT_CODE_DISPLAY_LENGTH } from '@altersend/domain'
import { HeroBackdrop, Layout } from '@/src/components'
import { IconButton } from '@/src/components/IconButton'
import { Text } from '@/src/components/ThemedText'
import { HEADER_TOP } from './constants'
import { selectionTap, successTap } from '@/src/haptics'
import type { AccountPhaseProps } from './types'

export function CodeEntry({ model, errorText, onDismiss }: AccountPhaseProps) {
  const { t } = useTranslation(['settings', 'common'])
  const { theme } = useTheme()

  const paste = () => {
    Clipboard.getStringAsync()
      .then((text) => {
        model.setEntry(text)
        selectionTap()
      })
      .catch((err) => console.warn('[account] clipboard read failed', err))
  }

  const activate = () => {
    model.activate().then((ok) => {
      if (ok) successTap()
    })
  }

  return (
    <Layout compactTop backdrop={<HeroBackdrop />}>
      <View style={styles.navRow}>
        <IconButton
          icon='back'
          size='large'
          label={t('settings:account.back')}
          onPress={model.showPaywall}
        />
        <IconButton
          icon='close'
          size='large'
          label={t('common:actions.close')}
          onPress={onDismiss}
        />
      </View>

      <Text style={[styles.title, { color: theme.colors.colorTextPrimary }]}>
        {t('settings:account.enterCodeTitle')}
      </Text>

      <View style={styles.field}>
        <Input
          mono
          autoFocus
          value={model.entry}
          inputMode='numeric'
          maxLength={ACCOUNT_CODE_DISPLAY_LENGTH}
          autoComplete='off'
          spellCheck={false}
          disabled={model.busy}
          aria-label={t('settings:account.enterCodeTitle')}
          placeholder={t('settings:account.codePlaceholder')}
          error={errorText ?? undefined}
          trailing={
            <Button
              variant='ghost'
              size='sm'
              iconOnly
              aria-label={t('common:actions.paste')}
              disabled={model.busy}
              icon={<ClipboardIcon size={18} />}
              onClick={paste}
            />
          }
          onChange={(e: { target: { value: string } }) => model.setEntry(e.target.value)}
        />
      </View>

      <View style={styles.action}>
        <Button
          size='lg'
          width='full'
          loading={model.busy}
          disabled={!model.codeReady}
          onClick={activate}
        >
          {t('settings:account.activate')}
        </Button>
      </View>
    </Layout>
  )
}

const styles = StyleSheet.create({
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: HEADER_TOP
  },
  title: {
    flexShrink: 1,
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.6,
    marginTop: 32,
    marginBottom: 6
  },
  field: { marginTop: 14 },
  action: { marginTop: 14 }
})
