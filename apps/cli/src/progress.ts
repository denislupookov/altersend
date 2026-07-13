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
  const safeCurrent = state.total > 0 ? Math.min(Math.max(state.current, 0), state.total) : 0
  const safePct = state.total > 0 ? Math.min(100, Math.max(0, Math.floor((safeCurrent / state.total) * 100))) : 0
  if (now - lastWrite < THROTTLE_MS && safePct === lastPct) return
  lastWrite = now
  lastPct = safePct
  if (state.total > 0 && state.current >= state.total) finalised = true
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
  const safeCurrent = total > 0 ? Math.min(Math.max(current, 0), total) : 0
  const safePct = total > 0 ? Math.min(100, Math.max(0, Math.floor((safeCurrent / total) * 100))) : 0
  const filled = Math.min(PROGRESS_CHARS, Math.max(0, Math.round((safePct / 100) * PROGRESS_CHARS)))
  const bar = '█'.repeat(filled) + '░'.repeat(PROGRESS_CHARS - filled)

  const maxWidth = process.stdout.columns || MIN_WIDTH

  const labelPart = `${label} "`
  const barPart = `[${bar}] `
  const pctPart = `${safePct}% (`
  const sizePart = `/${formatSize(total)})`

  const baseLen = labelPart.length + barPart.length + pctPart.length + sizePart.length
  const maxFileLen = Math.max(1, maxWidth - baseLen - 1)
  const truncatedFile = truncate(file, maxFileLen)

  const line = `${labelPart}${truncatedFile}" ${barPart}${pctPart}${formatSize(safeCurrent)}${sizePart}`
  return line.length > maxWidth ? line.slice(0, maxWidth) : line
}