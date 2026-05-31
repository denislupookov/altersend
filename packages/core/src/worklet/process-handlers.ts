interface BareGlobal {
  on: (event: string, listener: (...args: unknown[]) => void) => unknown
}

function isBareGlobal(value: unknown): value is BareGlobal {
  return (
    typeof value === 'object' && value !== null && typeof Reflect.get(value, 'on') === 'function'
  )
}

function formatReason(reason: unknown): string {
  if (reason instanceof Error) {
    return `${reason.message}${reason.stack ? `\n${reason.stack}` : ''}`
  }
  return String(reason)
}

const bare = Reflect.get(globalThis, 'Bare')
if (isBareGlobal(bare)) {
  bare.on('unhandledRejection', (reason: unknown) => {
    console.error('Worklet unhandledRejection:', formatReason(reason))
  })
  bare.on('uncaughtException', (error: unknown) => {
    console.error('Worklet uncaughtException:', formatReason(error))
  })
}
