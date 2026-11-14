import { Button, Input } from '@altersend/components'
import { ClipboardIcon } from '@altersend/components/icons'
import { useTranslation } from '@altersend/locales'
import { ACCOUNT_CODE_DISPLAY_LENGTH } from '@altersend/domain'
import { bridgeApi } from '../../../../api/bridgeApi'
import type { AccountPhaseProps } from './types'

export function CodeEntryField({ model, errorText }: AccountPhaseProps) {
  const { t } = useTranslation(['settings', 'common'])

  const paste = () => {
    bridgeApi
      .clipboardReadText()
      .then(model.setEntry)
      .catch((err) => console.warn('[account] clipboard read failed', err))
  }

  return (
    <Input
      mono
      aria-label={t('settings:account.enterCodeTitle')}
      inputMode='numeric'
      maxLength={ACCOUNT_CODE_DISPLAY_LENGTH}
      autoComplete='off'
      spellCheck={false}
      disabled={model.busy}
      error={errorText ?? undefined}
      value={model.entry}
      placeholder={t('settings:account.codePlaceholder')}
      trailing={
        <Button
          variant='ghost'
          size='sm'
          iconOnly
          aria-label={t('common:actions.paste')}
          disabled={model.busy}
          icon={<ClipboardIcon size={16} />}
          onClick={paste}
        />
      }
      onChange={(e: { target: { value: string } }) => model.setEntry(e.target.value)}
    />
  )
}
