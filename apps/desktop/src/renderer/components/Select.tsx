import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { flushSync } from 'react-dom'
import { ChevronDownIcon } from '@altersend/components/icons'

interface SelectOption {
  value: string
  label: string
  fontFamily?: string
}

interface SelectProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  'aria-label': string
  id?: string
  className?: string
}

export function Select({
  value,
  onChange,
  options,
  id,
  className,
  'aria-label': ariaLabel
}: SelectProps) {
  const generatedId = useId()
  const triggerId = id ?? generatedId
  const listboxId = `${triggerId}-listbox`
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const selectedIndex = options.findIndex((option) => option.value === value)
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : null
  const [highlightedIndex, setHighlightedIndex] = useState(selectedIndex >= 0 ? selectedIndex : 0)

  useEffect(() => {
    if (!open) {
      setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0)
      return
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown, true)
    return () => document.removeEventListener('pointerdown', handlePointerDown, true)
  }, [open, selectedIndex])

  const openListbox = (nextIndex = selectedIndex >= 0 ? selectedIndex : 0) => {
    setHighlightedIndex(Math.max(0, Math.min(options.length - 1, nextIndex)))
    setOpen(true)
  }

  const chooseOption = (option: SelectOption) => {
    flushSync(() => setOpen(false))
    if (option.value !== value) onChange(option.value)
  }

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (options.length === 0) return

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        if (!open) {
          openListbox()
        } else {
          setHighlightedIndex((index) => Math.min(options.length - 1, index + 1))
        }
        break
      case 'ArrowUp':
        event.preventDefault()
        if (!open) {
          openListbox()
        } else {
          setHighlightedIndex((index) => Math.max(0, index - 1))
        }
        break
      case 'Home':
        event.preventDefault()
        openListbox(0)
        break
      case 'End':
        event.preventDefault()
        openListbox(options.length - 1)
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        if (open) {
          const highlightedOption = options[highlightedIndex]
          if (highlightedOption) chooseOption(highlightedOption)
        } else {
          openListbox()
        }
        break
      case 'Escape':
        if (open) {
          event.preventDefault()
          setOpen(false)
        }
        break
      case 'Tab':
        setOpen(false)
        break
    }
  }

  return (
    <div ref={rootRef} className={`relative${className ? ` ${className}` : ''}`}>
      <button
        id={triggerId}
        type='button'
        aria-label={ariaLabel}
        aria-haspopup='listbox'
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        className='flex w-full cursor-pointer appearance-none items-center justify-between gap-3 rounded-[10px] border border-border-primary bg-background-subtle py-3 pl-4 pr-3 text-left text-[13px] text-text-primary transition-colors hover:border-border-strong focus:border-border-strong focus:outline-none'
        onClick={() => {
          if (open) setOpen(false)
          else openListbox()
        }}
        onKeyDown={handleTriggerKeyDown}
      >
        <span
          className='min-w-0 flex-1 truncate'
          style={selectedOption?.fontFamily ? { fontFamily: selectedOption.fontFamily } : undefined}
        >
          {selectedOption?.label ?? options[0]?.label}
        </span>
        <span className='shrink-0 text-text-muted'>
          <ChevronDownIcon size={16} />
        </span>
      </button>

      {open ? (
        <div
          id={listboxId}
          role='listbox'
          aria-label={ariaLabel}
          className='absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-[220px] overflow-y-auto rounded-[10px] border border-border-primary bg-surface-primary p-1 shadow-xl'
        >
          {options.map((option, index) => {
            const selected = option.value === value
            const highlighted = index === highlightedIndex

            return (
              <button
                key={option.value}
                type='button'
                role='option'
                aria-selected={selected}
                className={`flex w-full appearance-none items-center rounded-[8px] border-0 bg-transparent px-3 py-2 text-left text-[13px] transition-colors ${
                  selected || highlighted
                    ? 'bg-surface-secondary text-text-primary'
                    : 'text-text-secondary hover:bg-surface-secondary hover:text-text-primary'
                }`}
                style={option.fontFamily ? { fontFamily: option.fontFamily } : undefined}
                onMouseEnter={() => setHighlightedIndex(index)}
                onClick={() => chooseOption(option)}
              >
                <span className='min-w-0 flex-1 truncate'>{option.label}</span>
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
