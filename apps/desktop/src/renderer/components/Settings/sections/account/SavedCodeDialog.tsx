import { useTranslation } from '@altersend/locales'
import { ConfirmDialog } from '../../../ConfirmDialog'

interface SavedCodeDialogProps {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function SavedCodeDialog({ open, onConfirm, onCancel }: SavedCodeDialogProps) {
  const { t } = useTranslation(['settings', 'common'])

  return (
    <ConfirmDialog
      open={open}
      title={t('settings:account.savedCodeTitle')}
      message={t('settings:account.savedCodeBody')}
      confirmLabel={t('settings:account.savedCodeConfirm')}
      cancelLabel={t('common:actions.cancel')}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  )
}
