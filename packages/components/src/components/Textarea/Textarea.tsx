import { useId, type ReactNode } from 'react'
import { html } from 'react-strict-dom'
import { styles } from './styles'

type TextareaElementProps = Parameters<typeof html.textarea>[0]

export interface TextareaProps extends Omit<TextareaElementProps, 'style'> {
  label?: string
  error?: string
  invalid?: boolean
  footer?: ReactNode
  minHeight?: number
  height?: number
}

export function Textarea({
  label,
  error,
  invalid,
  footer,
  minHeight,
  height,
  id,
  ...props
}: TextareaProps) {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  const hasError = Boolean(error) || Boolean(invalid)

  return (
    <html.div style={styles.root}>
      {label ? (
        <html.label for={fieldId} style={styles.label}>
          {label}
        </html.label>
      ) : null}

      <html.div
        style={[
          styles.box,
          hasError && styles.boxInvalid,
          props.disabled && styles.boxDisabled,
          height ? ({ height } as never) : null
        ]}
      >
        <html.textarea
          {...props}
          id={fieldId}
          aria-invalid={hasError}
          style={[styles.field, minHeight ? ({ minHeight } as never) : null]}
        />
        {footer ? <html.div style={styles.footer}>{footer}</html.div> : null}
      </html.div>

      {error ? <html.p style={[styles.hint, styles.error]}>{error}</html.p> : null}
    </html.div>
  )
}
