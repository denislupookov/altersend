export interface SelectOption {
  value: string
  label: string
  fontFamily?: string
}

interface ChooseSelectOptionOptions {
  option: SelectOption
  currentValue: string
  close: () => void
  onChange: (value: string) => void
}

export type SelectKeyboardAction =
  | { action: 'none'; preventDefault?: false }
  | { action: 'open'; highlightedIndex: number; preventDefault: true }
  | { action: 'close'; preventDefault: true }
  | { action: 'close'; preventDefault?: false }
  | { action: 'choose'; highlightedIndex: number; preventDefault: true }
  | { action: 'highlight'; highlightedIndex: number; preventDefault: true }

interface SelectKeyboardStateInput {
  key: string
  open: boolean
  selectedIndex: number
  highlightedIndex: number
  optionCount: number
}

function clampIndex(index: number, optionCount: number): number {
  return Math.max(0, Math.min(optionCount - 1, index))
}

export function getInitialHighlightedIndex(selectedIndex: number, optionCount: number): number {
  return optionCount > 0 ? clampIndex(selectedIndex >= 0 ? selectedIndex : 0, optionCount) : 0
}

export function chooseSelectOption({
  option,
  currentValue,
  close,
  onChange
}: ChooseSelectOptionOptions): void {
  close()
  if (option.value !== currentValue) onChange(option.value)
}

export function getNextSelectKeyboardState({
  key,
  open,
  selectedIndex,
  highlightedIndex,
  optionCount
}: SelectKeyboardStateInput): SelectKeyboardAction {
  if (optionCount === 0) return { action: 'none' }

  const initialIndex = getInitialHighlightedIndex(selectedIndex, optionCount)

  switch (key) {
    case 'ArrowDown':
      return open
        ? {
            action: 'highlight',
            highlightedIndex: clampIndex(highlightedIndex + 1, optionCount),
            preventDefault: true
          }
        : { action: 'open', highlightedIndex: initialIndex, preventDefault: true }
    case 'ArrowUp':
      return open
        ? {
            action: 'highlight',
            highlightedIndex: clampIndex(highlightedIndex - 1, optionCount),
            preventDefault: true
          }
        : { action: 'open', highlightedIndex: initialIndex, preventDefault: true }
    case 'Home':
      return { action: 'open', highlightedIndex: 0, preventDefault: true }
    case 'End':
      return { action: 'open', highlightedIndex: optionCount - 1, preventDefault: true }
    case 'Enter':
    case ' ':
      return open
        ? { action: 'choose', highlightedIndex, preventDefault: true }
        : { action: 'open', highlightedIndex: initialIndex, preventDefault: true }
    case 'Escape':
      return open ? { action: 'close', preventDefault: true } : { action: 'none' }
    case 'Tab':
      return { action: 'close' }
    default:
      return { action: 'none' }
  }
}
