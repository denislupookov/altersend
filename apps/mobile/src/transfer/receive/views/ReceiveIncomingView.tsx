import { Linking, View, StyleSheet } from 'react-native'
import * as Clipboard from 'expo-clipboard'
import { DownloadRow, ReceivedTextRow, RowGroup, rowKey, useTheme } from '@altersend/components'
import {
  formatTransferRate,
  getDownloadRowLabels,
  getOfferKey,
  useCopiedFlag,
  useReceiveActions,
  useReceiveDownloads
} from '@altersend/domain'
import { useTranslation } from '@altersend/locales'
import { lightTap } from '@/src/haptics'
import { openCompletedFile } from '../utils/openCompletedFile'
import { Text } from '@/src/components/ThemedText'

function withTap<Args extends unknown[]>(action: (...args: Args) => void) {
  return (...args: Args) => {
    lightTap()
    action(...args)
  }
}

interface ReceiveIncomingViewProps {
  pendingLabel?: string
  hideFilesTitle?: boolean
}

export function ReceiveIncomingView({ pendingLabel, hideFilesTitle }: ReceiveIncomingViewProps) {
  const { t } = useTranslation(['receive', 'common', 'errors'])
  const { theme } = useTheme()
  const c = theme.colors
  const { copiedId, flashCopied } = useCopiedFlag()
  const downloads = useReceiveDownloads()
  const actions = useReceiveActions(downloads)

  const copyText = (id: string, content: string) => {
    void Clipboard.setStringAsync(content)
    flashCopied(id)
    lightTap()
  }

  if (!downloads.hasFiles && downloads.textOffers.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={[styles.waitingText, { color: c.colorTextMuted }]}>
          {t('receive:status.waitingForFiles')}
        </Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {downloads.hasFiles ? (
        <RowGroup title={hideFilesTitle ? undefined : t('common:files.files')}>
          {downloads.rows.map((row, index) => (
            <DownloadRow
              key={rowKey(row)}
              row={row}
              states={downloads.states}
              rates={downloads.rates}
              rateLabelFor={(rate) => formatTransferRate(rate, t)}
              labelsFor={(display) => getDownloadRowLabels(t, display, pendingLabel)}
              transferActive={downloads.isDownloading}
              inert={pendingLabel !== undefined}
              isFirst={index === 0}
              onResume={withTap(actions.resumeFile)}
              onPause={withTap(actions.pauseFile)}
              onOpen={(offer) => openCompletedFile(getOfferKey(offer))}
              onPauseFolder={withTap(actions.pauseFolder)}
              onResumeFolder={withTap(actions.resumeFolder)}
            />
          ))}
        </RowGroup>
      ) : null}

      {downloads.textOffers.length > 0 ? (
        <RowGroup title={t('common:files.text')}>
          {downloads.textOffers.map((offer, index) => (
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
        </RowGroup>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 20
  },
  waitingText: {
    fontSize: 13
  }
})
