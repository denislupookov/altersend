import { useState } from 'react'
import { DropZoneLink, ErrorBanner, FileDropZone, SendFileListRow } from '@altersend/components'
import { useTranslation } from '@altersend/locales'
import {
  addSelectedFiles,
  normalizeSelectedFiles,
  removeSelectedFile,
  useTransferStore
} from '@altersend/domain'
import { bridgeApi } from '../../api/bridgeApi'

interface DataTransferEntryLike {
  isDirectory: boolean
}

function getEntry(item: DataTransferItem) {
  return (
    (
      item as DataTransferItem & {
        webkitGetAsEntry?: () => DataTransferEntryLike | null
      }
    ).webkitGetAsEntry?.() ?? null
  )
}

export function SelectFilesView() {
  const { t } = useTranslation(['send'])
  const selectedFiles = useTransferStore((s) => s.selectedFiles)
  const [isDropZoneDragging, setIsDropZoneDragging] = useState(false)
  const [selectionError, setSelectionError] = useState<string | null>(null)

  const hasSelectedFiles = selectedFiles.length > 0

  const browse = async () => {
    const selected = await bridgeApi.pickFiles()
    if (!selected) return

    const normalizedFiles = normalizeSelectedFiles(selected, bridgeApi.getPathForFile)
    if (normalizedFiles.length > 0) {
      setSelectionError(null)
      addSelectedFiles(normalizedFiles)
    }
  }

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault()
    setIsDropZoneDragging(false)

    const items = Array.from(event.dataTransfer.items ?? [])
    let hasFolderSelection = false
    const droppedFiles =
      items.length > 0
        ? items.flatMap((item) => {
            const entry = getEntry(item)
            if (entry?.isDirectory) {
              hasFolderSelection = true
              return []
            }

            const file = item.kind === 'file' ? item.getAsFile() : null
            return file ? [file] : []
          })
        : Array.from(event.dataTransfer.files ?? [])

    setSelectionError(hasFolderSelection ? t('send:errors.folderUnsupported') : null)

    const normalizedFiles = normalizeSelectedFiles(droppedFiles, bridgeApi.getPathForFile)
    if (normalizedFiles.length > 0) {
      addSelectedFiles(normalizedFiles)
    }
  }

  return (
    <div className='flex flex-col gap-4'>
      <div>
        <FileDropZone
          description={
            hasSelectedFiles ? (
              <>
                {t('send:dropzone.orClickTo')}{' '}
                <DropZoneLink>{t('send:dropzone.addMoreLink')}</DropZoneLink>
              </>
            ) : (
              <>
                {t('send:dropzone.orClickTo')}{' '}
                <DropZoneLink>{t('send:dropzone.browseLink')}</DropZoneLink>
              </>
            )
          }
          hasFiles={hasSelectedFiles}
          isDragging={isDropZoneDragging}
          onClick={() => void browse()}
          onDragLeave={(event) => {
            event.preventDefault()
            setIsDropZoneDragging(false)
          }}
          onDragOver={(event) => {
            event.preventDefault()
            setIsDropZoneDragging(true)
          }}
          onDrop={onDrop}
          title={hasSelectedFiles ? t('send:actions.addMoreFiles') : t('send:actions.dragAndDrop')}
        />
      </div>

      {hasSelectedFiles ? (
        <div className='flex flex-col gap-1.5'>
          {selectedFiles.map((file) => (
            <SendFileListRow
              key={file.path}
              compact
              name={file.name}
              onRemove={() => removeSelectedFile(file.path)}
              removeLabel={t('send:files.removeLabel', { name: file.name })}
              size={file.size}
            />
          ))}
        </div>
      ) : null}

      <ErrorBanner message={selectionError} />
    </div>
  )
}
