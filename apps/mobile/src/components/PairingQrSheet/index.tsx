import { Share, StyleSheet, View } from 'react-native'
import * as Clipboard from 'expo-clipboard'
import QRCode from 'react-native-qrcode-svg'
import { Button, Input, Spinner, useTheme, withAlpha } from '@altersend/components'
import { CopyIcon } from '@altersend/components/icons'
import { buildPairUrl } from '@altersend/domain'
import { useTranslation } from '@altersend/locales'
import { BottomSheet } from '../BottomSheet'
import { useToast } from '../Toast'
import { Text } from '../ThemedText'

interface PairingQrSheetProps {
  open: boolean
  topic: string
  isWaiting?: boolean
  onBack: () => void
  onClose: () => void
}

export function PairingQrSheet({
  open,
  topic,
  isWaiting = false,
  onBack,
  onClose
}: PairingQrSheetProps) {
  const { t } = useTranslation(['settings', 'send'])
  const { theme } = useTheme()
  const c = theme.colors
  const toast = useToast()
  const pairUrl = topic ? buildPairUrl(topic) : ''
  const copyAndShare = async () => {
    if (!topic) return
    await Clipboard.setStringAsync(topic)
    toast.show({ title: t('send:connection.copiedToast') })
    await Share.share({ message: topic })
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      onBack={onBack}
      title={t('settings:pairing.showQrCode')}
    >
      <View style={styles.qrPanel}>
        {pairUrl ? (
          <QRCode
            value={pairUrl}
            size={220}
            backgroundColor='transparent'
            color={c.colorTextPrimary}
          />
        ) : (
          <Text style={[styles.generatingText, { color: c.colorTextMuted }]}>
            {t('settings:pairing.generating')}
          </Text>
        )}

        {isWaiting && (
          <View
            style={[
              styles.waitingOverlay,
              {
                backgroundColor: withAlpha(c.colorBackground, 0.92),
                borderColor: c.colorBorderPrimary
              }
            ]}
          >
            <Spinner size={28} color={c.colorInfo} />
            <Text style={[styles.waitingText, { color: c.colorTextPrimary }]}>
              {t('settings:pairing.pairingDevice')}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.linkBlock}>
        <Text style={[styles.linkLabel, { color: c.colorTextMuted }]}>
          {t('settings:pairing.orShareCode')}
        </Text>
        <Input
          key={topic}
          aria-label={t('settings:pairing.codeLabel')}
          readOnly
          value={topic}
          trailing={
            <Button
              variant='ghost'
              size='sm'
              iconOnly
              aria-label={t('settings:pairing.copyShareLabel')}
              disabled={!topic}
              onClick={() => {
                copyAndShare().catch(() => {})
              }}
              icon={<CopyIcon size={16} />}
            />
          }
        />
      </View>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  qrPanel: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },
  generatingText: { fontSize: 14 },
  waitingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth
  },
  waitingText: { fontSize: 15, fontWeight: '600' },
  linkBlock: { gap: 10, paddingHorizontal: 20 },
  linkLabel: { fontSize: 14, fontWeight: '500' }
})
