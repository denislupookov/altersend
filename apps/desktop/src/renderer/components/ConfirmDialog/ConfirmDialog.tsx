import { Button, Modal } from '@altersend/components'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message?: string
  confirmLabel: string
  cancelLabel: string
  destructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  destructive = false,
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  return (
    <Modal closeLabel={cancelLabel} open={open} title={title} size='sm' onClose={onCancel}>
      {message ? (
        <div className='px-4 pb-1'>
          <p className='m-0 text-[14px] leading-relaxed text-text-muted'>{message}</p>
        </div>
      ) : null}

      <div className='flex items-center justify-end gap-2 px-4 pb-4 pt-3'>
        <Button variant='secondary' size='sm' onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button variant={destructive ? 'danger' : 'primary'} size='sm' onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
