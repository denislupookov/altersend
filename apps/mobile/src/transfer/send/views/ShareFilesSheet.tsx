import { ScrollView, StyleSheet } from 'react-native'
import { LinkRow, useTheme } from '@altersend/components'
import { MessageSquareIcon } from '@altersend/components/icons'
import {
  formatFileSize,
  formatItemsCount,
  formatTextSnippetPreview,
  type FileRow,
  type TextRow
} from '@altersend/domain'
import { useTranslation } from '@altersend/locales'
import { BottomSheet } from '@/src/components'

interface ShareFilesSheetProps {
  open: boolean
  files: FileRow[]
  texts: TextRow[]
  totalSize: number
  onClose: () => void
}

export function ShareFilesSheet({ open, files, texts, totalSize, onClose }: ShareFilesSheetProps) {
  const { t } = useTranslation(['common'])
  const { theme } = useTheme()
  const c = theme.colors

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={formatItemsCount(files.length, texts.length, t)}
      subtitle={totalSize > 0 ? formatFileSize(totalSize) : undefined}
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
            isLast={texts.length === 0 && index === files.length - 1}
          />
        ))}
        {texts.map((text, index) => (
          <LinkRow
            key={text.path}
            bare
            icon={<MessageSquareIcon size={18} color={c.colorInfo} />}
            iconBackground={c.colorInfoSubtle}
            label={formatTextSnippetPreview(text.content)}
            subtitle={t('common:files.text')}
            subtitleTone='faint'
            isFirst={files.length === 0 && index === 0}
            isLast={index === texts.length - 1}
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
