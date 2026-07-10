import { LinkRow, useTheme } from '@altersend/components'
import { FileIcon, FolderIcon } from '@altersend/components/icons'
import { useTranslation } from '@altersend/locales'
import { Modal } from '../Modal'

interface AddFilesModalProps {
  open: boolean
  onClose: () => void
  onSelect: (mode: Exclude<PickMode, 'combined'>) => void
}

export function AddFilesModal({ open, onClose, onSelect }: AddFilesModalProps) {
  const { t } = useTranslation(['send', 'common'])
  const { theme } = useTheme()
  const c = theme.colors

  return (
    <Modal open={open} title={t('send:dropzone.addTitle')} width={460} onClose={onClose}>
      <div className='flex flex-col gap-2 px-4 pb-4'>
        <LinkRow
          standalone
          icon={<FileIcon size={20} color={c.colorTextSecondary} />}
          iconBackground={c.colorSurfacePrimary}
          label={t('common:files.files')}
          subtitle={t('send:dropzone.filesHint')}
          trailing={null}
          onPress={() => onSelect('files')}
        />
        <LinkRow
          standalone
          icon={<FolderIcon size={20} color={c.colorTextSecondary} />}
          iconBackground={c.colorSurfacePrimary}
          label={t('common:files.folder')}
          subtitle={t('send:dropzone.folderHint')}
          trailing={null}
          onPress={() => onSelect('folders')}
        />
      </div>
    </Modal>
  )
}
