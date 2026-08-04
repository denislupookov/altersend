const WINDOW_MS = 6000
const MIN_SPAN_MS = 750
const MAX_ETA_SECONDS = 24 * 60 * 60

export interface RateSample {
  bytes: number
  at: number
}

export interface TransferRate {
  bytesPerSecond?: number
  etaSeconds?: number
}

export interface TransferProgress {
  bytesTransferred: number
  totalBytes: number
}

export function toProgressPercent(bytesTransferred: number, totalBytes: number): number {
  if (totalBytes <= 0) return 0
  return Math.max(0, Math.min(100, Math.round((bytesTransferred / totalBytes) * 100)))
}

export function pushRateSample(samples: RateSample[], bytes: number, at: number): RateSample[] {
  const last = samples[samples.length - 1]
  if (last && bytes < last.bytes) return [{ bytes, at }]
  if (last && at <= last.at) return samples

  const next = [...samples, { bytes, at }]
  const recent = next.filter((sample) => sample.at >= at - WINDOW_MS)
  return recent.length >= 2 ? recent : next.slice(-2)
}

export function getBytesPerSecond(samples: RateSample[]): number | undefined {
  const first = samples[0]
  const last = samples[samples.length - 1]
  if (!first || !last) return undefined

  const spanMs = last.at - first.at
  if (spanMs < MIN_SPAN_MS) return undefined

  const delta = last.bytes - first.bytes
  return delta <= 0 ? 0 : (delta * 1000) / spanMs
}

export function getEtaSeconds(
  bytesPerSecond: number | undefined,
  bytesRemaining: number
): number | undefined {
  if (!bytesPerSecond || bytesPerSecond <= 0 || bytesRemaining <= 0) return undefined
  const seconds = bytesRemaining / bytesPerSecond
  return seconds > MAX_ETA_SECONDS ? undefined : seconds
}

export function sumTransferRates(
  rates: Array<TransferRate | undefined>,
  bytesRemaining: number
): TransferRate {
  let bytesPerSecond: number | undefined

  for (const rate of rates) {
    if (rate?.bytesPerSecond === undefined) continue
    bytesPerSecond = (bytesPerSecond ?? 0) + rate.bytesPerSecond
  }

  return { bytesPerSecond, etaSeconds: getEtaSeconds(bytesPerSecond, bytesRemaining) }
}

export function getTransferRate(samples: RateSample[], progress: TransferProgress): TransferRate {
  const bytesPerSecond = getBytesPerSecond(samples)
  return {
    bytesPerSecond,
    etaSeconds: getEtaSeconds(bytesPerSecond, progress.totalBytes - progress.bytesTransferred)
  }
}
