import { useState } from 'react'
import { html } from 'react-strict-dom'
import { formatAccountCode, maskAccountCode } from '@altersend/domain'
import { CheckIcon, CopyIcon, DownloadIcon, EyeIcon, EyeOffIcon } from '../../icons'
import { Button } from '../Button'
import { styles } from './styles'

export interface AccountCodeCardProps {
  code: string
  label: string
  copyLabel: string
  copiedLabel: string
  copied?: boolean
  hidden?: boolean
  inline?: boolean
  attached?: boolean
  revealLabel?: string
  hideLabel?: string
  saveLabel?: string
  savedLabel?: string
  saved?: boolean
  onCopy: () => void
  onSave?: () => void
  onToggleReveal?: (revealed: boolean) => void
}

export function AccountCodeCard({
  code,
  label,
  copyLabel,
  copiedLabel,
  copied = false,
  hidden = false,
  inline = false,
  attached = false,
  revealLabel,
  hideLabel,
  saveLabel,
  savedLabel,
  saved = false,
  onCopy,
  onSave,
  onToggleReveal
}: AccountCodeCardProps) {
  const [revealed, setRevealed] = useState(false)
  const masked = hidden && !revealed
  const value = masked ? maskAccountCode(code) : formatAccountCode(code)

  const actions = (
    <html.div style={styles.actions}>
      {hidden ? (
        <Button
          size='sm'
          variant='surface'
          iconOnly
          aria-label={revealed ? hideLabel : revealLabel}
          icon={revealed ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
          onClick={() => {
            setRevealed((current) => !current)
            onToggleReveal?.(!revealed)
          }}
        />
      ) : null}
      <Button
        size='sm'
        variant={copied ? 'success' : 'surface'}
        iconOnly
        aria-label={copied ? copiedLabel : copyLabel}
        icon={copied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
        onClick={onCopy}
      />
      {onSave ? (
        <Button
          size='sm'
          variant={saved ? 'success' : 'surface'}
          iconOnly
          aria-label={saved ? savedLabel : saveLabel}
          icon={saved ? <CheckIcon size={16} /> : <DownloadIcon size={16} />}
          onClick={onSave}
        />
      ) : null}
    </html.div>
  )

  return (
    <html.div style={[styles.card, attached && styles.cardAttached]}>
      <html.div style={[styles.row, inline && styles.rowInline]}>
        {inline ? (
          <>
            <html.p style={styles.inlineLabel}>{label}</html.p>
            <html.p style={[styles.code, styles.codeInline]}>{value}</html.p>
          </>
        ) : (
          <html.div style={styles.text}>
            <html.p style={styles.label}>{label}</html.p>
            <html.p style={styles.code}>{value}</html.p>
          </html.div>
        )}
        {actions}
      </html.div>
    </html.div>
  )
}
