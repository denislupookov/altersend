import React from 'react'
import { View, StyleSheet } from 'react-native'
import { LinkRow, useTheme } from '@altersend/components'
import { getDownloadRowDisplay, getOfferKey, useTransferStore } from '@altersend/domain'
import { useTranslation } from '@altersend/locales'
import { Text } from '@/src/components/ThemedText'

export function ReceiveIncomingView() {
  const { t } = useTranslation(['receive'])
  const incomingFileOffers = useTransferStore((s) => s.incomingFileOffers)
  const downloadStates = useTransferStore((s) => s.receiveDownloadStates)
  const { theme } = useTheme()

  return (
    <View style={styles.container}>
      {incomingFileOffers.length > 0 ? (
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
  }
})
