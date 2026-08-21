import type { BillingPlan, PaymentProvider } from './billing'

export type AccountPhase = 'paywall' | 'entering' | 'waiting' | 'approval' | 'success' | 'active'

export type AccountError =
  | 'failed'
  | 'unknownCode'
  | 'offline'
  | 'server'
  | 'timedOut'
  | 'nothingToRestore'
  | 'restoreNotMoved'
  | 'expiredCode'

const ERROR_KEY: Record<AccountError, string> = {
  failed: 'settings:account.failed',
  unknownCode: 'settings:account.unknownCode',
  offline: 'settings:account.offline',
  server: 'settings:account.serverError',
  timedOut: 'settings:account.timedOut',
  nothingToRestore: 'settings:account.nothingToRestore',
  restoreNotMoved: 'settings:account.restoreNotMoved',
  expiredCode: 'settings:account.expiredCode'
}

export function accountErrorKey(error: AccountError | null): string | null {
  return error ? ERROR_KEY[error] : null
}

export interface AccountState {
  code: string
  validUntil: string | null
  provider?: PaymentProvider | null
}

export interface AccountSession {
  phase: AccountPhase
  account: AccountState | null
  busy: boolean
  error: AccountError | null
  entry: string
  plan: BillingPlan
  rotated: boolean
}

export type AccountAction =
  | { type: 'entryChanged'; entry: string }
  | { type: 'planChosen'; plan: BillingPlan }
  | { type: 'started' }
  | { type: 'settled' }
  | { type: 'failed'; error: AccountError }
  | { type: 'errorCleared' }
  | { type: 'showEntry' }
  | { type: 'showPaywall' }
  | { type: 'upgrading'; account: AccountState }
  | { type: 'awaitingApproval'; account: AccountState }
  | { type: 'purchased'; account: AccountState; rotated?: boolean }
  | { type: 'activated'; account: AccountState }
  | { type: 'acknowledged' }
  | { type: 'forgotten' }

export const initialAccountSession: AccountSession = {
  phase: 'paywall',
  account: null,
  busy: false,
  error: null,
  entry: '',
  plan: 'monthly',
  rotated: false
}

export function accountReducer(state: AccountSession, action: AccountAction): AccountSession {
  switch (action.type) {
    case 'entryChanged':
      return { ...state, entry: action.entry, error: null }
    case 'planChosen':
      return { ...state, plan: action.plan }
    case 'started':
      return { ...state, busy: true, error: null }
    case 'settled':
      return { ...state, busy: false }
    case 'failed':
      return { ...state, busy: false, error: action.error }
    case 'errorCleared':
      return { ...state, error: null }
    case 'showEntry':
      return { ...state, phase: 'entering', error: null, entry: '' }
    case 'showPaywall':
      return { ...state, phase: 'paywall', error: null }
    case 'upgrading':
      return { ...state, phase: 'waiting', account: action.account, error: null }
    case 'awaitingApproval':
      return { ...state, phase: 'approval', account: action.account, error: null }
    case 'purchased':
      return {
        ...state,
        phase: state.phase === 'active' ? 'active' : 'success',
        account: action.account,
        rotated: Boolean(action.rotated),
        error: null
      }
    case 'activated':
      return { ...state, phase: 'active', account: action.account, entry: '', error: null }
    case 'acknowledged':
      return { ...state, phase: 'active' }
    case 'forgotten':
      return { ...initialAccountSession, plan: state.plan }
  }
}
