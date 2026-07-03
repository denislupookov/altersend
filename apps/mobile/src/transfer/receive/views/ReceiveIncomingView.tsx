import { Linking, View, StyleSheet } from 'react-native'
import * as Clipboard from 'expo-clipboard'
import { LinkRow, ReceivedTextRow, useTheme } from '@altersend/components'
import {
  getDownloadRowDisplay,
  getOfferKey,
  useCopiedFlag,
  useTransferStore
} from '@altersend/domain'
import { useTranslation } from '@altersend/locales'
import { Text } from '@/src/components/ThemedText'

export function ReceiveIncomingView() {
  const { t } = useTranslation(['receive', 'common'])
  const incomingFileOffers = useTransferStore((s) => s.incomingFileOffers)
  const downloadStates = useTransferStore((s) => s.receiveDownloadStates)
  const { theme } = useTheme()
  const c = theme.colors
  const { copiedId, flashCopied } = useCopiedFlag()

  const copyText = (id: string, content: string) => {
    void Clipboard.setStringAsync(content)
    flashCopied(id)
  }

  const fileOffers = incomingFileOffers.filter(
    (o): o is Extract<typeof o, { kind: 'file' }> => o.kind === 'file'
  )
  const textOffers = incomingFileOffers.filter(
    (o): o is Extract<typeof o, { kind: 'text' }> => o.kind === 'text'
  )

  if (incomingFileOffers.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={[styles.waitingText, { color: c.colorTextMuted }]}>
          {t('receive:status.waitingForFiles')}
        </Text>
      </View>
    )
  }

  const cardStyle = [
    styles.card,
    { borderColor: c.colorBorderPrimary, backgroundColor: c.colorBackgroundSubtle }
  ]

  return (
    <View style={styles.container}>
      {fileOffers.length > 0 ? (
        <View style={styles.section}>
          <Text style={[styles.heading, { color: c.colorTextMuted }]}>
            {t('common:files.files')}
          </Text>
          <View style={cardStyle}>
            {fileOffers.map((offer, index) => {
              const row = getDownloadRowDisplay(offer, downloadStates[getOfferKey(offer)])
              return (
                <LinkRow
                  key={getOfferKey(offer)}
                  file
                  bare
                  isFirst={index === 0}
                  label={offer.name}
                  size={offer.size}
                  description={row.isActive ? `${row.description} · ${row.percent}%` : undefined}
                  progressPercent={row.isActive || row.isCompleted ? row.percent : undefined}
                />
              )
            })}
          </View>
        </View>
      ) : null}

      {textOffers.length > 0 ? (
        <View style={styles.section}>
          <Text style={[styles.heading, { color: c.colorTextMuted }]}>
            {t('common:files.text')}
          </Text>
          <View style={cardStyle}>
            {textOffers.map((offer, index) => (
              <ReceivedTextRow
                key={getOfferKey(offer)}
                content={offer.content}
                isFirst={index === 0}
                copied={copiedId === offer.id}
                subtitleLabel={t('common:files.text')}
                copyLabel={t('common:actions.copyText')}
                copiedLabel={t('common:actions.copied')}
                showMoreLabel={t('common:actions.showMore')}
                showLessLabel={t('common:actions.showLess')}
                onCopy={() => copyText(offer.id, offer.content)}
                onOpenLink={(url) => void Linking.openURL(url)}
              />
            ))}
          </View>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 20
  },
  section: {
    gap: 8
  },
  heading: {
    fontSize: 13,
    fontWeight: '500'
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
