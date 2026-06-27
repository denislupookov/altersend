import { StyleSheet } from 'react-native'
import { BottomSheet } from '@/src/components'
import { QRSection } from './QRSection'

interface ShareQrSheetProps {
  open: boolean
  topic: string
  onClose: () => void
}

export function ShareQrSheet({ open, topic, onClose }: ShareQrSheetProps) {
  return (
    <BottomSheet open={open} onClose={onClose} title='Scan to connect' sheetStyle={styles.sheet}>
      <QRSection topic={topic} showWaitingState={false} />
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  sheet: { paddingBottom: 48, gap: 12 }
})
