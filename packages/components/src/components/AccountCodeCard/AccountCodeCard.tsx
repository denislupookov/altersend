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

  return (
    <html.div style={styles.card}>
      <html.div style={styles.row}>
        <html.div style={styles.text}>
          <html.p style={styles.label}>{label}</html.p>
          <html.p style={styles.code}>
            {masked ? maskAccountCode(code) : formatAccountCode(code)}
          </html.p>
        </html.div>
        <html.div style={styles.actions}>
          {hidden ? (
            <Button
              size='sm'
              variant='ghost'
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
            variant={copied ? 'success' : 'ghost'}
            iconOnly
            aria-label={copied ? copiedLabel : copyLabel}
            icon={copied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
            onClick={onCopy}
          />
          {onSave ? (
            <Button
              size='sm'
              variant={saved ? 'success' : 'ghost'}
              iconOnly
              aria-label={saved ? savedLabel : saveLabel}
              icon={saved ? <CheckIcon size={16} /> : <DownloadIcon size={16} />}
              onClick={onSave}
            />
          ) : null}
        </html.div>
      </html.div>
    </html.div>
  )
}
