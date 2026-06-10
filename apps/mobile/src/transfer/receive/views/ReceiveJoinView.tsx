import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Button, Input, useTheme, withAlpha } from '@altersend/components'
import { ChevronRightIcon, QrCodeIcon } from '@altersend/components/icons'

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
  const { theme } = useTheme()
  const trimmed = joinCode.trim()
  const canConnect = trimmed.length > 0 && !isLoading

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole='button'
        onPress={onScanQr}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: theme.colors.colorBackgroundSubtle,
            borderColor: theme.colors.colorBorderPrimary,
            opacity: pressed ? 0.85 : 1
          }
        ]}
      >
        <View style={styles.qrRow}>
          <View
            style={[
              styles.qrIconBadge,
              { backgroundColor: withAlpha(theme.colors.colorInfo, 0.16) }
            ]}
          >
            <QrCodeIcon size={22} color={theme.colors.colorInfo} />
          </View>
          <View style={styles.qrText}>
            <Text style={[styles.qrTitle, { color: theme.colors.colorTextPrimary }]}>
              Scan or import QR
            </Text>
            <Text style={[styles.qrSubtitle, { color: theme.colors.colorTextSecondary }]}>
              Use the camera, or import a saved image
            </Text>
          </View>
          <ChevronRightIcon size={18} color={theme.colors.colorTextMuted} />
        </View>
      </Pressable>

      <View style={styles.divider}>
        <Text style={[styles.dividerText, { color: theme.colors.colorTextMuted }]}>
          or paste code
        </Text>
      </View>

      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.colorBackgroundSubtle,
            borderColor: theme.colors.colorBorderPrimary,
            padding: 18,
            gap: 14
          }
        ]}
      >
        <Input
          disabled={isLoading}
          error={joinCodeError}
          label='Connection code'
          mono
          secure
          onChange={(e: { target: { value: string } }) => onJoinCodeChange(e.target.value)}
          placeholder='Paste 64-char code…'
          type='text'
          value={joinCode}
        />

        <Button disabled={!canConnect} onClick={onConnect} size='md' variant='primary' width='full'>
          {isLoading ? 'Connecting…' : 'Connect'}
        </Button>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 16
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16
  },
  qrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14
  },
  qrIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  qrText: {
    flex: 1,
    gap: 2
  },
  qrTitle: {
    fontSize: 16,
    fontWeight: '600'
  },
  qrSubtitle: {
    fontSize: 13,
    lineHeight: 18
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
