import { useState } from 'react'
import { View, StyleSheet, ActionSheetIOS, Alert, Platform } from 'react-native'
import * as DocumentPicker from 'expo-document-picker'
import * as ImagePicker from 'expo-image-picker'
import {
  addSelectedFiles,
  removeSelectedFile,
  useTransferStore,
  type SelectedFile
} from '@altersend/domain'
import { DropZoneLink, ErrorBanner, FileDropZone, SendFileListRow } from '@altersend/components'
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
  const selectedFiles = useTransferStore((s) => s.selectedFiles)
  const [selectionError, setSelectionError] = useState<string | null>(null)

  const hasSelectedFiles = selectedFiles.length > 0

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

  return (
    <View style={styles.container}>
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

      {hasSelectedFiles && (
        <View style={styles.fileList}>
          {selectedFiles.map((file) => (
            <SendFileListRow
              key={file.path}
              name={file.name}
              onRemove={() => removeSelectedFile(file.path)}
              removeLabel={t('send:files.removeLabel', { name: file.name })}
              size={file.size}
            />
          ))}
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
  }
})
