import { html } from 'react-strict-dom'
import { CloseIcon, SendIcon } from '../../icons'
import { Button } from '../Button'
import { Input } from '../Input'
import { ExternalLink } from '../ExternalLink'
import { RadioGroup } from '../Radio'
import type { RadioOption } from '../Radio'
import { styles } from './styles'
import type { RelayMode } from '@altersend/domain'
import type { RelaySettingsCardProps } from './types'

const MODES: RelayMode[] = ['altersend', 'custom', 'off']

type FallbackMode = 'stay' | 'altersend'

export function RelaySettingsCard({
  form,
  labels,
  errorText,
  successText,
  pasteAction,
  onOpenSetupGuide,
  autoCapitalize,
  autoComplete,
  spellCheck,
  iconSize = 16
}: RelaySettingsCardProps) {
  const modeOptions: RadioOption<RelayMode>[] = MODES.map((mode) => ({
    value: mode,
    label: labels.modes[mode].label,
    description: labels.modes[mode].caption
  }))

  const fallbackOptions: RadioOption<FallbackMode>[] = [
    { value: 'stay', label: labels.fallbackStay.label, description: labels.fallbackStay.caption },
    {
      value: 'altersend',
      label: labels.fallbackAltersend.label,
      description: labels.fallbackAltersend.caption
    }
  ]

  const fieldAction = () => {
    if (form.code.trim().length > 0) {
      return (
        <Button
          variant='surface'
          size='sm'
          iconOnly
          aria-label={labels.apply}
          loading={form.testState === 'testing'}
          disabled={form.busy}
          icon={<SendIcon size={iconSize} />}
          onClick={form.submit}
        />
      )
    }
    if (form.applied) {
      return (
        <Button
          variant='surface'
          size='sm'
          iconOnly
          aria-label={labels.clear}
          disabled={form.busy}
          icon={<CloseIcon size={iconSize} />}
          onClick={form.clear}
        />
      )
    }
    return pasteAction ?? null
  }

  const customPanel = (
    <>
      <html.p style={styles.title}>{labels.selfhostTitle}</html.p>
      <html.p style={styles.description}>
        {labels.selfhostDescription}
        {onOpenSetupGuide ? (
          <>
            {' '}
            <ExternalLink onPress={onOpenSetupGuide}>{labels.setupGuide}</ExternalLink>
          </>
        ) : null}
      </html.p>
      <html.div style={styles.field}>
        <Input
          mono
          aria-label={labels.selfhostTitle}
          placeholder={labels.placeholder}
          value={form.code}
          error={errorText}
          success={successText}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          spellCheck={spellCheck}
          trailing={fieldAction()}
          onChange={(event: { target: { value: string } }) => form.setCode(event.target.value)}
          onKeyDown={(event: { key: string }) => {
            if (event.key === 'Enter') form.submit()
          }}
        />
      </html.div>
      <html.p style={[styles.title, styles.fallbackTitle]}>{labels.fallbackTitle}</html.p>
      <RadioGroup
        bare
        options={fallbackOptions}
        value={form.fallback ? 'altersend' : 'stay'}
        onChange={(value) => form.setFallback(value === 'altersend')}
        aria-label={labels.fallbackTitle}
      />
    </>
  )

  return (
    <html.div>
      <html.div style={styles.card}>
        <RadioGroup
          options={modeOptions}
          value={form.selected}
          onChange={form.selectMode}
          expansion={{ value: 'custom', content: customPanel }}
          aria-label={labels.groupLabel}
        />
      </html.div>
      {form.error === 'failed' && form.selected !== 'custom' ? (
        <html.p style={styles.commitError}>{labels.commitFailed}</html.p>
      ) : null}
    </html.div>
  )
}
