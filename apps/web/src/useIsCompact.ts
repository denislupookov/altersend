import { useEffect, useState } from 'react'

const COMPACT_QUERY = '(max-width: 639px)'

export function useIsCompact(): boolean {
  const [compact, setCompact] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(COMPACT_QUERY).matches
  )

  useEffect(() => {
    const query = window.matchMedia(COMPACT_QUERY)
    const onChange = (event: MediaQueryListEvent) => setCompact(event.matches)
    setCompact(query.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  return compact
}
