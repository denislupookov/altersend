import { StyleSheet } from 'react-native'
import { AlertDialog, Host, Text, TextButton } from '@expo/ui/jetpack-compose'
import { useTheme } from '@altersend/components'
import type { ConfirmDialogProps } from './ConfirmDialog.types'

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
  const { theme } = useTheme()
  const c = theme.colors

  if (!open) return null

  return (
    <Host style={styles.host} pointerEvents='box-none'>
      <AlertDialog
        onDismissRequest={onCancel}
        colors={{
          containerColor: c.colorBackgroundSubtle,
          titleContentColor: c.colorTextPrimary,
          textContentColor: c.colorTextMuted
        }}
      >
        <AlertDialog.Title>
          <Text color={c.colorTextPrimary}>{title}</Text>
        </AlertDialog.Title>
        {message ? (
          <AlertDialog.Text>
            <Text color={c.colorTextMuted}>{message}</Text>
          </AlertDialog.Text>
        ) : null}
        <AlertDialog.DismissButton>
          <TextButton onClick={onCancel} colors={{ contentColor: c.colorTextSecondary }}>
            <Text color={c.colorTextSecondary}>{cancelLabel}</Text>
          </TextButton>
        </AlertDialog.DismissButton>
        <AlertDialog.ConfirmButton>
          <TextButton
            onClick={onConfirm}
            colors={{ contentColor: destructive ? c.colorDanger : c.colorInfo }}
          >
            <Text color={destructive ? c.colorDanger : c.colorInfo}>{confirmLabel}</Text>
          </TextButton>
        </AlertDialog.ConfirmButton>
      </AlertDialog>
    </Host>
  )
}

const styles = StyleSheet.create({
  host: { width: 0, height: 0 }
})
