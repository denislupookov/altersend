import { Button } from '@altersend/components'
import { ArrowLeftIcon } from '@altersend/components/icons'
import { useTranslation } from '@altersend/locales'
import { SectionShell } from '../SectionShell'
import { CodeEntryField } from './CodeEntryField'
import type { AccountPhaseProps } from './types'

export function CodeEntry({ model, errorText }: AccountPhaseProps) {
  const { t } = useTranslation(['settings'])

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
      <CodeEntryField model={model} errorText={errorText} />
    </SectionShell>
  )
}
