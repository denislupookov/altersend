export interface ProgressState {
  file: string
  current: number
  total: number
}

const PROGRESS_CHARS = 20
const THROTTLE_MS = 100

let lastWrite = 0
let lastPct = -1
let finalised = false

export function writeProgress(state: ProgressState, label: string): void {
  if (finalised) return
  const now = Date.now()
  const pct = state.total > 0 ? Math.round((state.current / state.total) * 100) : 0
  if (now - lastWrite < THROTTLE_MS && pct === lastPct) return
  lastWrite = now
  lastPct = pct
  if (pct === 100) finalised = true
  process.stdout.write(formatLine(state, label))
}

export function clearProgress(): void {
  lastWrite = 0
  lastPct = -1
  finalised = false
  process.stdout.write('\r' + ' '.repeat(process.stdout.columns || 80) + '\r')
}

export function formatLine(state: ProgressState | null, label: string): string {
  if (!state) return ''
  const { file, current, total } = state
  const pct = total > 0 ? Math.round((current / total) * 100) : 0
  const filled = Math.round((pct / 100) * PROGRESS_CHARS)
  const bar = '█'.repeat(filled) + '░'.repeat(PROGRESS_CHARS - filled)
  const size = total < 1024
    ? `${total} B`
    : total < 1024 * 1024
      ? `${(total / 1024).toFixed(1)} KB`
      : `${(total / (1024 * 1024)).toFixed(1)} MB`
  const transferred = current < 1024
    ? `${current} B`
    : current < 1024 * 1024
      ? `${(current / 1024).toFixed(1)} KB`
      : `${(current / (1024 * 1024)).toFixed(1)} MB`
  return `\r${label} "${file}" [${bar}] ${pct}% (${transferred}/${size})`
}