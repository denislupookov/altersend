import React from 'react'
import { View, StyleSheet, Linking } from 'react-native'
import * as Clipboard from 'expo-clipboard'
import { LinkRow, Button, useTheme } from '@altersend/components'
import { getDownloadRowDisplay, getOfferKey, useTransferStore } from '@altersend/domain'
import { useTranslation } from '@altersend/locales'
import { Text } from '@/src/components/ThemedText'

export function ReceiveIncomingView() {
  const { t } = useTranslation(['receive'])
  const incomingFileOffers = useTransferStore((s) => s.incomingFileOffers)
  const downloadStates = useTransferStore((s) => s.receiveDownloadStates)
  const { theme } = useTheme()

  const textOffer = incomingFileOffers.find((f) => f.kind === 'text')
  const isTextTransfer = textOffer !== undefined

  const isUrl = React.useMemo(() => {
    if (textOffer?.kind !== 'text') return false
    try {
      const url = new URL(textOffer.content)
      return url.protocol === 'https:' || url.protocol === 'http:'
    } catch {
      return false
    }
  }, [textOffer])

  return (
    <View style={styles.container}>
      {isTextTransfer ? (
        <View style={styles.textContainer}>
          <Text style={[styles.textContent, { color: theme.colors.colorTextPrimary }]}>
            {textOffer.content}
          </Text>
          <View style={styles.textActions}>
            {isUrl ? (
              <Button
                onClick={() => void Linking.openURL(textOffer.content!)}
                size='sm'
                variant='primary'
              >
                {t('common:actions.openLink', { defaultValue: 'Open Link' })}
              </Button>
            ) : (
              <Button
                onClick={() => void Clipboard.setStringAsync(textOffer.content!)}
                size='sm'
                variant='primary'
              >
                {t('common:actions.copyText', { defaultValue: 'Copy Text' })}
              </Button>
            )}
          </View>
        </View>
      ) : incomingFileOffers.length > 0 ? (
        <View
          style={[
            styles.card,
            {
              borderColor: theme.colors.colorBorderPrimary,
              backgroundColor: theme.colors.colorBackgroundSubtle
            }
          ]}
        >
          {incomingFileOffers.map((file, index) => {
            if (file.kind !== 'file') return null
            const row = getDownloadRowDisplay(file, downloadStates[getOfferKey(file)])
            return (
              <LinkRow
                key={getOfferKey(file)}
                file
                bare
                isFirst={index === 0}
                label={file.name}
                size={file.size}
                description={row.isActive ? `${row.description} · ${row.percent}%` : undefined}
                progressPercent={row.isActive || row.isCompleted ? row.percent : undefined}
              />
            )
          })}
        </View>
      ) : (
        <Text style={[styles.waitingText, { color: theme.colors.colorTextMuted }]}>
          {t('receive:status.waitingForFiles')}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 16
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden'
  },
  waitingText: {
    fontSize: 13
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16
  },
  textContent: {
    fontSize: 16,
    textAlign: 'center'
  },
  textActions: {
    flexDirection: 'row',
    gap: 8
  }
})
