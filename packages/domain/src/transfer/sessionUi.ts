import type { Translate } from '../i18n'
import type { TransferRole } from './types'

export function getLeaveSessionMessage(t: Translate, role: TransferRole | null): string {
  return role === 'sender'
    ? t('common:confirm.leaveShareSession')
    : t('common:confirm.leaveReceiveSession')
}
