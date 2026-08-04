let active = false

export function setBackgroundTransferActive(value: boolean): void {
  active = value
}

export function isBackgroundTransferActive(): boolean {
  return active
}
