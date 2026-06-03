export type SendStep = 'selecting' | 'preparing' | 'waiting_for_receiver' | 'receiver_connected'

export type SendDraftPhase = 'empty' | 'selected' | 'preparing' | 'ready'

export interface SendPageCopy {
  title: string
  description: string
}

export interface SendShareStatus {
  label: string
  tone: 'muted' | 'success'
}
import type { TFunction } from 'i18next'

export function getSendPageCopy(step: SendStep, t: TFunction<'send'>): SendPageCopy {
  switch (step) {
    case 'selecting':
      return {
        title: t('steps.selecting.title'),
        description: t('steps.selecting.description')
      }
    case 'preparing':
      return {
        title: t('steps.preparing.title'),
        description: t('steps.preparing.description')
      }
    case 'waiting_for_receiver':
    case 'receiver_connected':
      return {
        title: t('steps.waiting_for_receiver.title'),
        description: t('steps.waiting_for_receiver.description')
      }
    default: {
      const exhaustiveCheck: never = step
      return exhaustiveCheck
    }
  }
}

export function getSendShareStatus(step: SendStep, t: TFunction<'send'>): SendShareStatus | null {
  switch (step) {
    case 'selecting':
    case 'preparing':
      return null
    case 'waiting_for_receiver':
      return {
        label: t('status.waiting_for_peer'),
        tone: 'muted'
      }
    case 'receiver_connected':
      return {
        label: t('status.peer_connected'),
        tone: 'success'
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
