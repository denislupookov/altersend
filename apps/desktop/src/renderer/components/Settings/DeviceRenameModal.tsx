import { Button, Input, Modal } from '@altersend/components'
import { useDeviceRenameForm } from '@altersend/domain'
import { useTranslation } from '@altersend/locales'

interface DeviceRenameModalProps {
  open: boolean
  initialName: string
  onClose: () => void
  onRename: (name: string) => Promise<boolean>
}

export function DeviceRenameModal({
  open,
  initialName,
  onClose,
  onRename
}: DeviceRenameModalProps) {
  const { t } = useTranslation(['settings', 'common'])
  const { value, setValue, canSave, isSaving, maxLength, save } = useDeviceRenameForm({
    open,
    initialName,
    onRename,
    onClose
  })

  return (
    <Modal
      closeLabel={t('common:actions.close')}
      open={open}
      title={t('settings:pairing.renameDevice')}
      size='lg'
      onClose={onClose}
    >
      <div className='px-4 pb-2'>
        <Input
          aria-label={t('settings:pairing.nameLabel')}
          placeholder={t('settings:pairing.namePlaceholder')}
          value={value}
          disabled={isSaving}
          maxLength={maxLength}
          onChange={(e: { target: { value: string } }) => setValue(e.target.value)}
          onKeyDown={(e: { key: string }) => {
            if (e.key === 'Enter') save()
          }}
        />
      </div>

      <div className='flex items-center justify-end gap-2 px-4 pb-4 pt-3'>
        <Button variant='secondary' size='sm' onClick={onClose}>
          {t('common:actions.cancel')}
        </Button>
        <Button variant='primary' size='sm' disabled={!canSave} loading={isSaving} onClick={save}>
          {t('common:actions.save')}
        </Button>
      </div>
    </Modal>
  )
}
