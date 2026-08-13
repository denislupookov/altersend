import { html } from 'react-strict-dom'
import { useRovingRadio } from '../../a11y/useRovingRadio'
import { RadioOptionRow } from './RadioOptionRow'
import { styles } from './styles'
import type { RadioGroupProps } from './types'

export function RadioGroup<T extends string>({
  options,
  value,
  onChange,
  expansion,
  bare = false,
  disabled = false,
  'aria-label': ariaLabel
}: RadioGroupProps<T>) {
  const select = (option: { value: T }) => {
    if (!disabled && option.value !== value) onChange(option.value)
  }

  const { setRef, handleKeyDown } = useRovingRadio(options, select)

  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value)
  )

  return (
    <html.div role='radiogroup' aria-label={ariaLabel} style={styles.group}>
      {options.map((option, index) => {
        const selected = option.value === value
        const expanded = selected && expansion?.value === option.value
        return (
          <html.div key={option.value} style={styles.optionBlock}>
            {index > 0 && !bare ? <html.div style={styles.divider} /> : null}
            <RadioOptionRow
              option={option}
              selected={selected}
              bare={bare}
              disabled={disabled}
              tabIndex={index === selectedIndex ? 0 : -1}
              onSelect={() => select(option)}
              onKeyDown={(event) => handleKeyDown(event as { key: string }, index)}
              setRef={setRef(index)}
            />
            {expanded ? <html.div style={styles.expansion}>{expansion.content}</html.div> : null}
          </html.div>
        )
      })}
    </html.div>
  )
}
