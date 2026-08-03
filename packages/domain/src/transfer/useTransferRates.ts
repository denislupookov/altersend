import { useEffect, useRef, useState } from 'react'
import {
  getTransferRate,
  pushRateSample,
  type RateSample,
  type TransferProgress,
  type TransferRate
} from './rate'

const TICK_MS = 1000

export function isSameRates(
  current: Record<string, TransferRate>,
  next: Record<string, TransferRate>
): boolean {
  const keys = Object.keys(next)
  if (keys.length !== Object.keys(current).length) return false

  return keys.every((key) => {
    const before = current[key]
    return (
      before !== undefined &&
      before.bytesPerSecond === next[key].bytesPerSecond &&
      before.etaSeconds === next[key].etaSeconds
    )
  })
}

export function useTransferRates(
  progress: Record<string, TransferProgress>,
  enabled: boolean
): Record<string, TransferRate> {
  const samplesRef = useRef<Record<string, RateSample[]>>({})
  const progressRef = useRef(progress)
  const [rates, setRates] = useState<Record<string, TransferRate>>({})
  progressRef.current = progress

  useEffect(() => {
    if (!enabled) {
      samplesRef.current = {}
      setRates((current) => (Object.keys(current).length === 0 ? current : {}))
      return
    }

    const tick = () => {
      const now = Date.now()
      const nextSamples: Record<string, RateSample[]> = {}
      const nextRates: Record<string, TransferRate> = {}

      for (const [key, item] of Object.entries(progressRef.current)) {
        const samples = pushRateSample(samplesRef.current[key] ?? [], item.bytesTransferred, now)
        nextSamples[key] = samples
        nextRates[key] = getTransferRate(samples, item)
      }

      samplesRef.current = nextSamples
      setRates((current) => (isSameRates(current, nextRates) ? current : nextRates))
    }

    tick()
    const timer = setInterval(tick, TICK_MS)
    return () => clearInterval(timer)
  }, [enabled])

  return rates
}
