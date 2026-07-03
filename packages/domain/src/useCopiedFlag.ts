import { useCallback, useRef, useState } from 'react'

interface CopiedFlag {
  copiedId: string | null
  flashCopied: (id: string) => void
}

export function useCopiedFlag(resetMs = 1500): CopiedFlag {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const flashCopied = useCallback(
    (id: string) => {
      if (timer.current) clearTimeout(timer.current)
      setCopiedId(id)
      timer.current = setTimeout(() => setCopiedId((cur) => (cur === id ? null : cur)), resetMs)
    },
    [resetMs]
  )

  return { copiedId, flashCopied }
}
