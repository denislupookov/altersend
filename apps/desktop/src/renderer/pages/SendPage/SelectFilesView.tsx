import { useState } from 'react'
import { DropZoneLink, ErrorBanner, FileDropZone, LinkRow, useTheme } from '@altersend/components'
import { FolderIcon } from '@altersend/components/icons'
import { useTranslation } from '@altersend/locales'
import {
  addSelectedFiles,
  type BrowserFileLike,
  formatFileSize,
  groupSelectedFiles,
  normalizeSelectedFiles,
  removeSelectedFile,
  useTransferStore,
  ENABLE_TEXT_SHARING
} from '@altersend/domain'
import { bridgeApi } from '../../api/bridgeApi'
import { Input, Button } from '@altersend/components'

function readAllEntries(reader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> {
  return new Promise((resolve, reject) => {
    const all: FileSystemEntry[] = []
    const readBatch = () =>
      reader.readEntries((batch) => {
        if (batch.length === 0) resolve(all)
        else {
          all.push(...batch)
          readBatch()
        }
      }, reject)
    readBatch()
  })
}

function entryToFile(entry: FileSystemFileEntry): Promise<File> {
  return new Promise((resolve, reject) => entry.file(resolve, reject))
}

async function collectDroppedEntries(
  entry: FileSystemEntry,
  getPathForFile: (file: File) => string,
  out: BrowserFileLike[]
): Promise<void> {
  if (entry.isFile) {
    const file = await entryToFile(entry as FileSystemFileEntry)
    const path = getPathForFile(file)
    if (path) {
      out.push({
        name: file.name,
        path,
        size: file.size,
        relativePath: entry.fullPath.replace(/^\/+/, '')
      })
    }
  } else if (entry.isDirectory) {
    const entries = await readAllEntries((entry as FileSystemDirectoryEntry).createReader())
    for (const child of entries) await collectDroppedEntries(child, getPathForFile, out)
  }
}

export function SelectFilesView() {
  const { t } = useTranslation(['send', 'common'])
  const { theme } = useTheme()
  const c = theme.colors
  const selectedFiles = useTransferStore((s) => s.selectedFiles)
  const [isDropZoneDragging, setIsDropZoneDragging] = useState(false)
  const [selectionError, setSelectionError] = useState<string | null>(null)
  const [textInput, setTextInput] = useState('')

  const hasSelectedFiles = selectedFiles.length > 0

  const browseDescription = (() => {
    const raw = t('send:dropzone.browseDescription')
    const m = raw.match(/^([\s\S]*)<link>([\s\S]*)<\/link>([\s\S]*)$/)
    if (!m) return raw
    return (
      <>
        {m[1]}
        <DropZoneLink>{m[2]}</DropZoneLink>
        {m[3]}
      </>
    )
  })()

  const fileSubtitle = (name: string, size?: number): string => {
    const dot = name.lastIndexOf('.')
    const ext = dot > 0 ? name.slice(dot + 1) : ''
    const sizeStr = typeof size === 'number' ? formatFileSize(size) : ''
    const type = ext && ext.length <= 5 ? ext.toUpperCase() : ''
    return [type, sizeStr].filter(Boolean).join(' · ')
  }

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
    const entries = items
      .map((item) => (item.kind === 'file' ? item.webkitGetAsEntry() : null))
      .filter((entry): entry is FileSystemEntry => entry !== null)
    const fallbackFiles = entries.length === 0 ? Array.from(event.dataTransfer.files ?? []) : []

    void ingestDrop(entries, fallbackFiles)
  }

  const ingestDrop = async (entries: FileSystemEntry[], fallbackFiles: File[]) => {
    const dropped: Array<File | BrowserFileLike> = [...fallbackFiles]
    for (const entry of entries) {
      await collectDroppedEntries(entry, bridgeApi.getPathForFile, dropped)
    }

    setSelectionError(null)

    const normalizedFiles = normalizeSelectedFiles(dropped, bridgeApi.getPathForFile)
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
    <div className='flex h-full min-h-0 flex-col gap-[34px]'>
      <div className={hasSelectedFiles ? 'shrink-0' : ''}>
        <FileDropZone
          description={browseDescription}
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
          title={t('send:actions.dragAndDrop')}
        />
      </div>

      {hasSelectedFiles ? (
        <div className='min-h-0 flex-1 overflow-y-auto'>
          <div className='flex flex-col gap-2'>
            {groupSelectedFiles(selectedFiles).map((row) =>
              row.kind === 'file' ? (
                <LinkRow
                  key={row.file.path}
                  file
                  standalone
                  compact
                  label={row.file.name}
                  subtitle={fileSubtitle(row.file.name, row.file.size)}
                  subtitleTone='faint'
                  onRemove={() => removeSelectedFile(row.file.path)}
                  removeLabel={t('send:files.removeLabel', { name: row.file.name })}
                />
              ) : (
                <LinkRow
                  key={`folder:${row.name}`}
                  icon={<FolderIcon size={17} color={c.colorTextMuted} />}
                  iconBackground={c.colorSurfacePrimary}
                  standalone
                  compact
                  label={row.name}
                  subtitle={t('common:files.count', { count: row.files.length })}
                  subtitleTone='faint'
                  onRemove={() => row.files.forEach((file) => removeSelectedFile(file.path))}
                  removeLabel={t('send:files.removeLabel', { name: row.name })}
                />
              )
            )}
          </div>
        </div>
      ) : null}

      {ENABLE_TEXT_SHARING && (
        <div className='flex shrink-0 flex-row gap-2 mt-2 items-center'>
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
