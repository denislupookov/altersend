export interface ProgressState {
  file: string
  current: number
  total: number
}

const PROGRESS_CHARS = 20
const THROTTLE_MS = 100
const MIN_WIDTH = 60

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
  process.stdout.write('\r' + formatLine(state, label))
}

export function clearProgress(): void {
  lastWrite = 0
  lastPct = -1
  finalised = false
  process.stdout.write('\r' + ' '.repeat(process.stdout.columns || 80) + '\r')
}

function truncate(str: string, maxLen: number): string {
  return str.length <= maxLen ? str : str.slice(0, maxLen - 1) + '…'
}

function formatSize(bytes: number): string {
  return bytes < 1024
    ? `${bytes} B`
    : bytes < 1024 * 1024
      ? `${(bytes / 1024).toFixed(1)} KB`
      : `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function formatLine(state: ProgressState | null, label: string): string {
  if (!state) return ''
  const { file, current, total } = state
  const pct = total > 0 ? Math.round((current / total) * 100) : 0
  const filled = Math.round((pct / 100) * PROGRESS_CHARS)
  const bar = '█'.repeat(filled) + '░'.repeat(PROGRESS_CHARS - filled)

  const maxWidth = process.stdout.columns || MIN_WIDTH

  const labelPart = `${label} "`
  const barPart = `[${bar}] `
  const pctPart = `${pct}% (`
  const sizePart = `/${formatSize(total)})`

  const baseLen = labelPart.length + barPart.length + pctPart.length + sizePart.length
  const maxFileLen = Math.max(1, maxWidth - baseLen - 1)
  const truncatedFile = truncate(file, maxFileLen)

  const line = `${labelPart}${truncatedFile}" ${barPart}${pctPart}${formatSize(current)}${sizePart}`
  return line.length > maxWidth ? line.slice(0, maxWidth) : line
}