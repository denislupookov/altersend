export type SendStep = 'selecting' | 'preparing' | 'waiting_for_receiver' | 'receiver_connected'

export type SendDraftPhase = 'empty' | 'selected' | 'preparing' | 'ready'

type Translate = (key: string, options?: Record<string, unknown>) => string

export interface SendPageCopy {
  title: string
  description: string
}

export function getSendPageCopy(t: Translate, step: SendStep): SendPageCopy {
  switch (step) {
    case 'selecting':
      return {
        title: t('send:page.selecting.title'),
        description: t('send:page.selecting.description')
      }
    case 'preparing':
      return {
        title: t('send:page.preparing.title'),
        description: t('send:page.preparing.description')
      }
    case 'waiting_for_receiver':
      return {
        title: t('send:page.waitingForReceiver.title'),
        description: t('send:page.waitingForReceiver.description')
      }
    case 'receiver_connected':
      return {
        title: t('send:page.receiverConnected.title'),
        description: t('send:page.receiverConnected.description')
      }
    default: {
      const exhaustiveCheck: never = step
      return exhaustiveCheck
    }
  }
}

export function isShareStep(step: SendStep): boolean {
  switch (step) {
    case 'selecting':
    case 'preparing':
      return false
    case 'waiting_for_receiver':
    case 'receiver_connected':
      return true
    default: {
      const exhaustiveCheck: never = step
      return exhaustiveCheck
    }
  }
}

export function getSendStep({
  draftPhase,
  isPeerConnected
}: {
  draftPhase: SendDraftPhase
  isPeerConnected: boolean
}): SendStep {
  if (draftPhase === 'empty' || draftPhase === 'selected') return 'selecting'
  if (draftPhase === 'preparing') return 'preparing'
  if (!isPeerConnected) return 'waiting_for_receiver'
  return 'receiver_connected'
}
