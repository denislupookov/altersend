import { Button, Tabs, TabsList, TabsTrigger } from '@altersend/components'
import { useTranslation } from '@altersend/locales'
import { BILLING_PLANS, planComparisonRows, planLabel, type BillingPlan } from '@altersend/domain'
import { HeroBackdrop } from '../../../HeroBackdrop'
import { SectionShell } from '../SectionShell'
import { PlanCellValue } from './PlanCellValue'
import type { AccountPhaseProps } from './types'

const COLUMNS = 'grid grid-cols-[minmax(0,1fr)_72px_104px] items-center gap-x-4'
const FREE_CHECK_SIZE = 15
const PRO_CHECK_SIZE = 17

export function Paywall({ model, errorText }: AccountPhaseProps) {
  const { t } = useTranslation(['settings', 'common'])
  const rows = planComparisonRows(t)

  const footer = (
    <div className='flex items-center justify-between gap-3'>
      <Button size='sm' variant='ghost' disabled={model.busy} onClick={model.showEntry}>
        {t('settings:account.haveCodeLink')}
      </Button>
      <Button size='sm' variant='primary' loading={model.busy} onClick={model.startUpgrade}>
        {t('settings:account.getPro')}
      </Button>
    </div>
  )

  return (
    <SectionShell backdrop={<HeroBackdrop />} footer={footer}>
      <h2 className='m-0 mt-6 text-[30px] font-bold leading-tight tracking-[-0.6px] text-text-primary'>
        {t('settings:account.paywallTitle')}
      </h2>
      <p className='m-0 mt-1.5 text-[15px] leading-[21px] text-text-secondary'>
        {t('settings:account.paywallLead')}
      </p>

      <div className='mt-6'>
        <Tabs
          size='sm'
          stretch
          value={model.plan}
          onValueChange={(next) => model.choosePlan(next as BillingPlan)}
        >
          <TabsList>
            {BILLING_PLANS.map((option) => (
              <TabsTrigger key={option} value={option}>
                {planLabel(option, t, model.prices)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className='relative mt-7'>
        <div className='pointer-events-none absolute inset-y-0 right-0 w-[104px] rounded-2xl border border-border-primary bg-background-subtle' />

        <div className={`${COLUMNS} relative py-3`}>
          <span className='text-[15px] font-semibold text-text-primary'>
            {t('settings:account.included')}
          </span>
          <span className='text-center text-[13px] font-semibold text-text-muted'>
            {t('settings:account.columnFree')}
          </span>
          <span className='justify-self-center rounded-lg bg-surface-primary px-3 py-1.5 text-[13px] font-semibold text-text-primary'>
            {t('settings:account.columnPro')}
          </span>
        </div>

        {rows.map((row, index) => (
          <div
            key={row.label}
            className={`${COLUMNS} relative py-4 ${index === rows.length - 1 ? 'pb-6' : ''}`}
          >
            <span className='text-[14px] leading-[19px] text-text-secondary'>{row.label}</span>
            <PlanCellValue
              cell={row.free}
              className='block text-center text-[14px] text-text-muted'
              size={FREE_CHECK_SIZE}
              tone='muted'
            />
            <PlanCellValue
              cell={row.pro}
              className='block text-center text-[16px] font-semibold text-text-primary'
              size={PRO_CHECK_SIZE}
              tone='primary'
            />
          </div>
        ))}
      </div>

      {errorText ? <p className='m-0 mt-4 text-[12px] text-text-danger'>{errorText}</p> : null}
    </SectionShell>
  )
}
