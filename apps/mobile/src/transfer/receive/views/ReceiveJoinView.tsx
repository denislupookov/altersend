import React from 'react'
import { StyleSheet, View } from 'react-native'
import { Button, Input, LinkRow, useTheme } from '@altersend/components'
import { QrCodeIcon } from '@altersend/components/icons'
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

  return (
    <View style={styles.container}>
      <LinkRow
        icon={<QrCodeIcon size={20} color={theme.colors.colorInfo} />}
        iconBackground={theme.colors.colorInfoSubtle}
        label={t('receive:actions.scanOrImportQr')}
        onPress={onScanQr}
        standalone
        subtitle={t('receive:actions.scanOrImportQrHintMobile')}
      />

      <View style={styles.divider}>
        <Text style={[styles.dividerText, { color: theme.colors.colorTextMuted }]}>
          {t('receive:form.orPasteCode')}
        </Text>
      </View>

      <View style={styles.codeForm}>
        <Input
          disabled={isLoading}
          error={joinCodeError}
          mono
          secure
          onChange={(e: { target: { value: string } }) => onJoinCodeChange(e.target.value)}
          placeholder={t('receive:form.codePlaceholder')}
          type='text'
          value={joinCode}
        />

        <Button disabled={!canConnect} onClick={onConnect} size='md' variant='primary' width='full'>
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
    alignItems: 'center',
    paddingVertical: 2
  },
  dividerText: {
    fontSize: 12
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
