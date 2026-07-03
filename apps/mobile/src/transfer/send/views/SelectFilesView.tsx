import { useState } from 'react'
import { View, StyleSheet, ActionSheetIOS, Alert, Platform } from 'react-native'
import { Text } from '@/src/components/ThemedText'
import * as DocumentPicker from 'expo-document-picker'
import * as ImagePicker from 'expo-image-picker'
import {
  addSelectedFiles,
  createTextSnippet,
  formatTextSnippetPreview,
  removeSelectedFile,
  useTransferStore,
  type SelectedFile,
  type SendComposeMode
} from '@altersend/domain'
import {
  DropZoneLink,
  ErrorBanner,
  FileDropZone,
  LinkRow,
  Tabs,
  TabsList,
  TabsTrigger,
  Textarea,
  Button,
  useTheme
} from '@altersend/components'
import { MessageSquareIcon } from '@altersend/components/icons'
import { useTranslation } from '@altersend/locales'

function uriToFilePath(uri: string): string {
  if (!uri.startsWith('file://')) return uri
  const stripped = uri.slice('file://'.length)
  try {
    return decodeURIComponent(stripped)
  } catch {
    return stripped
  }
}

export function SelectFilesView() {
  const { t } = useTranslation(['send', 'common'])
  const { theme } = useTheme()
  const c = theme.colors
  const selectedFiles = useTransferStore((s) => s.selectedFiles)
  const [selectionError, setSelectionError] = useState<string | null>(null)
  const [textInput, setTextInput] = useState('')
  const [mode, setMode] = useState<SendComposeMode>('files')

  const hasSelectedFiles = selectedFiles.length > 0
  const trimmedText = textInput.trim()
  const fileItems = selectedFiles.filter((file) => file.kind !== 'text')
  const textItems = selectedFiles.filter((file) => file.kind === 'text')

  const pickFromFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        multiple: true,
        type: '*/*',
        copyToCacheDirectory: true
      })

      if (result.canceled) return

      const normalizedFiles: SelectedFile[] = result.assets.map((asset) => ({
        name: asset.name,
        path: uriToFilePath(asset.uri),
        size: asset.size,
        isTemporary: true
      }))

      if (normalizedFiles.length > 0) {
        setSelectionError(null)
        addSelectedFiles(normalizedFiles)
      }
    } catch (error) {
      setSelectionError(t('send:errors.failedPickFiles'))
      console.error(error)
    }
  }

  const pickFromPhotos = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsMultipleSelection: true,
        quality: 1,
        exif: false
      })

      if (result.canceled) return

      const normalizedFiles: SelectedFile[] = result.assets.map((asset) => ({
        name: asset.fileName ?? asset.uri.split('/').pop() ?? 'photo',
        path: uriToFilePath(asset.uri),
        size: asset.fileSize,
        isTemporary: true
      }))

      if (normalizedFiles.length > 0) {
        setSelectionError(null)
        addSelectedFiles(normalizedFiles)
      }
    } catch (error) {
      setSelectionError(t('send:errors.failedPickPhotos'))
      console.error(error)
    }
  }

  const browse = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [t('common:actions.cancel'), t('common:files.photos'), t('common:files.files')],
          cancelButtonIndex: 0
        },
        (index) => {
          if (index === 1) void pickFromPhotos()
          else if (index === 2) void pickFromFiles()
        }
      )
      return
    }

    Alert.alert(t('send:actions.pickFilesTitle'), undefined, [
      { text: t('common:files.photos'), onPress: () => void pickFromPhotos() },
      { text: t('common:files.files'), onPress: () => void pickFromFiles() },
      { text: t('common:actions.cancel'), style: 'cancel' }
    ])
  }

  const addTextItem = () => {
    if (!trimmedText) return
    addSelectedFiles([createTextSnippet(textInput)])
    setTextInput('')
  }

  return (
    <View style={styles.container}>
      <Tabs stretch value={mode} onValueChange={(value) => setMode(value as SendComposeMode)}>
        <TabsList>
          <TabsTrigger value='files'>{t('common:files.files')}</TabsTrigger>
          <TabsTrigger value='text'>{t('common:files.text')}</TabsTrigger>
        </TabsList>
      </Tabs>

      {mode === 'text' ? (
        <Textarea
          placeholder={t('send:actions.typeSnippet')}
          height={hasSelectedFiles ? 141 : 198}
          value={textInput}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setTextInput(e.target.value)}
          footer={
            <>
              {trimmedText.length > 0 ? (
                <Text style={[styles.charCount, { color: c.colorTextFaint }]}>
                  {t('common:units.chars', { count: textInput.length })}
                </Text>
              ) : (
                <View />
              )}
              <Button
                disabled={trimmedText.length === 0}
                onClick={addTextItem}
                size='sm'
                variant='primary'
              >
                {t('common:actions.add')}
              </Button>
            </>
          }
        />
      ) : (
        <View style={styles.dropZoneContainer}>
          <FileDropZone
            description={
              hasSelectedFiles ? (
                <>
                  {t('send:dropzone.tapTo')}{' '}
                  <DropZoneLink>{t('send:dropzone.addMoreLink')}</DropZoneLink>
                </>
              ) : (
                <>
                  {t('send:dropzone.tapTo')}{' '}
                  <DropZoneLink>{t('send:dropzone.browseLink')}</DropZoneLink>
                </>
              )
            }
            hasFiles={hasSelectedFiles}
            onClick={() => void browse()}
            title={hasSelectedFiles ? t('send:actions.addMoreFiles') : t('send:actions.addFiles')}
          />
        </View>
      )}

      {fileItems.length > 0 && (
        <View style={styles.fileList}>
          <Text style={[styles.listHeading, { color: c.colorTextMuted }]}>
            {t('send:files.addedFiles')}
          </Text>
          {fileItems.map((file) => (
            <LinkRow
              key={file.path}
              file
              standalone
              label={file.name}
              onRemove={() => removeSelectedFile(file.path)}
              removeLabel={t('send:files.removeLabel', { name: file.name })}
              size={file.size}
            />
          ))}
        </View>
      )}

      {textItems.length > 0 && (
        <View style={styles.fileList}>
          <Text style={[styles.listHeading, { color: c.colorTextMuted }]}>
            {t('send:files.addedText')}
          </Text>
          {textItems.map((file) => {
            const preview = formatTextSnippetPreview(file.content ?? file.name)
            const chars = (file.content ?? '').length
            return (
              <LinkRow
                key={file.path}
                icon={<MessageSquareIcon size={17} color={c.colorInfo} />}
                iconBackground={c.colorInfoSubtle}
                standalone
                label={preview}
                subtitle={`${t('common:files.text')} · ${t('common:units.chars', { count: chars })}`}
                subtitleTone='faint'
                onRemove={() => removeSelectedFile(file.path)}
                removeLabel={t('send:files.removeLabel', { name: preview })}
              />
            )
          })}
        </View>
      )}

      <ErrorBanner message={selectionError} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 16
  },
  dropZoneContainer: {
    padding: 1
  },
  fileList: {
    gap: 8
  },
  listHeading: {
    fontSize: 13,
    fontWeight: '500'
  },
  charCount: {
    fontSize: 13
  }
})
