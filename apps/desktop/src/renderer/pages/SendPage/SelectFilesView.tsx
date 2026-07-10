import { useState } from 'react'
import {
  Button,
  DropZoneLink,
  ErrorBanner,
  FileDropZone,
  LinkRow,
  Textarea,
  useTheme
} from '@altersend/components'
import { FolderIcon, MessageSquareIcon } from '@altersend/components/icons'
import { useTranslation } from '@altersend/locales'
import {
  addSelectedFiles,
  type BrowserFileLike,
  createTextSnippet,
  formatFileSize,
  formatTextSnippetPreview,
  groupSelectedFiles,
  normalizeSelectedFiles,
  removeSelectedFile,
  useTransferStore,
  type SendComposeMode
} from '@altersend/domain'
import { AddFilesModal } from '../../components'
import { bridgeApi } from '../../api/bridgeApi'

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

export function SelectFilesView({ mode = 'files' }: { mode?: SendComposeMode }) {
  const { t } = useTranslation(['send', 'common'])
  const { theme } = useTheme()
  const c = theme.colors
  const selectedFiles = useTransferStore((s) => s.selectedFiles)
  const [isDropZoneDragging, setIsDropZoneDragging] = useState(false)
  const [selectionError, setSelectionError] = useState<string | null>(null)
  const [textInput, setTextInput] = useState('')
  const [pickerModalOpen, setPickerModalOpen] = useState(false)

  const splitPicker = bridgeApi.platform() !== 'darwin'

  const hasSelectedFiles = selectedFiles.length > 0
  const trimmedText = textInput.trim()
  const fileItems = selectedFiles.filter((file) => file.kind !== 'text')
  const textItems = selectedFiles.filter((file) => file.kind === 'text')
  const fileRows = groupSelectedFiles(fileItems)

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

  const runPicker = async (mode: PickMode) => {
    const selected = await bridgeApi.pickFiles(mode)
    if (!selected) return

    const normalizedFiles = normalizeSelectedFiles(selected, bridgeApi.getPathForFile)
    if (normalizedFiles.length > 0) {
      setSelectionError(null)
      addSelectedFiles(normalizedFiles)
    }
  }

  const pick = (mode: PickMode) =>
    runPicker(mode).catch((err) => console.error('pickFiles failed', err))

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
    if (!trimmedText) return
    addSelectedFiles([createTextSnippet(textInput)])
    setTextInput('')
  }

  return (
    <div className='flex h-full min-h-0 flex-col gap-[34px]'>
      <div className={hasSelectedFiles ? 'shrink-0' : ''}>
        {mode === 'text' ? (
          <Textarea
            placeholder={t('send:actions.typeSnippet')}
            height={hasSelectedFiles ? 141 : 198}
            value={textInput}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setTextInput(e.target.value)}
            onKeyDown={(event) => {
              const e = event as typeof event & {
                shiftKey?: boolean
                preventDefault?: () => void
              }
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault?.()
                addTextItem()
              }
            }}
            footer={
              <>
                {trimmedText.length > 0 ? (
                  <span className='text-[13px] text-text-faint'>
                    {t('common:units.chars', { count: textInput.length })}
                  </span>
                ) : (
                  <span />
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
          <>
            <FileDropZone
              description={browseDescription}
              hasFiles={hasSelectedFiles}
              isDragging={isDropZoneDragging}
              onClick={() => (splitPicker ? setPickerModalOpen(true) : pick('combined'))}
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
            <AddFilesModal
              open={pickerModalOpen}
              onClose={() => setPickerModalOpen(false)}
              onSelect={(pickMode) => {
                setPickerModalOpen(false)
                pick(pickMode)
              }}
            />
          </>
        )}
      </div>

      {hasSelectedFiles ? (
        <div className='flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto'>
          {fileRows.length > 0 ? (
            <div>
              <p className='m-0 mb-2 text-[13px] font-medium text-text-muted'>
                {t('send:files.addedFiles')}
              </p>
              <div className='flex flex-col gap-2'>
                {fileRows.map((row) =>
                  row.kind === 'folder' ? (
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
                  ) : (
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
                  )
                )}
              </div>
            </div>
          ) : null}

          {textItems.length > 0 ? (
            <div>
              <p className='m-0 mb-2 text-[13px] font-medium text-text-muted'>
                {t('send:files.addedText')}
              </p>
              <div className='flex flex-col gap-2'>
                {textItems.map((item) => {
                  const preview = formatTextSnippetPreview(item.content ?? item.name)
                  const chars = (item.content ?? '').length
                  return (
                    <LinkRow
                      key={item.path}
                      icon={<MessageSquareIcon size={17} color={c.colorInfo} />}
                      iconBackground={c.colorInfoSubtle}
                      standalone
                      compact
                      label={preview}
                      subtitle={`${t('common:files.text')} · ${t('common:units.chars', { count: chars })}`}
                      subtitleTone='faint'
                      onRemove={() => removeSelectedFile(item.path)}
                      removeLabel={t('send:files.removeLabel', { name: preview })}
                    />
                  )
                })}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <ErrorBanner message={selectionError} />
    </div>
  )
}
