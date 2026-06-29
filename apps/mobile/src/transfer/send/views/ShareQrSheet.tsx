import { StyleSheet } from 'react-native'
import { useTranslation } from '@altersend/locales'
import { BottomSheet } from '@/src/components'
import { QRSection } from './QRSection'

interface ShareQrSheetProps {
  open: boolean
  topic: string
  onClose: () => void
}

export function ShareQrSheet({ open, topic, onClose }: ShareQrSheetProps) {
  const { t } = useTranslation(['send'])
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={t('send:connection.scanToConnect')}
      sheetStyle={styles.sheet}
    >
      <QRSection topic={topic} showWaitingState={false} />
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  sheet: { paddingBottom: 48, gap: 12 }
})
