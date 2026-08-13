import { useRef } from 'react'
import { isRadioActivationKey, nextRadioIndex } from './nextRadioIndex'

interface FocusableElement {
  focus(): void
}

interface RovingKeyEvent {
  key: string
  preventDefault?: () => void
}

export function useRovingRadio<T>(options: readonly T[], onSelect: (option: T) => void) {
  const optionRefs = useRef<(FocusableElement | null)[]>([])

  const setRef = (index: number) => (element: unknown) => {
    optionRefs.current[index] = element as FocusableElement | null
  }

  const handleKeyDown = (event: RovingKeyEvent, index: number) => {
    if (isRadioActivationKey(event.key)) {
      event.preventDefault?.()
      onSelect(options[index])
      return
    }

    const next = nextRadioIndex(event.key, index, options.length)
    if (next === null) return

    event.preventDefault?.()
    onSelect(options[next])
    optionRefs.current[next]?.focus()
  }

  return { setRef, handleKeyDown }
}
