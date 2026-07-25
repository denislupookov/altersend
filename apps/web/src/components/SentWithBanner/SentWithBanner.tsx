import { Button } from '@altersend/components'
import { useTranslation } from '@altersend/locales'
import { openDownload } from '../../downloadApp'
import { BrandMark } from '../BrandMark'
import { useDownloadCta } from '../../useDownloadCta'
import { BLOCK_WIDTH } from '../Card'

export function SentWithBanner() {
  const { t } = useTranslation(['web'])

  const { label, Icon } = useDownloadCta()

  return (
    <div
      className={`${BLOCK_WIDTH} mt-4 flex items-center gap-3 rounded-2xl border border-border-primary bg-background-subtle p-3 sm:gap-3.5 sm:p-4`}
    >
      <div className='flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3.5'>
        <BrandMark size='md' />
        <div className='min-w-0'>
          <p className='m-0 truncate text-[14px] font-semibold text-text-primary'>
            {t('web:promo.title')}
          </p>
          <p className='m-0 mt-0.5 truncate text-[14px] leading-snug text-text-muted'>
            {t('web:promo.subtitle')}
          </p>
        </div>
      </div>
      <Button variant='primary' size='sm' icon={<Icon size={14} />} onClick={openDownload}>
        {label}
      </Button>
    </div>
  )
}
