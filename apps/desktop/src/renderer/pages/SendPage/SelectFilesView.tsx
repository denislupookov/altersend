import { useState } from 'react'
import { DropZoneLink, ErrorBanner, FileDropZone, LinkRow } from '@altersend/components'
import { useTranslation } from '@altersend/locales'
import {
  addSelectedFiles,
  normalizeSelectedFiles,
  removeSelectedFile,
  useTransferStore,
  ENABLE_TEXT_SHARING
} from '@altersend/domain'
import { bridgeApi } from '../../api/bridgeApi'
import { Input, Button } from '@altersend/components'

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
  const [textInput, setTextInput] = useState('')

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

  const addTextItem = () => {
    const text = textInput.trim()
    if (!text) return
    const name = text.length > 20 ? text.substring(0, 20) + '...' : text
    addSelectedFiles([
      {
        name,
        path: `text-${Date.now()}`,
        kind: 'text',
        content: text,
        isTemporary: true,
        size: text.length
      }
    ])
    setTextInput('')
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
            <LinkRow
              key={file.path}
              file
              standalone
              compact
              label={file.name}
              onRemove={() => removeSelectedFile(file.path)}
              removeLabel={t('send:files.removeLabel', { name: file.name })}
              size={file.size}
            />
          ))}
        </div>
      ) : null}

      {ENABLE_TEXT_SHARING && (
        <div className='flex flex-row gap-2 mt-2 items-center'>
          <div className='flex-1'>
            <Input
              placeholder='Type a message or paste a link...'
              value={textInput}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTextInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && textInput.trim().length > 0) {
                  addTextItem()
                }
              }}
            />
          </div>
          <Button
            disabled={textInput.trim().length === 0}
            onClick={addTextItem}
            size='sm'
            variant='secondary'
          >
            Add
          </Button>
        </div>
      )}

      <ErrorBanner message={selectionError} />
    </div>
  )
}
