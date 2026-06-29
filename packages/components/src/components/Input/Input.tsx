import { useId, type ReactNode } from 'react'
import { html } from 'react-strict-dom'
import { styles } from './styles'

type InputElementProps = Parameters<typeof html.input>[0]

export interface InputProps extends Omit<InputElementProps, 'style'> {
  description?: string
  error?: string
  icon?: ReactNode
  label?: string
  mono?: boolean
  trailing?: ReactNode
}

export function Input({
  description,
  error,
  icon,
  id,
  label,
  mono = false,
  trailing,
  ...props
}: InputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const descriptionId = description ? `${inputId}-description` : undefined
  const errorId = error ? `${inputId}-error` : undefined
  const describedBy =
    [descriptionId, errorId]
      .filter((value): value is string => typeof value === 'string')
      .join(' ') || undefined
  const hasError = Boolean(error)
  const useWrapper = Boolean(icon || trailing)

  const fieldStyle = [styles.field, mono && styles.mono, hasError && styles.invalid]
  const wrapperStyle = [styles.iconWrapper, hasError && styles.iconWrapperInvalid]

  return (
    <html.div style={styles.root}>
      {label ? (
        <html.label for={inputId} style={styles.label}>
          {label}
        </html.label>
      ) : null}

      {useWrapper ? (
        <html.div style={wrapperStyle}>
          {icon ? <html.div style={styles.iconSlot}>{icon}</html.div> : null}
          <html.input
            {...props}
            aria-describedby={describedBy}
            aria-invalid={hasError}
            id={inputId}
            style={mono ? [styles.inputInner, styles.inputInnerMono] : styles.inputInner}
          />
          {trailing ? <html.div style={styles.trailingSlot}>{trailing}</html.div> : null}
        </html.div>
      ) : (
        <html.input
          {...props}
          aria-describedby={describedBy}
          aria-invalid={hasError}
          id={inputId}
          style={fieldStyle}
        />
      )}

      {error ? (
        <html.p id={errorId} style={[styles.hint, styles.error]}>
          {error}
        </html.p>
      ) : description ? (
        <html.p id={descriptionId} style={styles.hint}>
          {description}
        </html.p>
      ) : null}
    </html.div>
  )
}
