import { LinkRow, useTheme } from '@altersend/components'
import { FileIcon, FolderIcon } from '@altersend/components/icons'
import { Modal } from '../Modal'

interface AddFilesModalProps {
  open: boolean
  onClose: () => void
  onSelect: (mode: Exclude<PickMode, 'combined'>) => void
}

export function AddFilesModal({ open, onClose, onSelect }: AddFilesModalProps) {
  const { theme } = useTheme()
  const c = theme.colors

  return (
    <Modal open={open} title='What do you want to add?' width={460} onClose={onClose}>
      <div className='flex flex-col gap-2 px-4 pb-4'>
        <LinkRow
          standalone
          icon={<FileIcon size={20} color={c.colorTextSecondary} />}
          iconBackground={c.colorSurfacePrimary}
          label='Files'
          subtitle='Pick one or more files'
          trailing={null}
          onPress={() => onSelect('files')}
        />
        <LinkRow
          standalone
          icon={<FolderIcon size={20} color={c.colorTextSecondary} />}
          iconBackground={c.colorSurfacePrimary}
          label='Folder'
          subtitle='Send an entire folder'
          trailing={null}
          onPress={() => onSelect('folders')}
        />
      </div>
    </Modal>
  )
}
