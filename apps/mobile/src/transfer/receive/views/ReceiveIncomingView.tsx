import { View, StyleSheet, Linking } from 'react-native'
import * as Clipboard from 'expo-clipboard'
import { LinkRow, Button, useTheme } from '@altersend/components'
import { CheckIcon, CopyIcon, MessageSquareIcon } from '@altersend/components/icons'
import {
  getDownloadRowDisplay,
  getOfferKey,
  linkifyText,
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
            {textOffers.map((offer, index) => {
              const copied = copiedId === offer.id
              return (
                <LinkRow
                  key={getOfferKey(offer)}
                  bare
                  isFirst={index === 0}
                  icon={<MessageSquareIcon size={18} color={c.colorInfo} />}
                  iconBackground={c.colorInfoSubtle}
                  label={offer.content}
                  labelNode={
                    <Text style={[styles.textBody, { color: c.colorTextPrimary }]}>
                      {linkifyText(offer.content).map((seg, i) =>
                        seg.url ? (
                          <Text
                            key={i}
                            style={[styles.link, { color: c.colorInfo }]}
                            onPress={() => void Linking.openURL(seg.url as string)}
                          >
                            {seg.text}
                          </Text>
                        ) : (
                          seg.text
                        )
                      )}
                    </Text>
                  }
                  subtitle={t('common:files.text')}
                  subtitleTone='faint'
                  trailing={
                    <Button
                      size='sm'
                      variant={copied ? 'success' : 'ghost'}
                      iconOnly
                      aria-label={
                        copied ? t('common:actions.copied') : t('common:actions.copyText')
                      }
                      icon={
                        copied ? (
                          <CheckIcon size={16} color={c.colorSuccess} />
                        ) : (
                          <CopyIcon size={16} color={c.colorTextSecondary} />
                        )
                      }
                      onClick={() => copyText(offer.id, offer.content)}
                    />
                  }
                />
              )
            })}
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
  textBody: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500'
  },
  link: {
    textDecorationLine: 'underline'
  },
  waitingText: {
    fontSize: 13
  }
})
