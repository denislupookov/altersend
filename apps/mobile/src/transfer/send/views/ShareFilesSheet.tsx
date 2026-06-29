import { ScrollView, StyleSheet } from 'react-native'
import { LinkRow } from '@altersend/components'
import { formatFileSize, type FileRow } from '@altersend/domain'
import { BottomSheet } from '@/src/components'

interface ShareFilesSheetProps {
  open: boolean
  files: FileRow[]
  totalSize: number
  onClose: () => void
}

export function ShareFilesSheet({ open, files, totalSize, onClose }: ShareFilesSheetProps) {
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={files.length === 1 ? '1 file' : `${files.length} files`}
      subtitle={formatFileSize(totalSize)}
      sheetStyle={styles.sheet}
    >
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {files.map((file, index) => (
          <LinkRow
            key={file.path}
            file
            bare
            label={file.name}
            size={file.size}
            isFirst={index === 0}
            isLast={index === files.length - 1}
          />
        ))}
      </ScrollView>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  sheet: { paddingBottom: 48, gap: 12 },
  list: { maxHeight: 420 },
  listContent: { paddingBottom: 4 }
})
