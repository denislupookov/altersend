import { useState } from 'react'
import { html } from 'react-strict-dom'
import { formatAccountCode, maskAccountCode } from '@altersend/domain'
import { CheckIcon, CopyIcon, EyeIcon, EyeOffIcon } from '../../icons'
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
  onCopy: () => void
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
  onCopy
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
              variant='secondary'
              iconOnly
              aria-label={revealed ? hideLabel : revealLabel}
              icon={revealed ? <EyeOffIcon size={15} /> : <EyeIcon size={15} />}
              onClick={() => setRevealed((current) => !current)}
            />
          ) : null}
          <Button
            size='sm'
            variant='secondary'
            iconOnly
            aria-label={copied ? copiedLabel : copyLabel}
            icon={copied ? <CheckIcon size={15} /> : <CopyIcon size={15} />}
            onClick={onCopy}
          />
        </html.div>
      </html.div>
    </html.div>
  )
}
