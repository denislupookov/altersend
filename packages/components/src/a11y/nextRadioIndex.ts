const OFFSETS: Record<string, number> = {
  ArrowRight: 1,
  ArrowDown: 1,
  ArrowLeft: -1,
  ArrowUp: -1
}

export function nextRadioIndex(key: string, current: number, count: number): number | null {
  if (count === 0) return null
  if (key === 'Home') return 0
  if (key === 'End') return count - 1

  const offset = OFFSETS[key]
  if (offset === undefined) return null

  return (current + offset + count) % count
}

export function isRadioActivationKey(key: string): boolean {
  return key === ' ' || key === 'Enter'
}
