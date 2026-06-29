let pending = false

export function markPairPromptPending(): void {
  pending = true
}

export function consumePairPromptPending(): boolean {
  const value = pending
  pending = false
  return value
}
