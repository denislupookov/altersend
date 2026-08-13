import { useId } from 'react'
import { html } from 'react-strict-dom'
import { usePressState } from '../../hooks/usePressState'
import { styles } from './styles'
import type { RadioOption } from './types'

type ButtonElementProps = Parameters<typeof html.button>[0]

interface RadioOptionRowProps<T extends string> {
  option: RadioOption<T>
  selected: boolean
  bare: boolean
  disabled: boolean
  tabIndex: 0 | -1
  onSelect(): void
  onKeyDown: NonNullable<ButtonElementProps['onKeyDown']>
  setRef(element: unknown): void
}

export function RadioOptionRow<T extends string>({
  option,
  selected,
  bare,
  disabled,
  tabIndex,
  onSelect,
  onKeyDown,
  setRef
}: RadioOptionRowProps<T>) {
  const { isPressed, pressHandlers } = usePressState()
  const pressed = isPressed && !disabled
  const descriptionId = useId()

  return (
    <html.button
      role='radio'
      aria-checked={selected}
      aria-describedby={option.description ? descriptionId : undefined}
      tabIndex={tabIndex}
      disabled={disabled}
      ref={setRef}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      {...pressHandlers}
      style={[
        styles.option,
        bare ? styles.optionBare : null,
        disabled ? styles.optionDisabled : null
      ]}
    >
      <html.div style={styles.row}>
        <html.div
          style={[
            styles.control,
            selected ? styles.controlSelected : null,
            pressed ? styles.controlPressed : null
          ]}
        >
          <html.div
            style={[
              styles.dot,
              selected ? styles.dotSelected : null,
              selected && pressed ? styles.dotSelectedPressed : null
            ]}
          />
        </html.div>
        <html.span style={styles.label}>{option.label}</html.span>
      </html.div>
      {option.description ? (
        <html.span id={descriptionId} style={styles.description}>
          {option.description}
        </html.span>
      ) : null}
    </html.button>
  )
}
