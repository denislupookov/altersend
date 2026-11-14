import { useState } from 'react'
import { Button } from '@altersend/components'
import { useTranslation } from '@altersend/locales'
import { SectionShell } from '../SectionShell'
import { PurchaseSuccessContent } from './PurchaseSuccessContent'
import { SavedCodeDialog } from './SavedCodeDialog'
import type { AccountPhaseProps } from './types'

export function PurchaseSuccess({ model }: AccountPhaseProps) {
  const { t } = useTranslation(['settings'])
  const [confirmDone, setConfirmDone] = useState(false)

  if (!model.account) return null

  const footer = (
    <div className='flex items-center justify-end'>
      <Button size='sm' variant='primary' onClick={() => setConfirmDone(true)}>
        {t('settings:account.done')}
      </Button>
    </div>
  )

  return (
    <SectionShell footer={footer}>
      <PurchaseSuccessContent model={model} />
      <SavedCodeDialog
        open={confirmDone}
        onConfirm={model.acknowledge}
        onCancel={() => setConfirmDone(false)}
      />
    </SectionShell>
  )
}
