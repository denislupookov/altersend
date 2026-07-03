import React from 'react'
import { StyleSheet, View } from 'react-native'
import * as Clipboard from 'expo-clipboard'
import { Button, Input, LinkRow, useTheme } from '@altersend/components'
import { ClipboardIcon, DownloadIcon, QrCodeIcon } from '@altersend/components/icons'
import { useTranslation } from '@altersend/locales'
import { Text } from '@/src/components/ThemedText'

interface ReceiveJoinViewProps {
  joinCode: string
  onJoinCodeChange: (value: string) => void
  joinCodeError?: string
  isLoading: boolean
  onConnect: () => void
  onScanQr: () => void
}

export function ReceiveJoinView({
  joinCode,
  onJoinCodeChange,
  joinCodeError,
  isLoading,
  onConnect,
  onScanQr
}: ReceiveJoinViewProps) {
  const { t } = useTranslation(['receive', 'common'])
  const { theme } = useTheme()
  const trimmed = joinCode.trim()
  const canConnect = trimmed.length > 0 && !isLoading

  const handlePaste = async () => {
    const text = await Clipboard.getStringAsync()
    if (text) onJoinCodeChange(text)
  }

  return (
    <View style={styles.container}>
      <LinkRow
        icon={<QrCodeIcon size={20} color={theme.colors.colorTextMuted} />}
        iconBackground={theme.colors.colorSurfacePrimary}
        label={t('receive:actions.scanOrImportQr')}
        onPress={onScanQr}
        standalone
        subtitle={t('receive:actions.scanOrImportQrHintMobile')}
        subtitleTone='faint'
      />

      <View style={styles.divider}>
        <View style={[styles.dividerLine, { backgroundColor: theme.colors.colorBorderPrimary }]} />
        <Text style={[styles.dividerText, { color: theme.colors.colorTextFaint }]}>
          {t('receive:form.orPasteCode')}
        </Text>
        <View style={[styles.dividerLine, { backgroundColor: theme.colors.colorBorderPrimary }]} />
      </View>

      <View style={styles.codeForm}>
        <Input
          aria-label={t('receive:form.codeLabel')}
          disabled={isLoading}
          error={joinCodeError}
          onChange={(e: { target: { value: string } }) => onJoinCodeChange(e.target.value)}
          placeholder={t('receive:form.codePlaceholder')}
          trailing={
            <Button
              variant='ghost'
              size='sm'
              iconOnly
              aria-label={t('common:actions.paste')}
              disabled={isLoading}
              onClick={() => {
                handlePaste().catch(() => {})
              }}
              icon={<ClipboardIcon size={16} />}
            />
          }
          type='text'
          value={joinCode}
        />

        <Button
          disabled={!canConnect}
          onClick={onConnect}
          variant='primary'
          size='lg'
          width='full'
          icon={<DownloadIcon size={18} />}
        >
          {isLoading ? t('common:actions.connecting') : t('common:actions.connect')}
        </Button>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 16
  },
  codeForm: {
    gap: 10
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 6
  },
  dividerLine: {
    flex: 1,
    height: 1
  },
  dividerText: {
    fontSize: 12.5
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4
  },
  footerText: {
    fontSize: 12
  }
})
