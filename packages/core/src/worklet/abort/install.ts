import { ManagedAbortController } from './managed-abort-controller'
import { ManagedAbortSignal } from './managed-abort-signal'

const globals = globalThis as unknown as { AbortController?: unknown; AbortSignal?: unknown }

if (typeof globals.AbortController === 'undefined') {
  globals.AbortController = ManagedAbortController
  globals.AbortSignal = ManagedAbortSignal
}

export {}
