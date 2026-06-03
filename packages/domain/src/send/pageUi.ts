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
import type { TOptions } from 'i18next'

export function getSendPageCopy(
  step: SendStep,
  t: (key: string, options?: TOptions) => string
): SendPageCopy {
  switch (step) {
    case 'selecting':
      return {
        title: t('send.steps.selecting.title', { defaultValue: 'Send files' }),
        description: t('send.steps.selecting.description', {
          defaultValue:
            'Choose one or more files and generate a one-time code for a direct encrypted transfer.'
        })
      }
    case 'preparing':
      return {
        title: t('send.steps.preparing.title', { defaultValue: 'Preparing transfer' }),
        description: t('send.steps.preparing.description', {
          defaultValue: 'Preparing the selected files before the share code is revealed.'
        })
      }
    case 'waiting_for_receiver':
    case 'receiver_connected':
      return {
        title: t('send.steps.waiting_for_receiver.title', { defaultValue: 'Share the code' }),
        description: t('send.steps.waiting_for_receiver.description', {
          defaultValue: 'Send the code or QR to your recipient to start the transfer.'
        })
      }
    default: {
      const exhaustiveCheck: never = step
      return exhaustiveCheck
    }
  }
}

export function getSendShareStatus(step: SendStep): SendShareStatus | null {
  switch (step) {
    case 'selecting':
    case 'preparing':
      return null
    case 'waiting_for_receiver':
      return {
        label: 'Waiting for peer',
        tone: 'muted'
      }
    case 'receiver_connected':
      return {
        label: 'Peer connected',
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
