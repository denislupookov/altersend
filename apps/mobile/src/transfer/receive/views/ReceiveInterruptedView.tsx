import React, { PropsWithChildren } from 'react'
import { StyleSheet, View } from 'react-native'
import type { IncomingFileOffer } from '@altersend/core'
import { LinkRow, useTheme, withAlpha } from '@altersend/components'
import { CloseIcon } from '@altersend/components/icons'
import { getOfferKey, type DownloadItemState } from '@altersend/domain'
import { useTranslation } from '@altersend/locales'
import { IllustrationLayout } from '@/src/components'
import { OpenAction, getFileMeta } from '../utils/fileRowUtils'
import MissingFilesSvg from '../../../../../../assets/missing-files.svg'
import { Text } from '@/src/components/ThemedText'

interface ReceiveInterruptedViewProps {
  title: string
  description: string
  footer?: React.ReactElement
  incomingFileOffers: IncomingFileOffer[]
  downloadStates: Record<string, DownloadItemState>
  onOpenFile: (offerKey: string) => void
  onMenuPress?: () => void
}

export function ReceiveInterruptedView({
  title,
  description,
  footer,
  incomingFileOffers,
  downloadStates,
  onOpenFile,
  onMenuPress,
  children
}: PropsWithChildren<ReceiveInterruptedViewProps>) {
  const { t } = useTranslation(['receive', 'common'])
  const { theme } = useTheme()

  const completedCount = incomingFileOffers.filter(
    (file) => downloadStates[getOfferKey(file)]?.status === 'completed'
  ).length
  const total = incomingFileOffers.length

  return (
    <IllustrationLayout
      title={title}
      description={description}
      footer={footer}
      onMenuPress={onMenuPress}
      illustration={<MissingFilesSvg width='100%' height='100%' />}
      aspectRatio={1009 / 880}
      width='70%'
    >
      <View style={styles.cards}>
        <View
          style={[
            styles.statusCard,
            {
              borderColor: withAlpha(theme.colors.colorWarning, 0.22),
              backgroundColor: withAlpha(theme.colors.colorWarning, 0.08)
            }
          ]}
        >
          <View
            style={[
              styles.statusIconBadge,
              { backgroundColor: withAlpha(theme.colors.colorWarning, 0.18) }
            ]}
          >
            <CloseIcon size={16} color={theme.colors.colorWarning} />
          </View>
          <View style={styles.statusText}>
            <Text style={[styles.statusTitle, { color: theme.colors.colorWarning }]}>
              {t('receive:summary.receivedCount', { completed: completedCount, count: total })}
            </Text>
            <Text style={[styles.statusSubtitle, { color: theme.colors.colorTextMuted }]}>
              {t('receive:summary.senderLeftBeforeFinishing')}
            </Text>
          </View>
        </View>

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
            const offerKey = getOfferKey(file)
            const state = downloadStates[offerKey]
            const isComplete = state?.status === 'completed'
            return (
              <LinkRow
                key={file.id}
                file
                bare
                isFirst={index === 0}
                disabled={!isComplete}
                label={file.name}
                description={getFileMeta(file.size, state, t, { disabled: !isComplete })}
                trailing={
                  isComplete ? (
                    <OpenAction fileName={file.name} offerKey={offerKey} onPress={onOpenFile} />
                  ) : undefined
                }
              />
            )
          })}
        </View>
      </View>
      {children}
    </IllustrationLayout>
  )
}

const styles = StyleSheet.create({
  cards: {
    gap: 12
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16
  },
  statusIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  statusText: {
    flex: 1,
    minWidth: 0
  },
  statusTitle: {
    fontSize: 15,
    fontWeight: '700'
  },
  statusSubtitle: {
    fontSize: 13,
    marginTop: 2
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden'
  }
})
