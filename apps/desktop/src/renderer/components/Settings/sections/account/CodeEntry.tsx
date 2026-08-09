import { Button, Input } from '@altersend/components'
import { ArrowLeftIcon, ClipboardIcon } from '@altersend/components/icons'
import { useTranslation } from '@altersend/locales'
import { ACCOUNT_CODE_DISPLAY_LENGTH } from '@altersend/domain'
import { bridgeApi } from '../../../../api/bridgeApi'
import { SectionShell } from '../SectionShell'
import type { AccountPhaseProps } from './types'

export function CodeEntry({ model, errorText }: AccountPhaseProps) {
  const { t } = useTranslation(['settings', 'common'])

  const paste = () => {
    bridgeApi
      .clipboardReadText()
      .then(model.setEntry)
      .catch((err) => console.warn('[account] clipboard read failed', err))
  }

  const footer = (
    <div className='flex items-center justify-end'>
      <Button
        size='sm'
        variant='primary'
        loading={model.busy}
        disabled={!model.codeReady}
        onClick={model.activate}
      >
        {t('settings:account.activate')}
      </Button>
    </div>
  )

  const backButton = (
    <Button
      size='sm'
      variant='ghost'
      iconOnly
      aria-label={t('settings:account.back')}
      icon={<ArrowLeftIcon size={16} />}
      disabled={model.busy}
      onClick={model.showPaywall}
    />
  )

  return (
    <SectionShell title={t('settings:account.enterCodeTitle')} leading={backButton} footer={footer}>
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
    </SectionShell>
  )
}
