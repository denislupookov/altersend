import { useState } from 'react'
import { useNavigation } from 'expo-router'
import { usePreventRemove } from 'expo-router/react-navigation'
import { getLeaveSessionMessage, useTransferStore } from '@altersend/domain'
import { useTranslation } from '@altersend/locales'
import type { ConfirmDialogProps } from '@/src/components/ConfirmDialog'

const USER_BACK_ACTIONS = new Set(['GO_BACK', 'POP'])

export function useLeaveSessionConfirm(onLeave: () => void) {
  const { t } = useTranslation(['common'])
  const navigation = useNavigation()
  const role = useTransferStore((s) => s.role)
  const [message, setMessage] = useState('')
  const [open, setOpen] = useState(false)

  usePreventRemove(true, ({ data }) => {
    if (!USER_BACK_ACTIONS.has(data.action.type)) {
      navigation.dispatch(data.action)
      return
    }

    if (role === null) {
      onLeave()
      return
    }

    setMessage(getLeaveSessionMessage(t, role))
    setOpen(true)
  })

  const leaveDialog: ConfirmDialogProps = {
    open,
    title: t('common:actions.endSession'),
    message,
    confirmLabel: t('common:actions.continue'),
    cancelLabel: t('common:actions.cancel'),
    onConfirm: () => {
      setOpen(false)
      onLeave()
    },
    onCancel: () => setOpen(false)
  }

  return { leaveDialog }
}
