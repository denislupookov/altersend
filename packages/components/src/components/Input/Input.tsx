import { useId, type ReactNode } from 'react'
import { html } from 'react-strict-dom'
import { styles } from './styles'

type InputElementProps = Parameters<typeof html.input>[0]

export interface InputProps extends Omit<InputElementProps, 'style'> {
  description?: string
  error?: string
  success?: string
  filled?: boolean
  icon?: ReactNode
  label?: string
  mono?: boolean
  trailing?: ReactNode
}

export function Input({
  description,
  error,
  success,
  filled = false,
  icon,
  id,
  label,
  mono = false,
  trailing,
  ...props
}: InputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const hintId = `${inputId}-hint`
  const hasHint = Boolean(error || success || description)
  const describedBy = hasHint ? hintId : undefined
  const hasError = Boolean(error)
  const useWrapper = Boolean(icon || trailing)

  const fieldStyle = [
    styles.field,
    filled && styles.filled,
    mono && styles.mono,
    hasError && styles.invalid
  ]
  const wrapperStyle = [
    styles.iconWrapper,
    filled && styles.filled,
    hasError && styles.iconWrapperInvalid
  ]

  const renderHint = () => {
    if (error) {
      return (
        <html.p id={hintId} role='alert' style={[styles.hint, styles.error]}>
          {error}
        </html.p>
      )
    }
    if (success) {
      return (
        <html.p id={hintId} role='status' style={[styles.hint, styles.success]}>
          {success}
        </html.p>
      )
    }
    if (description) {
      return (
        <html.p id={hintId} style={styles.hint}>
          {description}
        </html.p>
      )
    }
    return null
  }

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

      {renderHint()}
    </html.div>
  )
}
